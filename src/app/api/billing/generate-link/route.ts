// API route for generating shareable quote links
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
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
const db = getFirestore();

interface GenerateLinkRequest extends QuoteRequest {
  generateQuoteOnly?: boolean; // If true, only generate quote without sending to PandaDoc
  saveToDatabase?: boolean;    // If true, save quote data to Firestore
  organizationId?: string;     // For database saving
}

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

    const decodedToken = await auth.verifyIdToken(token);

    // Parse request body
    const body: GenerateLinkRequest = await request.json();
    
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

    // Generate link ID
    const linkId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // If generateQuoteOnly is true, skip PandaDoc and just return calculated data
    if (body.generateQuoteOnly) {
      const { calculateQuoteTotals } = await import('@/lib/pandadoc-api');
      const calculations = calculateQuoteTotals(body.productos);
      
      const quoteData = {
        id: linkId,
        cliente: body.cliente,
        correo: body.correo,
        productos: body.productos,
        templateType: body.templateType || 'standard',
        calculations,
        createdAt: new Date().toISOString(),
        createdBy: decodedToken.uid
      };

      // Save to database if requested
      if (body.saveToDatabase && body.organizationId) {
        try {
          await db.collection('quote_links').doc(linkId).set({
            ...quoteData,
            organizationId: body.organizationId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            views: 0,
            status: 'draft'
          });
        } catch (saveError) {
          console.error('Error saving quote link to database:', saveError);
          // Don't fail the request if database save fails
        }
      }

      return NextResponse.json({
        success: true,
        linkId,
        quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quote/${linkId}`,
        quoteData,
        message: 'Enlace de cotización generado exitosamente'
      });
    }

    // Send to PandaDoc
    const result = await sendQuoteToPandaDoc(body);

    if (result.success) {
      const quoteData = {
        id: linkId,
        cliente: body.cliente,
        correo: body.correo,
        productos: body.productos,
        templateType: body.templateType || 'standard',
        pandaDocId: result.documentId,
        pandaDocUrl: result.viewUrl,
        createdAt: new Date().toISOString(),
        createdBy: decodedToken.uid
      };

      // Save to database if requested
      if (body.saveToDatabase && body.organizationId) {
        try {
          await db.collection('quote_links').doc(linkId).set({
            ...quoteData,
            organizationId: body.organizationId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            views: 0,
            status: 'sent'
          });
        } catch (saveError) {
          console.error('Error saving quote link to database:', saveError);
        }
      }

      return NextResponse.json({
        success: true,
        linkId,
        quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quote/${linkId}`,
        pandaDocUrl: result.viewUrl,
        documentId: result.documentId,
        message: 'Cotización enviada y enlace generado exitosamente'
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
    console.error('Error generating quote link:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve link information
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get('linkId');

  if (!linkId) {
    return NextResponse.json(
      { error: 'linkId es requerido' },
      { status: 400 }
    );
  }

  try {
    const doc = await db.collection('quote_links').doc(linkId).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Enlace de cotización no encontrado' },
        { status: 404 }
      );
    }

    const data = doc.data();
    
    // Check if expired
    if (data?.expiresAt && new Date(data.expiresAt.toDate()) < new Date()) {
      return NextResponse.json(
        { error: 'Enlace de cotización expirado' },
        { status: 410 }
      );
    }

    // Increment view count
    try {
      await db.collection('quote_links').doc(linkId).update({
        views: (data?.views || 0) + 1,
        lastViewedAt: new Date()
      });
    } catch (updateError) {
      console.error('Error updating view count:', updateError);
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: linkId,
        cliente: data?.cliente,
        correo: data?.correo,
        productos: data?.productos,
        templateType: data?.templateType,
        calculations: data?.calculations,
        createdAt: data?.createdAt,
        views: (data?.views || 0) + 1,
        pandaDocUrl: data?.pandaDocUrl
      }
    });

  } catch (error) {
    console.error('Error retrieving quote link:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}