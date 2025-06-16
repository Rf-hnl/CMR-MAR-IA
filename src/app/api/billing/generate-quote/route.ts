// API route for standard quote generation (migrated from generar_cotizacion.py)
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { sendQuoteToPandaDoc, validateQuoteRequest, type QuoteRequest } from '@/lib/pandadoc-api';

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

const auth = getAuth();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    await auth.verifyIdToken(token);

    // Parse request body
    const body: QuoteRequest = await request.json();
    
    // Validate request
    const validationErrors = validateQuoteRequest(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: validationErrors 
        },
        { status: 400 }
      );
    }

    // Force standard template
    body.templateType = 'standard';

    // Send quote to PandaDoc
    const result = await sendQuoteToPandaDoc(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Cotización enviada correctamente',
        documentId: result.documentId,
        viewUrl: result.viewUrl,
        pandaDocUrl: result.viewUrl
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Error al enviar cotización a PandaDoc',
          details: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating standard quote:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve example payload structure
export async function GET() {
  const exampleRequest = {
    cliente: "Restaurante Ejemplo",
    correo: "contacto@restaurante.com",
    productos: [
      {
        name: "Hioscreen Android 21.5\" (pantalla de cocina)",
        cantidad: 2,
        descuento: 7,
        paymentType: "unico"
      },
      {
        name: "HiOffice Lite",
        cantidad: 2,
        descuento: 0,
        paymentType: "mensual"
      },
      {
        name: "TPV Hiopos SUN II pantalla single",
        cantidad: 1,
        descuento: 0,
        paymentType: "unico"
      }
    ]
  };

  return NextResponse.json({
    message: "API para generación de cotizaciones estándar",
    method: "POST",
    description: "Genera cotizaciones usando el template estándar de PandaDoc",
    exampleRequest,
    availableProducts: "Consultar /api/billing/products para ver catálogo completo"
  });
}