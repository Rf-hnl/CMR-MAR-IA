import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already done
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

interface SaveQuoteRequest {
  quoteData: any;
  leadId?: string;
  leadName: string;
  businessType: string;
  organizationId: string;
}

interface UpdateQuoteStatusRequest {
  quoteId: string;
  status: 'sent' | 'viewed' | 'accepted' | 'rejected';
  organizationId: string;
}

// GET - Obtener cotizaciones de una organización
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    await auth.verifyIdToken(token);

    // Obtener cotizaciones de la organización
    const quotesRef = db.collection('quotes');
    const snapshot = await quotesRef
      .where('organizationId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .get();

    const quotes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      sentAt: doc.data().sentAt?.toDate?.() || (doc.data().sentAt ? new Date(doc.data().sentAt) : undefined),
      viewedAt: doc.data().viewedAt?.toDate?.() || (doc.data().viewedAt ? new Date(doc.data().viewedAt) : undefined),
      validUntil: doc.data().validUntil?.toDate?.() || new Date(doc.data().validUntil),
    }));

    return NextResponse.json({ quotes });

  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}

// POST - Guardar nueva cotización
export async function POST(request: NextRequest) {
  try {
    const body: SaveQuoteRequest = await request.json();
    
    if (!body.quoteData || !body.leadName || !body.businessType || !body.organizationId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: quoteData, leadName, businessType, organizationId' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const decodedToken = await auth.verifyIdToken(token);

    // Procesar datos de la cotización
    const quoteData = body.quoteData;
    const recommendedPackage = quoteData.paquetes_sugeridos?.[0] || {};
    
    // Crear documento de cotización
    const quoteDoc = {
      // Información básica
      leadId: body.leadId || null,
      leadName: body.leadName,
      businessType: body.businessType,
      organizationId: body.organizationId,
      userId: decodedToken.uid,
      
      // Datos de la cotización
      titulo: quoteData.titulo,
      packageName: recommendedPackage.nombre || 'Paquete Personalizado',
      totalAmount: recommendedPackage.precio_paquete || quoteData.resumen_financiero?.precio_recomendado || 0,
      
      // Estado y fechas
      status: 'draft',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      
      // Metadata
      metadata: {
        items: recommendedPackage.items?.length || 0,
        discount: recommendedPackage.descuento_aplicado || null,
        aiGenerated: true,
        version: '1.0'
      },
      
      // Datos completos de la cotización (para vista detallada)
      fullQuoteData: quoteData
    };

    // Guardar en Firestore
    const docRef = await db.collection('quotes').add(quoteDoc);
    
    console.log('Quote saved successfully:', docRef.id);

    return NextResponse.json({
      success: true,
      quoteId: docRef.id,
      message: 'Cotización guardada exitosamente'
    });

  } catch (error) {
    console.error('Error saving quote:', error);
    return NextResponse.json(
      { error: 'Error al guardar cotización' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado de cotización
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateQuoteStatusRequest = await request.json();
    
    if (!body.quoteId || !body.status || !body.organizationId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: quoteId, status, organizationId' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    await auth.verifyIdToken(token);

    // Actualizar documento
    const quoteRef = db.collection('quotes').doc(body.quoteId);
    const updateData: any = {
      status: body.status,
      updatedAt: new Date()
    };

    // Agregar timestamp específico según el estado
    switch (body.status) {
      case 'sent':
        updateData.sentAt = new Date();
        break;
      case 'viewed':
        updateData.viewedAt = new Date();
        break;
      case 'accepted':
      case 'rejected':
        updateData.resolvedAt = new Date();
        break;
    }

    await quoteRef.update(updateData);

    console.log('Quote status updated:', body.quoteId, body.status);

    return NextResponse.json({
      success: true,
      message: 'Estado de cotización actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating quote status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado de cotización' },
      { status: 500 }
    );
  }
}