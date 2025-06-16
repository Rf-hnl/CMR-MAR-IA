import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const { trackingId } = params;
    const db = admin.firestore();
    
    console.log(`🔍 Debugging tracking ID: ${trackingId}`);
    
    // Buscar el tracking link en todas las organizaciones
    const allOrgsSnapshot = await db.collection('organizations').get();
    let found = false;
    const searchResults = [];
    
    for (const orgDoc of allOrgsSnapshot.docs) {
      const trackingLinkRef = await orgDoc.ref
        .collection('tracking-links')
        .doc(trackingId)
        .get();

      const orgData = {
        organizationId: orgDoc.id,
        organizationName: orgDoc.data()?.name || 'Sin nombre',
        hasTrackingLink: trackingLinkRef.exists
      };

      if (trackingLinkRef.exists) {
        found = true;
        const trackingData = trackingLinkRef.data();
        orgData.trackingLinkData = {
          ...trackingData,
          createdAt: trackingData.createdAt?.toDate?.()?.toISOString() || trackingData.createdAt,
          lastClickAt: trackingData.lastClickAt?.toDate?.()?.toISOString() || trackingData.lastClickAt,
        };
      }
      
      searchResults.push(orgData);
    }
    
    // También buscar en la estructura antigua si no se encuentra
    if (!found) {
      console.log('🔍 Buscando en estructura de tracking links globales...');
      try {
        const globalTrackingRef = db.collection('tracking-links').doc(trackingId);
        const globalTrackingDoc = await globalTrackingRef.get();
        
        if (globalTrackingDoc.exists) {
          found = true;
          const data = globalTrackingDoc.data();
          searchResults.push({
            location: 'global-collection',
            hasTrackingLink: true,
            trackingLinkData: {
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              lastClickAt: data.lastClickAt?.toDate?.()?.toISOString() || data.lastClickAt,
            }
          });
        }
      } catch (error) {
        console.log('Error buscando en colección global:', error);
      }
    }
    
    return NextResponse.json({
      trackingId,
      found,
      searchResults,
      totalOrganizations: allOrgsSnapshot.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error debugging tracking link:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}