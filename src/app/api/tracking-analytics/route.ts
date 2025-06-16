import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';
import { verifyAuthToken } from '@/lib/auth-utils';

interface ClickAnalytics {
  id: string;
  trackingId: string;
  leadId: string;
  timestamp: any;
  clickData: {
    userAgent: string;
    referrer: string;
    screenResolution: string;
    language: string;
    ipAddress: string;
    country?: string;
  };
}

interface TrackingAnalytics {
  linkDetails: {
    id: string;
    title: string;
    type: string;
    destinationUrl: string;
    clickCount: number;
    createdAt: any;
    lastClickAt: any;
  };
  clicks: ClickAnalytics[];
  analytics: {
    clicksByHour: { [hour: string]: number };
    clicksByDay: { [day: string]: number };
    deviceTypes: { [device: string]: number };
    browsers: { [browser: string]: number };
    countries: { [country: string]: number };
    referrers: { [referrer: string]: number };
  };
}

function parseUserAgent(userAgent: string) {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(userAgent);
  
  let browser = 'Other';
  if (userAgent.includes('WhatsApp')) browser = 'WhatsApp';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  let deviceType = 'Desktop';
  if (isTablet) deviceType = 'Tablet';
  else if (isMobile) deviceType = 'Mobile';
  
  return { browser, deviceType };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');
    const organizationId = searchParams.get('organizationId');

    if (!trackingId || !organizationId) {
      return NextResponse.json(
        { error: 'trackingId y organizationId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar autenticación (opcional, dependiendo de tu setup)
    // const user = await verifyAuthToken(request);

    // Obtener detalles del tracking link
    const trackingLinkRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('tracking-links')
      .doc(trackingId);
    
    const trackingLinkDoc = await trackingLinkRef.get();
    
    if (!trackingLinkDoc.exists) {
      return NextResponse.json(
        { error: 'Tracking link no encontrado' },
        { status: 404 }
      );
    }

    const trackingData = trackingLinkDoc.data();

    // Obtener todos los clicks para este tracking link
    const clicksSnapshot = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('tracking-clicks')
      .where('trackingId', '==', trackingId)
      .orderBy('timestamp', 'desc')
      .get();

    const clicks: ClickAnalytics[] = clicksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ClickAnalytics[];

    // Generar analytics
    const clicksByHour: { [hour: string]: number } = {};
    const clicksByDay: { [day: string]: number } = {};
    const deviceTypes: { [device: string]: number } = {};
    const browsers: { [browser: string]: number } = {};
    const countries: { [country: string]: number } = {};
    const referrers: { [referrer: string]: number } = {};

    clicks.forEach(click => {
      if (click.timestamp && click.timestamp.toDate) {
        const date = click.timestamp.toDate();
        const hour = date.getHours();
        const day = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Clicks por hora
        clicksByHour[hour] = (clicksByHour[hour] || 0) + 1;
        
        // Clicks por día
        clicksByDay[day] = (clicksByDay[day] || 0) + 1;
      }

      if (click.clickData) {
        // Análisis de User Agent
        const { browser, deviceType } = parseUserAgent(click.clickData.userAgent || '');
        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
        browsers[browser] = (browsers[browser] || 0) + 1;

        // País
        const country = click.clickData.country || 'Unknown';
        countries[country] = (countries[country] || 0) + 1;

        // Referrer
        const referrer = click.clickData.referrer || 'Direct';
        referrers[referrer] = (referrers[referrer] || 0) + 1;
      }
    });

    const response: TrackingAnalytics = {
      linkDetails: {
        id: trackingLinkDoc.id,
        title: trackingData?.title || '',
        type: trackingData?.type || '',
        destinationUrl: trackingData?.destinationUrl || '',
        clickCount: trackingData?.clickCount || 0,
        createdAt: trackingData?.createdAt,
        lastClickAt: trackingData?.lastClickAt
      },
      clicks: clicks.slice(0, 50), // Últimos 50 clicks
      analytics: {
        clicksByHour,
        clicksByDay,
        deviceTypes,
        browsers,
        countries,
        referrers
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error obteniendo analytics:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}