import { NextRequest, NextResponse } from 'next/server';
import { generateWelcomeMessage, type WelcomeMessageInput } from '@/ai/flows/welcomeMessageFlow';
import { verifyAuthToken } from '@/lib/auth-utils';
import { admin, db } from '@/lib/firebase-admin';
import { withAICache } from '@/lib/ai-cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // TODO: Temporarily disabled auth for testing
    // const authResult = await verifyAuthToken(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ error: authResult.error }, { status: 401 });
    // }

    const body: WelcomeMessageInput & { leadId?: string; organizationId?: string; currentUser?: any; catalogUrl?: string } = await request.json();
    
    console.log('Welcome message API called with:', body);
    
    if (!body.leadName) {
      return NextResponse.json(
        { error: 'leadName es requerido' },
        { status: 400 }
      );
    }

    let catalogUrl = body.catalogUrl;

    // Si tenemos leadId y organizationId, crear link de tracking automáticamente
    if (body.leadId && body.organizationId && !catalogUrl) {
      try {
        // Obtener información de la organización para el catálogo
        const db = admin.firestore();
        const orgDoc = await db.collection('organizations').doc(body.organizationId).get();
        const orgData = orgDoc.data();

        console.log(`🔍 Organización encontrada: ${orgDoc.exists}`);
        console.log(`📋 Datos de organización:`, orgData);
        console.log(`🔗 catalogUrl en orgData:`, orgData?.catalogUrl);

        // Usar catalogUrl de la organización o la URL configurada en las variables de entorno
        const destinationUrl = orgData?.catalogUrl || process.env.CATALOG_PRUDUCTS_URL || 'https://www.antarestech.io/shop';
        
        if (destinationUrl) {
          // Generar link de tracking
          const trackingId = uuidv4();
          
          const trackingLink = {
            id: trackingId,
            leadId: body.leadId,
            organizationId: body.organizationId,
            type: 'catalogo',
            title: `Catálogo - ${body.leadName}`,
            destinationUrl: destinationUrl,
            campaignName: 'welcome_message',
            trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3047'}/track/${trackingId}`,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: 'system', // TODO: Fix when auth is re-enabled
            clickCount: 0,
            lastClickAt: null,
            isActive: true,
            metadata: {
              source: 'welcome_message',
              leadName: body.leadName,
              businessType: body.businessType || 'unknown'
            }
          };

          // Guardar el tracking link
          await db
            .collection('organizations')
            .doc(body.organizationId)
            .collection('tracking-links')
            .doc(trackingId)
            .set(trackingLink);

          catalogUrl = trackingLink.trackingUrl;
          console.log(`✅ Tracking link creado: ${trackingId} para lead: ${body.leadId}`);
          console.log(`🔗 Tracking URL generada: ${catalogUrl}`);
        }
      } catch (error) {
        console.error('Error creando tracking link:', error);
        // Continuar sin tracking link si hay error
      }
    }

    // Preparar datos para el mensaje con información de empresa por defecto (SIN catalogUrl)
    const messageInput = {
      leadName: body.leadName,
      businessType: body.businessType,
      companyName: body.companyName || 'nuestra empresa',
      companyDescription: body.companyDescription || 'nos especializamos en soluciones tecnológicas para impulsar tu negocio',
      senderName: body.currentUser?.displayName || body.currentUser?.email?.split('@')[0] || 'nuestro equipo'
    };
    
    console.log(`📝 Input para generar mensaje:`, messageInput);
    
    // Obtener el lead actual para verificar cache
    let currentLead = null;
    try {
      if (body.leadId) {
        const leadDoc = await db.collection('leads-flow').doc(body.leadId).get();
        currentLead = leadDoc.exists ? leadDoc.data() : null;
      }
    } catch (error) {
      console.warn('Error obteniendo lead para cache:', error);
    }
    
    // Generar el mensaje con IA usando cache
    const cacheResult = body.leadId && currentLead 
      ? await withAICache(
          body.leadId,
          'welcomeMessage',
          () => generateWelcomeMessage(messageInput),
          messageInput,
          currentLead.aiContent
        )
      : { 
          content: await generateWelcomeMessage(messageInput), 
          fromCache: false, 
          generatedAt: new Date(),
          requestId: `no-cache-${Date.now()}`
        };
    
    const result = cacheResult.content;
    
    console.log(`🤖 Mensaje ${cacheResult.fromCache ? 'obtenido del cache' : 'generado por IA'}:`, result);
    
    // Agregar el tracking link al final del mensaje generado
    let finalMessage = result.message;
    if (catalogUrl) {
      finalMessage += `\n\nTe invitamos a ver nuestro catálogo completo: ${catalogUrl}`;
      console.log(`🔗 Tracking link agregado: ${catalogUrl}`);
    }
    
    console.log('📱 Mensaje final con tracking:', finalMessage);
    
    return NextResponse.json({
      message: finalMessage,
      trackingUrl: catalogUrl // Incluir la URL de tracking en la respuesta
    });
  } catch (error) {
    console.error('Welcome message API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar mensaje';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}