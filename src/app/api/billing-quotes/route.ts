// API for managing Billing Quotes (PandaDoc Quotes) in Firestore
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { 
  sendQuoteToPandaDoc, 
  validateQuoteRequest, 
  calculateQuoteTotals,
  type QuoteRequest 
} from '@/lib/pandadoc-api';
import { PRICING_CATALOG } from '@/data/pricing';
import type { 
  BillingQuote, 
  CreateBillingQuoteRequest, 
  UpdateBillingQuoteRequest,
  BillingQuoteProduct,
  BillingQuoteCalculation
} from '@/types/billing-quotes';

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

// Helper function to convert quote products to billing quote products
function convertToQuoteProducts(products: CreateBillingQuoteRequest['products']): BillingQuoteProduct[] {
  return products.map(product => {
    const precio_unitario = PRICING_CATALOG[product.name as keyof typeof PRICING_CATALOG] || 0;
    const subtotal = precio_unitario * product.cantidad;
    const descuento_valor = (precio_unitario * product.descuento / 100) * product.cantidad;
    const precio_total = subtotal - descuento_valor;
    
    return {
      name: product.name,
      cantidad: product.cantidad,
      descuento: product.descuento,
      paymentType: product.paymentType,
      price: precio_unitario,
      categoria: 'general', // TODO: Map from ORGANIZED_CATALOG
      precio_unitario,
      precio_total,
      subtotal,
      descuento_valor
    };
  });
}

// Helper function to create billing quote calculations
function createQuoteCalculations(products: BillingQuoteProduct[]): BillingQuoteCalculation {
  let total_lista = 0;
  let total_descuento = 0;
  let pago_unico_total = 0;
  let pago_mensual_total = 0;

  products.forEach(product => {
    total_lista += product.subtotal;
    total_descuento += product.descuento_valor;

    if (product.paymentType === 'unico') {
      pago_unico_total += product.precio_total;
    } else {
      pago_mensual_total += product.precio_total;
    }
  });

  const total_impuestos = (pago_unico_total + pago_mensual_total) * 0.07;
  const total_final = total_lista - total_descuento + total_impuestos;
  const pago_unico_total_con_impuesto = pago_unico_total * 1.07;
  const pago_mensual_total_con_impuesto = pago_mensual_total * 1.07;

  return {
    total_lista,
    total_descuento,
    pago_unico_total,
    pago_mensual_total,
    total_impuestos,
    total_final,
    pago_unico_total_con_impuesto,
    pago_mensual_total_con_impuesto,
    pago_unico_50_1: pago_unico_total_con_impuesto / 2,
    pago_unico_50_2: pago_unico_total_con_impuesto / 2,
  };
}

// GET - Fetch billing quotes for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const templateType = searchParams.get('templateType');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    await auth.verifyIdToken(token);

    // Build query
    let query = db.collection('billing_quotes')
      .where('organizationId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status) as any;
    }

    if (templateType) {
      query = query.where('templateType', '==', templateType) as any;
    }

    const snapshot = await query.get();

    const quotes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        sentAt: data.sentAt?.toDate?.() || undefined,
        viewedAt: data.viewedAt?.toDate?.() || undefined,
        acceptedAt: data.acceptedAt?.toDate?.() || undefined,
        rejectedAt: data.rejectedAt?.toDate?.() || undefined,
        expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
        validUntil: data.validUntil?.toDate?.() || new Date(data.validUntil),
        termsAcceptedAt: data.termsAcceptedAt?.toDate?.() || undefined,
      };
    });

    // Calculate stats
    const stats = {
      total: quotes.length,
      byStatus: quotes.reduce((acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byTemplateType: quotes.reduce((acc, quote) => {
        acc[quote.templateType] = (acc[quote.templateType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalValue: quotes.reduce((sum, quote) => sum + (quote.calculations?.total_final || 0), 0),
      averageValue: quotes.length > 0 ? quotes.reduce((sum, quote) => sum + (quote.calculations?.total_final || 0), 0) / quotes.length : 0,
      acceptanceRate: quotes.length > 0 ? (quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100 : 0,
      viewRate: quotes.length > 0 ? (quotes.filter(q => q.status === 'viewed' || q.status === 'accepted').length / quotes.length) * 100 : 0,
    };

    return NextResponse.json({ 
      success: true,
      quotes,
      stats
    });

  } catch (error) {
    console.error('Error fetching billing quotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}

// POST - Create new billing quote and send to PandaDoc
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

    const body: CreateBillingQuoteRequest & { organizationId: string } = await request.json();
    
    if (!body.organizationId || !body.clientName || !body.clientEmail || !body.products?.length) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: organizationId, clientName, clientEmail, products' },
        { status: 400 }
      );
    }

    // Convert and calculate
    const quoteProducts = convertToQuoteProducts(body.products);
    const calculations = createQuoteCalculations(quoteProducts);
    
    // Create billing quote document
    const now = new Date();
    const quoteId = `bq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const billingQuote: Omit<BillingQuote, 'id'> = {
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      businessType: body.businessType,
      leadId: body.leadId,
      leadName: body.clientName,
      organizationId: body.organizationId,
      userId: decodedToken.uid,
      templateType: body.templateType,
      products: quoteProducts,
      calculations,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      validUntil: body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      locale: 'es-ES',
      taxRate: 0.07,
      metadata: {
        version: '1.0',
        source: body.leadId ? 'lead' : 'manual',
        totalProducts: quoteProducts.length,
        hasDiscounts: quoteProducts.some(p => p.descuento > 0),
        hasRecurringItems: quoteProducts.some(p => p.paymentType === 'mensual'),
        viewCount: 0,
      },
      notes: body.notes,
      priority: body.priority || 'medium',
    };

    // Save to Firestore first
    const docRef = await db.collection('billing_quotes').doc(quoteId).set(billingQuote);
    
    console.log('Billing quote saved to database:', quoteId);

    // Prepare PandaDoc request
    const pandaDocRequest: QuoteRequest = {
      cliente: body.clientName,
      correo: body.clientEmail,
      productos: body.products,
      templateType: body.templateType
    };

    // Send to PandaDoc
    const pandaDocResult = await sendQuoteToPandaDoc(pandaDocRequest);

    if (pandaDocResult.success) {
      // Update with PandaDoc info
      await db.collection('billing_quotes').doc(quoteId).update({
        pandaDocId: pandaDocResult.documentId,
        pandaDocUrl: pandaDocResult.viewUrl,
        pandaDocStatus: 'sent',
        status: 'generated',
        sentAt: new Date(),
        updatedAt: new Date(),
        'auditLog': [{
          action: 'pandadoc_sent',
          timestamp: new Date(),
          userId: decodedToken.uid,
          details: { documentId: pandaDocResult.documentId }
        }]
      });

      return NextResponse.json({
        success: true,
        quoteId,
        message: 'Cotización creada y enviada a PandaDoc exitosamente',
        documentId: pandaDocResult.documentId,
        viewUrl: pandaDocResult.viewUrl,
        pandaDocUrl: pandaDocResult.viewUrl,
        calculations
      });
    } else {
      // Update status to indicate PandaDoc failure but keep the quote
      await db.collection('billing_quotes').doc(quoteId).update({
        status: 'draft',
        updatedAt: new Date(),
        'metadata.pandaDocError': pandaDocResult.error,
        'auditLog': [{
          action: 'pandadoc_failed',
          timestamp: new Date(),
          userId: decodedToken.uid,
          details: { error: pandaDocResult.error }
        }]
      });

      return NextResponse.json({
        success: false,
        quoteId,
        error: 'Cotización guardada pero error al enviar a PandaDoc',
        details: pandaDocResult.error,
        calculations
      }, { status: 207 }); // 207 Multi-Status (partial success)
    }

  } catch (error) {
    console.error('Error creating billing quote:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear cotización',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update billing quote
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const decodedToken = await auth.verifyIdToken(token);
    const body: UpdateBillingQuoteRequest = await request.json();
    
    if (!body.quoteId) {
      return NextResponse.json(
        { error: 'quoteId es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    // Add fields that are being updated
    if (body.status) updateData.status = body.status;
    if (body.pandaDocStatus) updateData.pandaDocStatus = body.pandaDocStatus;
    if (body.notes) updateData.notes = body.notes;
    if (body.internalComments) updateData.internalComments = body.internalComments;
    if (body.tags) updateData.tags = body.tags;
    if (body.priority) updateData.priority = body.priority;
    if (body.assignedTo) updateData.assignedTo = body.assignedTo;

    // Add status-specific timestamps
    if (body.status === 'sent' && !updateData.sentAt) {
      updateData.sentAt = new Date();
    }
    if (body.status === 'viewed' && !updateData.viewedAt) {
      updateData.viewedAt = new Date();
    }
    if (body.status === 'accepted' && !updateData.acceptedAt) {
      updateData.acceptedAt = new Date();
    }
    if (body.status === 'rejected' && !updateData.rejectedAt) {
      updateData.rejectedAt = new Date();
    }

    await db.collection('billing_quotes').doc(body.quoteId).update(updateData);

    console.log('Billing quote updated:', body.quoteId);

    return NextResponse.json({
      success: true,
      message: 'Cotización actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating billing quote:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    );
  }
}