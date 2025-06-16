// API route for monthly quote generation (migrated from generar_cotizacion_mensual.py)
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

    // Force monthly template
    body.templateType = 'monthly';

    // Send quote to PandaDoc
    const result = await sendQuoteToPandaDoc(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Cotización mensual enviada correctamente',
        documentId: result.documentId,
        viewUrl: result.viewUrl,
        pandaDocUrl: result.viewUrl,
        templateType: 'monthly'
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Error al enviar cotización mensual a PandaDoc',
          details: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating monthly quote:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve example payload structure for monthly quotes
export async function GET() {
  const exampleRequest = {
    cliente: "JUMBO",
    correo: "contacto@jumbo.com",
    productos: [
      {
        name: "Hiopos Punto de venta",
        cantidad: 2,
        descuento: 7,
        paymentType: "unico"
      },
      {
        name: "TPV Hiopos SUN II con doble pantalla",
        cantidad: 1,
        descuento: 7,
        paymentType: "unico"
      },
      {
        name: "Retail Mobile",
        cantidad: 1,
        descuento: 5,
        paymentType: "unico"
      },
      {
        name: "HiOffice Lite",
        cantidad: 2,
        descuento: 0,
        paymentType: "mensual"
      },
      {
        name: "Ecommerce Lite",
        cantidad: 1,
        descuento: 0,
        paymentType: "mensual"
      },
      {
        name: "HiOffice Gold",
        cantidad: 21,
        descuento: 0,
        paymentType: "mensual"
      }
    ]
  };

  return NextResponse.json({
    message: "API para generación de cotizaciones mensuales",
    method: "POST",
    description: "Genera cotizaciones usando el template mensual de PandaDoc con opciones de pago dividido",
    exampleRequest,
    features: [
      "Soporte para pagos únicos y mensuales",
      "Cálculo automático de pagos divididos (50/50)",
      "Template especializado para pagos recurrentes"
    ],
    availableProducts: "Consultar /api/billing/products para ver catálogo completo"
  });
}