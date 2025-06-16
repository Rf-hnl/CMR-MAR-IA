import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import type { Timestamp } from 'firebase-admin/firestore';
import type { LeadsFlowModel } from '@/types/leads-flow';

export async function POST(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

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
    const { organizationId, userId } = await request.json();
    
    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    console.log('🔍 Obteniendo leads de leads-flow para organización:', organizationId);

    // Build query for leads-flow collection
    let query = firestoreDbAdmin
      .collection('leads-flow')
      .where('organizationId', '==', organizationId);
      // Temporarily removed flowStatus filter to avoid index requirement
      // .where('flowStatus', '==', 'active'); // Solo leads activos en el flujo

    // Order by updated date (most recent first) - disabled for now
    // query = query.orderBy('updatedAt', 'desc');

    const snapshot = await query.get();
    console.log(`📊 Encontrados ${snapshot.size} leads en leads-flow`);

    interface FirestoreLeadsFlow {
      id: string;
      data: LeadsFlowModel & {
        createdAt: Timestamp;
        updatedAt: Timestamp;
      };
    }

    interface LeadsFlowDoc {
      id: string;
      data: LeadsFlowModel & {
      createdAt: Timestamp;
      updatedAt: Timestamp;
      };
    }

    const leadsFlow: LeadsFlowDoc[] = snapshot.docs
      .map((doc): LeadsFlowDoc => ({
      id: doc.id,
      data: doc.data() as LeadsFlowDoc['data']
      }))
      .filter((lead: LeadsFlowDoc) => lead.data.flowStatus === 'active') // Filter active leads in code
      .sort((a: LeadsFlowDoc, b: LeadsFlowDoc) => {
      // Sort by updatedAt desc (most recent first)
      const aTime: number = a.data.updatedAt?.toDate?.()?.getTime() || 0;
      const bTime: number = b.data.updatedAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
      });

    // Convert to compatible format for UI
    const formattedLeads = leadsFlow.map(({ id, data }) => {
      // Convert Firestore timestamps to ISO strings
      const createdAt = data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
      const updatedAt = data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString();

      return {
        id,
        // Core lead information
        fullName: data.fullName || data.name || '',
        name: data.fullName || data.name || '', // Alias for compatibility
        email: data.email || '',
        phone: data.phoneNumber || '',
        phoneNumber: data.phoneNumber || '',
        companyName: data.companyName || '',
        
        // Meta Ads specific
        campaignName: data.campaignName || '',
        adName: data.adName || '',
        formName: data.formName || '',
        partnerName: data.partnerName || '',
        platform: data.platform || '',
        
        // Location and business
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        country: data.country || '',
        website: data.website || '',
        businessType: data.businessType || '',
        
        // Flow-specific properties
        stage: data.currentStage || 'Nuevo',
        currentStage: data.currentStage || 'Nuevo',
        flowStatus: data.flowStatus,
        leadScore: data.leadScore || 0,
        qualificationStatus: data.qualificationStatus,
        priority: data.priority,
        tags: data.tags || [],
        
        // Communication and engagement
        lastContactDate: data.lastContactDate,
        nextFollowUpDate: data.nextFollowUpDate,
        communicationCount: data.communicationCount || 0,
        engagementScore: data.engagementScore || 0,
        responseRate: data.responseRate || 0,
        
        // Sales pipeline
        estimatedValue: data.estimatedValue || 0,
        closeProbability: data.closeProbability || 0,
        expectedCloseDate: data.expectedCloseDate,
        
        // Assignment
        assignedTo: data.assignedTo,
        assignedDate: data.assignedDate,
        
        // Source and sync info
        source: data.source || 'leads-flow',
        sourceLeadId: data.sourceLeadId,
        sourceCollection: data.sourceCollection,
        syncedAt: data.syncedAt,
        lastSyncedAt: data.lastSyncedAt,
        
        // Metadata
        uid: data.uid || userId || uid,
        organizationId: data.organizationId,
        createdAt,
        updatedAt,
        createdTime: data.createdTime || createdAt,
        
        // Custom fields and automation
        customFields: data.customFields || {},
        automationRules: data.automationRules || [],
        excludeFromAutomation: data.excludeFromAutomation || false,
        
        // Stage history for analytics
        stageHistory: data.stageHistory || [],
        communicationHistory: data.communicationHistory || []
      };
    });

    // Calculate stage statistics
    const stageStats = formattedLeads.reduce((acc, lead) => {
      const stage = lead.currentStage;
      if (!acc[stage]) {
        acc[stage] = {
          count: 0,
          totalValue: 0,
          averageScore: 0,
          leads: []
        };
      }
      acc[stage].count++;
      acc[stage].totalValue += lead.estimatedValue || 0;
      acc[stage].leads.push(lead);
      return acc;
    }, {} as Record<string, any>);

    // Calculate average scores per stage
    Object.keys(stageStats).forEach(stage => {
      const leads = stageStats[stage].leads;
      const totalScore = leads.reduce((sum: number, lead: any) => sum + (lead.leadScore || 0), 0);
      stageStats[stage].averageScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;
    });

    console.log(`✅ Retornando ${formattedLeads.length} leads de leads-flow`);

    return NextResponse.json({ 
      leads: formattedLeads,
      stageStats,
      total: formattedLeads.length,
      metadata: {
        source: 'leads-flow',
        organizationId,
        generatedAt: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error al obtener leads de leads-flow:', error);
    return NextResponse.json({ 
      message: 'Error al obtener los leads del flujo.',
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Compatibility with GET requests
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const userId = searchParams.get('userId');
  
  if (!organizationId) {
    return NextResponse.json({ 
      message: 'organizationId es requerido como parámetro de consulta.' 
    }, { status: 400 });
  }

  // Create a mock request object for the POST handler
  const mockRequest = {
    headers: request.headers,
    json: async () => ({ organizationId, userId })
  } as any;

  return POST(mockRequest);
}