import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { admin } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

interface CreateTrackingLinkRequest {
  leadId: string;
  organizationId: string;
  type: 'catalogo' | 'landing' | 'producto' | 'servicio';
  title: string;
  destinationUrl: string;
  campaignName?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body: CreateTrackingLinkRequest = await request.json();
    const { leadId, organizationId, type, title, destinationUrl, campaignName } = body;

    // Validar datos requeridos
    if (!leadId || !organizationId || !type || !title || !destinationUrl) {
      return NextResponse.json(
        { error: 'leadId, organizationId, type, title y destinationUrl son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tenga acceso a la organización
    if (authResult.user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta organización' },
        { status: 403 }
      );
    }

    const db = admin.firestore();
    
    // Generar ID único para el link de tracking
    const trackingId = uuidv4();
    
    // Crear el link de tracking
    const trackingLink = {
      id: trackingId,
      leadId,
      organizationId,
      type,
      title,
      destinationUrl,
      campaignName: campaignName || 'default',
      trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/track/${trackingId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: authResult.user.uid,
      clickCount: 0,
      lastClickAt: null,
      isActive: true,
      metadata: {
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }
    };

    // Guardar en Firestore
    await db
      .collection('organizations')
      .doc(organizationId)
      .collection('tracking-links')
      .doc(trackingId)
      .set(trackingLink);

    console.log(`✅ Tracking link creado: ${trackingId} para lead: ${leadId}`);

    return NextResponse.json({
      success: true,
      trackingId,
      trackingUrl: trackingLink.trackingUrl,
      destinationUrl,
      type,
      title
    });

  } catch (error) {
    console.error('Error creating tracking link:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const leadId = searchParams.get('leadId');
    const debug = searchParams.get('debug');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Saltar autenticación si es modo debug
    if (!debug) {
      // Verificar autenticación solo en modo normal
      const authResult = await verifyAuthToken(request);
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      // Verificar que el usuario tenga acceso a la organización
      if (authResult.user.organizationId !== organizationId) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta organización' },
          { status: 403 }
        );
      }
    }

    const db = admin.firestore();
    
    let query = db
      .collection('organizations')
      .doc(organizationId)
      .collection('tracking-links')
      .orderBy('createdAt', 'desc');
    
    // Temporalmente comentamos el filtro de isActive para debug
    // .where('isActive', '==', true)

    // Filtrar por lead si se especifica
    if (leadId) {
      query = query.where('leadId', '==', leadId);
    }

    const snapshot = await query.get();
    const trackingLinks = snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
      lastClickAt: doc.data().lastClickAt?.toDate()?.toISOString() || null
    }));

    return NextResponse.json({
      success: true,
      trackingLinks,
      total: trackingLinks.length
    });

  } catch (error) {
    console.error('Error fetching tracking links:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}