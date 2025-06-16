import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 Buscando tracking links para organizationId: ${organizationId}`);

    const query = db
      .collection('organizations')
      .doc(organizationId)
      .collection('tracking-links')
      .orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    console.log(`📊 Documentos encontrados: ${snapshot.docs.length}`);

    const trackingLinks = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`📄 Link encontrado: ${doc.id}`, {
        title: data.title,
        type: data.type,
        isActive: data.isActive,
        clickCount: data.clickCount,
        campaignName: data.campaignName
      });

      return {
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        lastClickAt: data.lastClickAt?.toDate()?.toISOString() || null
      };
    });

    console.log(`✅ Tracking links procesados: ${trackingLinks.length}`);

    return NextResponse.json({
      success: true,
      trackingLinks,
      total: trackingLinks.length,
      organizationId,
      debug: {
        foundDocs: snapshot.docs.length,
        processedLinks: trackingLinks.length,
        firstLinkTitle: trackingLinks[0]?.title || 'No links found'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching tracking links:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}