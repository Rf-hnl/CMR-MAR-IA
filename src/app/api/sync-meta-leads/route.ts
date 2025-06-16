import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { mapMetaLeadToStandardLead, validateMetaLead } from '@/lib/meta-leads-mapper';
import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';

export async function POST(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    console.error("Firebase Admin SDK not initialized");
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  // Verify authentication
  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      message: 'No autorizado: Token faltante o inválido.' 
    }, { status: 401 });
  }

  const token = authorizationHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(token);
  } catch (error) {
    console.error('Error al verificar el token de ID de Firebase:', error);
    return NextResponse.json({ 
      message: 'No autorizado: Token inválido.' 
    }, { status: 401 });
  }

  const uid = decodedToken.uid;
  if (!uid) {
    return NextResponse.json({ 
      message: 'No autorizado: UID no encontrado en el token.' 
    }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    console.log(`Syncing Meta Ads leads for organization: ${organizationId}`);

    // Get Meta Ads leads from meta-lead-ads collection
    const metaLeadsSnapshot = await firestoreDbAdmin
      .collection('meta-lead-ads')
      .where('organizationId', '==', organizationId)
      .get();

    if (metaLeadsSnapshot.empty) {
      return NextResponse.json({ 
        message: 'No se encontraron leads de Meta Ads para esta organización.',
        synced: 0,
        skipped: 0
      }, { status: 200 });
    }

    const metaLeads = metaLeadsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (MetaLeadAdsModel & { id: string })[];

    console.log(`Found ${metaLeads.length} Meta Ads leads to process`);

    // Check which leads already exist in the leads collection
    const existingLeadsSnapshot = await firestoreDbAdmin
      .collection('leads')
      .where('organizationId', '==', organizationId)
      .where('source', '==', 'meta_lead_ads')
      .get();

    const existingMetaLeadIds = new Set(
      existingLeadsSnapshot.docs
        .map(doc => doc.data().metaAdData?.leadId)
        .filter(Boolean)
    );

    // Filter out leads that already exist
    const newMetaLeads = metaLeads.filter(lead => 
      validateMetaLead(lead) && !existingMetaLeadIds.has(lead.leadId)
    );

    if (newMetaLeads.length === 0) {
      return NextResponse.json({ 
        message: 'Todos los leads de Meta Ads ya están sincronizados.',
        synced: 0,
        skipped: metaLeads.length
      }, { status: 200 });
    }

    // Batch write new leads
    const batch = firestoreDbAdmin.batch();
    const leadsCollection = firestoreDbAdmin.collection('leads');
    const timestamp = FieldValue.serverTimestamp();

    newMetaLeads.forEach(metaLead => {
      const leadDocRef = leadsCollection.doc();
      const mappedLead = mapMetaLeadToStandardLead(
        metaLead,
        uid,
        organizationId,
        timestamp
      );
      
      console.log(`Preparing to sync Meta lead: ${metaLead.fullName} (${metaLead.leadId})`);
      batch.set(leadDocRef, mappedLead);
    });

    await batch.commit();
    
    const syncedCount = newMetaLeads.length;
    const skippedCount = metaLeads.length - syncedCount;

    console.log(`Successfully synced ${syncedCount} Meta Ads leads for organization: ${organizationId}`);

    return NextResponse.json({ 
      message: `¡${syncedCount} lead(s) de Meta Ads sincronizados correctamente!`,
      synced: syncedCount,
      skipped: skippedCount,
      total: metaLeads.length
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error al sincronizar leads de Meta Ads:', error);
    return NextResponse.json({ 
      message: 'Error al sincronizar leads de Meta Ads.',
      error: error.message || 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  // Verify authentication
  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      message: 'No autorizado: Token faltante o inválido.' 
    }, { status: 401 });
  }

  const token = authorizationHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(token);
  } catch (error) {
    console.error('Error al verificar el token de ID de Firebase:', error);
    return NextResponse.json({ 
      message: 'No autorizado: Token inválido.' 
    }, { status: 401 });
  }

  const uid = decodedToken.uid;
  if (!uid) {
    return NextResponse.json({ 
      message: 'No autorizado: UID no encontrado en el token.' 
    }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    // Get Meta Ads leads status
    const metaLeadsSnapshot = await firestoreDbAdmin
      .collection('meta-lead-ads')
      .where('organizationId', '==', organizationId)
      .get();

    const syncedLeadsSnapshot = await firestoreDbAdmin
      .collection('leads')
      .where('organizationId', '==', organizationId)
      .where('source', '==', 'meta_lead_ads')
      .get();

    const totalMetaLeads = metaLeadsSnapshot.size;
    const syncedLeads = syncedLeadsSnapshot.size;
    const pendingSync = totalMetaLeads - syncedLeads;

    return NextResponse.json({
      totalMetaLeads,
      syncedLeads,
      pendingSync,
      lastSync: null // Could be enhanced to track last sync time
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al obtener estado de sincronización:', error);
    return NextResponse.json({ 
      message: 'Error al obtener estado de sincronización.',
      error: error.message || 'Error desconocido'
    }, { status: 500 });
  }
}