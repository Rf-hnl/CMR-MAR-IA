import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const { trackingId } = params;
    const clickData = await request.json();

    console.log(`🔍 Debug tracking ID: ${trackingId}`);
    console.log(`📊 Click data:`, clickData);

    // Usar db directamente de la importación
    
    // Buscar el tracking link
    const allOrgsSnapshot = await db.collection('organizations').get();
    let trackingLinkDoc = null;
    let organizationId = '';

    for (const orgDoc of allOrgsSnapshot.docs) {
      const trackingLinkRef = await orgDoc.ref
        .collection('tracking-links')
        .doc(trackingId)
        .get();

      if (trackingLinkRef.exists) {
        trackingLinkDoc = trackingLinkRef;
        organizationId = orgDoc.id;
        break;
      }
    }

    if (!trackingLinkDoc || !trackingLinkDoc.exists) {
      return NextResponse.json({ error: 'Tracking link no encontrado' }, { status: 404 });
    }

    const trackingData = trackingLinkDoc.data();
    console.log(`📋 Tracking data:`, trackingData);

    if (!trackingData || !trackingData.isActive) {
      return NextResponse.json({ error: 'Tracking link inactivo' }, { status: 410 });
    }

    // Verificar si el lead existe en leads-flow
    const leadRef = db.collection('leads-flow').doc(trackingData.leadId);
    const leadDoc = await leadRef.get();
    
    console.log(`👤 Lead exists: ${leadDoc.exists}`);
    if (leadDoc.exists) {
      const leadData = leadDoc.data();
      console.log(`👤 Lead data:`, {
        name: leadData?.fullName || leadData?.name,
        stage: leadData?.currentStage || leadData?.stage,
        id: leadData?.id || trackingData.leadId
      });
    }

    // Solo registrar el click en tracking-clicks, sin actualizar el lead por ahora
    const clickRecord = {
      trackingId,
      leadId: trackingData.leadId,
      organizationId,
      timestamp: FieldValue.serverTimestamp(),
      clickData: {
        ...clickData,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'localhost'
      }
    };

    // Guardar el click
    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('tracking-clicks')
      .add(clickRecord);

    // Actualizar contador
    await trackingLinkDoc.ref.update({
      clickCount: FieldValue.increment(1),
      lastClickAt: FieldValue.serverTimestamp()
    });

    console.log(`✅ Click registrado exitosamente`);

    return NextResponse.json({
      success: true,
      destinationUrl: trackingData.destinationUrl,
      message: 'Click registrado exitosamente',
      debug: {
        trackingId,
        leadId: trackingData.leadId,
        organizationId,
        leadExists: leadDoc.exists
      }
    });

  } catch (error) {
    console.error('❌ Error en track-debug:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}