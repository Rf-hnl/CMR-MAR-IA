import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  if (!firestoreDbAdmin || !authAdmin) {
    return NextResponse.json({ 
      error: 'Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    console.log('🔍 Debug - Verificando leads para organizationId:', organizationId);

    // Verificar meta-lead-ads
    const metaLeadsQuery = organizationId 
      ? firestoreDbAdmin.collection('meta-lead-ads').where('organizationId', '==', organizationId)
      : firestoreDbAdmin.collection('meta-lead-ads').limit(5);
    
    const metaLeadsSnapshot = await metaLeadsQuery.get();
    console.log(`📊 meta-lead-ads: ${metaLeadsSnapshot.size} documentos`);

    // Verificar leads-flow
    const flowLeadsQuery = organizationId 
      ? firestoreDbAdmin.collection('leads-flow').where('organizationId', '==', organizationId)
      : firestoreDbAdmin.collection('leads-flow').limit(5);
    
    const flowLeadsSnapshot = await flowLeadsQuery.get();
    console.log(`📊 leads-flow: ${flowLeadsSnapshot.size} documentos`);

    // Verificar leads-flow activos
    const activeFlowQuery = organizationId 
      ? firestoreDbAdmin.collection('leads-flow')
          .where('organizationId', '==', organizationId)
          .where('flowStatus', '==', 'active')
      : firestoreDbAdmin.collection('leads-flow')
          .where('flowStatus', '==', 'active')
          .limit(5);
    
    const activeFlowSnapshot = await activeFlowQuery.get();
    console.log(`📊 leads-flow (activos): ${activeFlowSnapshot.size} documentos`);

    // Obtener ejemplos de datos
    const metaExample = metaLeadsSnapshot.docs.length > 0 ? {
      id: metaLeadsSnapshot.docs[0].id,
      data: metaLeadsSnapshot.docs[0].data()
    } : null;

    const flowExample = flowLeadsSnapshot.docs.length > 0 ? {
      id: flowLeadsSnapshot.docs[0].id,
      data: flowLeadsSnapshot.docs[0].data()
    } : null;

    const activeExample = activeFlowSnapshot.docs.length > 0 ? {
      id: activeFlowSnapshot.docs[0].id,
      data: activeFlowSnapshot.docs[0].data()
    } : null;

    return NextResponse.json({
      organizationId,
      counts: {
        metaLeads: metaLeadsSnapshot.size,
        flowLeads: flowLeadsSnapshot.size,
        activeFlowLeads: activeFlowSnapshot.size
      },
      examples: {
        metaLead: metaExample,
        flowLead: flowExample,
        activeFlowLead: activeExample
      }
    });

  } catch (error: any) {
    console.error('❌ Error en debug:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}