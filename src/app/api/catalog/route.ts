import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import admin from "@/lib/firebaseAdmin"; // ✅ Correcto

// Define the UserProduct interface
interface UserProduct {
  name?: string;
  productName?: string;
  title?: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get organization ID from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId es requerido' }, { status: 400 });
    }

    const db = firestoreDbAdmin;
    
    let products: string[] = [];
    let services: string[] = [];
    let targetAudience: string[] = [];

    try {
      // Try to get user products
      const userProductsRef = db.collection('userProducts')
        // .where('userId', '==', userId)
        // .where('organizationId', '==', organizationId);
      
      const userProductsSnapshot = await userProductsRef.get();
      
      if (!userProductsSnapshot.empty) {
        products = userProductsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => {
          const data: UserProduct = doc.data() as UserProduct;
          return data.name || data.productName || data.title || 'Producto sin nombre';
        }).filter((name: string) => name && name !== 'Producto sin nombre');
      }
    } catch (error) {
      console.log('userProducts table not found or error accessing it:', error);
    }

    try {
      // Try to get user services
      const userServicesRef = db.collection('userServices')
        // .where('userId', '==', userId)
        // .where('organizationId', '==', organizationId);
      
      const userServicesSnapshot = await userServicesRef.get();
      
      if (!userServicesSnapshot.empty) {
        services = userServicesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => {
          interface UserService {
            name?: string;
            serviceName?: string;
            title?: string;
            [key: string]: any;
          }
          const data: UserService = doc.data() as UserService;
          return data.name || data.serviceName || data.title || 'Servicio sin nombre';
        }).filter((name: string) => name && name !== 'Servicio sin nombre');
      }
    } catch (error) {
      console.log('userServices table not found or error accessing it:', error);
    }

    // Try to get target audience from organization or user profile
    try {
      const orgRef = db.collection('organizations').doc(organizationId);
      const orgSnapshot = await orgRef.get();
      
      if (orgSnapshot.exists) {
        const orgData = orgSnapshot.data();
        if (orgData?.targetAudience && Array.isArray(orgData.targetAudience)) {
          targetAudience = orgData.targetAudience;
        } else if (orgData?.industry || orgData?.sector) {
          // Generate target audience based on industry
          targetAudience = generateTargetAudienceFromIndustry(orgData.industry || orgData.sector);
        }
      }
    } catch (error) {
      console.log('Error getting organization data:', error);
    }

    // If no real data found, provide helpful fallbacks
    if (products.length === 0 && services.length === 0) {
      return NextResponse.json({
        products: [],
        services: [],
        targetAudience: [],
        isEmpty: true,
        message: 'No se encontraron productos o servicios en tu catálogo. Puedes agregar algunos en la sección de configuración.'
      });
    }

    // Generate default target audience if none found
    if (targetAudience.length === 0) {
      targetAudience = [
        "Pequeñas empresas",
        "Empresarios",
        "Startups",
        "Profesionales independientes",
        "Empresas locales"
      ];
    }

    return NextResponse.json({
      products,
      services,
      targetAudience,
      isEmpty: false,
      stats: {
        productsCount: products.length,
        servicesCount: services.length,
        audienceCount: targetAudience.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching catalog data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

function generateTargetAudienceFromIndustry(industry: string): string[] {
  const industryMap: Record<string, string[]> = {
    'technology': ['Startups', 'Empresas tecnológicas', 'Desarrolladores', 'Empresas de software'],
    'healthcare': ['Clínicas', 'Hospitales', 'Profesionales de la salud', 'Pacientes'],
    'retail': ['Tiendas', 'E-commerce', 'Comerciantes', 'Consumidores finales'],
    'food': ['Restaurantes', 'Cafeterías', 'Servicios de catering', 'Food trucks'],
    'education': ['Escuelas', 'Universidades', 'Estudiantes', 'Profesores'],
    'finance': ['Bancos', 'Aseguradoras', 'Inversores', 'Asesores financieros'],
    'real_estate': ['Inmobiliarias', 'Desarrolladores', 'Compradores', 'Inversores inmobiliarios'],
    'consulting': ['Empresas', 'Ejecutivos', 'Emprendedores', 'Organizaciones']
  };

  return industryMap[industry.toLowerCase()] || [
    'Pequeñas empresas',
    'Empresarios',
    'Profesionales',
    'Empresas locales'
  ];
}