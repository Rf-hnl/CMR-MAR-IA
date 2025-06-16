import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    console.log(`🔍 Debug tracking para organizationId: ${organizationId}`);

    // Obtener todas las organizaciones y sus tracking links
    const orgsSnapshot = await db.collection('organizations').get();
    let allTrackingLinks: any[] = [];
    let organizationLinks: any[] = [];

    for (const orgDoc of orgsSnapshot.docs) {
      const trackingLinksSnapshot = await orgDoc.ref.collection('tracking-links').get();
      const orgLinks = trackingLinksSnapshot.docs.map(doc => ({
        id: doc.id,
        organizationId: orgDoc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || 'No timestamp',
        lastClickAt: doc.data().lastClickAt?.toDate()?.toISOString() || null
      }));

      allTrackingLinks = [...allTrackingLinks, ...orgLinks];

      if (orgDoc.id === organizationId) {
        organizationLinks = orgLinks;
      }
    }

    // Obtener clicks para la organización específica
    let clicksData: any[] = [];
    if (organizationId) {
      const clicksSnapshot = await db
        .collection('organizations')
        .doc(organizationId)
        .collection('tracking-clicks')
        .get();
      
      clicksData = clicksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString() || 'No timestamp'
      }));
    }

    const debugInfo = {
      organizationId,
      totalOrganizations: orgsSnapshot.docs.length,
      totalTrackingLinksAcrossAllOrgs: allTrackingLinks.length,
      trackingLinksForThisOrg: organizationLinks.length,
      clicksForThisOrg: clicksData.length,
      
      // Resumen por organización
      linksByOrganization: orgsSnapshot.docs.map(doc => ({
        orgId: doc.id,
        orgName: doc.data().name || 'Sin nombre',
        linkCount: allTrackingLinks.filter(link => link.organizationId === doc.id).length
      })),

      // Links específicos de la organización actual
      organizationLinks: organizationLinks.map(link => ({
        id: link.id,
        leadId: link.leadId,
        title: link.title,
        type: link.type,
        campaignName: link.campaignName,
        isActive: link.isActive,
        clickCount: link.clickCount,
        createdAt: link.createdAt,
        trackingUrl: link.trackingUrl
      })),

      // Clicks específicos
      recentClicks: clicksData.slice(0, 5).map(click => ({
        id: click.id,
        trackingId: click.trackingId,
        leadId: click.leadId,
        timestamp: click.timestamp,
        userAgent: click.clickData?.userAgent?.substring(0, 50) + '...' || 'N/A'
      })),

      // Todos los links (primeros 10)
      allLinksPreview: allTrackingLinks.slice(0, 10).map(link => ({
        id: link.id,
        organizationId: link.organizationId,
        leadId: link.leadId,
        title: link.title,
        campaignName: link.campaignName,
        isActive: link.isActive,
        clickCount: link.clickCount
      }))
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Error en debug tracking:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}