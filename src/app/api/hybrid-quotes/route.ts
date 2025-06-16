// Hybrid API: AI Quote Generation + PandaDoc Integration
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { 
  mapAIQuoteToPandaDoc, 
  enhanceQuoteWithBusinessLogic,
  validateMappingCoverage
} from '@/lib/ai-pandadoc-mapper';
import { sendQuoteToPandaDoc, type QuoteRequest } from '@/lib/pandadoc-api';
import type { QuoteData } from '@/components/QuoteGeneratorModal';
import type { BillingQuote, CreateBillingQuoteRequest } from '@/types/billing-quotes';

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

interface HybridQuoteRequest {
  // Lead information
  leadName: string;
  businessType: string;
  organizationId: string;
  leadId?: string;
  
  // Client contact info
  clientEmail?: string;
  
  // AI generation parameters
  leadInfo?: {
    necesidades?: string[];
    presupuesto_estimado?: string;
    tamaño_empresa?: string;
  };
  requerimientos_especiales?: string[];
  contexto_adicional?: string;
  
  // PandaDoc options
  templateType?: 'standard' | 'monthly';
  sendToPandaDoc?: boolean; // Default true
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

interface HybridQuoteResponse {
  success: boolean;
  quoteId: string;
  
  // AI Results
  aiQuote: QuoteData;
  aiAnalysis: any;
  
  // PandaDoc Results
  pandaDocId?: string;
  pandaDocUrl?: string;
  
  // Mapping Results
  mappingCoverage: {
    totalItems: number;
    mappedItems: number;
    unmappedItems: string[];
    coveragePercentage: number;
  };
  
  // Database
  savedToDatabase: boolean;
  
  error?: string;
  warnings?: string[];
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
    const body: HybridQuoteRequest = await request.json();
    
    // Validate required fields
    if (!body.leadName || !body.businessType || !body.organizationId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: leadName, businessType, organizationId' },
        { status: 400 }
      );
    }

    console.log('🤖 Starting hybrid quote generation for:', body.leadName);
    
    // Step 1: Generate AI Quote
    console.log('📊 Step 1: Generating AI quote...');
    const aiQuoteResponse = await generateAIQuote(body);
    
    if (!aiQuoteResponse.success) {
      return NextResponse.json({
        success: false,
        error: 'Error generando cotización con IA: ' + aiQuoteResponse.error
      }, { status: 500 });
    }

    const aiQuote = aiQuoteResponse.data as QuoteData;
    console.log('✅ AI Quote generated:', aiQuote.titulo);

    // Step 2: Enhance with business logic
    console.log('🎯 Step 2: Enhancing with business logic...');
    const enhancedAIQuote = enhanceQuoteWithBusinessLogic(aiQuote, body.businessType);

    // Step 3: Map AI products to PandaDoc catalog
    console.log('🔄 Step 3: Mapping AI products to PandaDoc...');
    const mappingResult = mapAIQuoteToPandaDoc(enhancedAIQuote);
    const mappingCoverage = validateMappingCoverage(enhancedAIQuote);
    
    console.log(`📈 Mapping coverage: ${mappingCoverage.coveragePercentage.toFixed(1)}%`);

    // Step 4: Create database entry
    console.log('💾 Step 4: Saving to database...');
    const quoteId = `hq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const now = new Date();
    const hybridQuote: Omit<BillingQuote, 'id'> = {
      clientName: body.leadName,
      clientEmail: body.clientEmail || '',
      businessType: body.businessType,
      leadId: body.leadId,
      leadName: body.leadName,
      organizationId: body.organizationId,
      userId: decodedToken.uid,
      templateType: body.templateType || 'standard',
      products: mappingResult.products.map(p => ({
        name: p.name,
        cantidad: p.cantidad,
        descuento: p.descuento,
        paymentType: p.paymentType,
        price: 0, // Will be filled by convertToQuoteProducts
        categoria: 'AI-mapped',
        precio_unitario: 0,
        precio_total: 0,
        subtotal: 0,
        descuento_valor: 0
      })),
      calculations: {
        total_lista: 0,
        total_descuento: 0,
        pago_unico_total: 0,
        pago_mensual_total: 0,
        total_impuestos: 0,
        total_final: 0,
        pago_unico_total_con_impuesto: 0,
        pago_mensual_total_con_impuesto: 0
      }, // Will be calculated later
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      locale: 'es-ES',
      taxRate: 0.07,
      metadata: {
        version: '2.0',
        source: 'hybrid',
        totalProducts: mappingResult.products.length,
        hasDiscounts: mappingResult.products.some(p => p.descuento > 0),
        hasRecurringItems: mappingResult.products.some(p => p.paymentType === 'mensual'),
        viewCount: 0,
        // AI-specific metadata
        aiGenerated: true,
        aiTitle: aiQuote.titulo,
        aiMappingCoverage: mappingCoverage.coveragePercentage,
        aiUnmappedItems: mappingCoverage.unmappedItems
      },
      notes: body.notes,
      priority: body.priority || 'medium'
    };

    let savedToDatabase = false;
    let pandaDocResult = null;
    
    try {
      // Save to database first
      await db.collection('billing_quotes').doc(quoteId).set(hybridQuote);
      savedToDatabase = true;
      console.log('✅ Saved to database:', quoteId);

      // Step 5: Send to PandaDoc (if requested and we have email)
      if (body.sendToPandaDoc !== false && body.clientEmail && mappingResult.products.length > 0) {
        console.log('📄 Step 5: Sending to PandaDoc...');
        
        const pandaDocRequest: QuoteRequest = {
          cliente: body.leadName,
          correo: body.clientEmail,
          productos: mappingResult.products,
          templateType: body.templateType || 'standard'
        };

        pandaDocResult = await sendQuoteToPandaDoc(pandaDocRequest);
        
        if (pandaDocResult.success) {
          // Update database with PandaDoc info
          await db.collection('billing_quotes').doc(quoteId).update({
            pandaDocId: pandaDocResult.documentId,
            pandaDocUrl: pandaDocResult.viewUrl,
            pandaDocStatus: 'sent',
            status: 'generated',
            sentAt: new Date(),
            updatedAt: new Date()
          });
          console.log('✅ PandaDoc integration successful');
        } else {
          console.warn('⚠️ PandaDoc integration failed:', pandaDocResult.error);
        }
      }

    } catch (saveError) {
      console.error('❌ Database save error:', saveError);
      savedToDatabase = false;
    }

    // Prepare response
    const warnings: string[] = [];
    
    if (mappingCoverage.coveragePercentage < 80) {
      warnings.push(`Cobertura de mapeo baja: ${mappingCoverage.coveragePercentage.toFixed(1)}%`);
    }
    
    if (mappingCoverage.unmappedItems.length > 0) {
      warnings.push(`Productos sin mapear: ${mappingCoverage.unmappedItems.join(', ')}`);
    }
    
    if (!body.clientEmail && body.sendToPandaDoc !== false) {
      warnings.push('No se envió a PandaDoc: falta email del cliente');
    }

    const response: HybridQuoteResponse = {
      success: true,
      quoteId,
      aiQuote: enhancedAIQuote,
      aiAnalysis: mappingResult.metadata.aiAnalysis,
      pandaDocId: pandaDocResult?.documentId,
      pandaDocUrl: pandaDocResult?.viewUrl,
      mappingCoverage,
      savedToDatabase,
      warnings: warnings.length > 0 ? warnings : undefined
    };

    console.log('🎉 Hybrid quote generation completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Hybrid quote generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to call AI quote generation
async function generateAIQuote(request: HybridQuoteRequest): Promise<{
  success: boolean;
  data?: QuoteData;
  error?: string;
}> {
  try {
    const aiRequestBody = {
      leadName: request.leadName,
      businessType: request.businessType,
      organizationId: request.organizationId,
      leadInfo: request.leadInfo || {
        necesidades: [],
        presupuesto_estimado: undefined,
        tamaño_empresa: 'mediana'
      },
      requerimientos_especiales: request.requerimientos_especiales || [],
      contexto_adicional: request.contexto_adicional || undefined
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3047'}/api/ai/generate-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(aiRequestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `AI API error: ${response.status}`
      };
    }

    const aiQuote = await response.json();
    return {
      success: true,
      data: aiQuote
    };

  } catch (error) {
    console.error('AI quote generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown AI error'
    };
  }
}

// GET endpoint for testing and documentation
export async function GET() {
  return NextResponse.json({
    message: "API Híbrida: IA + PandaDoc",
    description: "Genera cotizaciones inteligentes combinando IA y PandaDoc",
    features: [
      "🤖 Análisis inteligente con IA",
      "📊 Mapeo automático de productos",
      "📄 Documentos profesionales PandaDoc", 
      "💾 Guardado automático en base de datos",
      "🎯 Recomendaciones por tipo de negocio",
      "📈 Métricas de cobertura de mapeo"
    ],
    usage: {
      method: "POST",
      requiredFields: ["leadName", "businessType", "organizationId"],
      optionalFields: ["clientEmail", "templateType", "sendToPandaDoc", "priority", "notes"],
      response: "Complete hybrid quote with AI analysis and PandaDoc integration"
    }
  });
}