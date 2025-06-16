import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';
import type { LeadsFlowModel } from '@/types/leads-flow';
import { DEFAULT_FLOW_CONFIG } from '@/types/leads-flow';

export async function POST(request: NextRequest) {
  if (!firestoreDbAdmin || !authAdmin) {
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  // Verificar autorización
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
    const { organizationId, leadIds, sourceType } = await request.json();
    
    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    console.log(`🔄 Transfiriendo leads a leads-flow para organización: ${organizationId}`);
    
    let transferredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Si se especifican IDs específicos, transferir solo esos
    if (leadIds && Array.isArray(leadIds) && leadIds.length > 0) {
      console.log(`📋 Transfiriendo ${leadIds.length} leads específicos`);
      
      for (const leadId of leadIds) {
        try {
          const result = await transferSingleLead(leadId, uid, organizationId);
          if (result.success) {
            transferredCount++;
          } else {
            skippedCount++;
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Lead ${leadId}: ${error.message}`);
        }
      }
    } else {
      // Transferir todos los leads de meta-lead-ads que no estén ya en leads-flow
      console.log('📋 Transfiriendo todos los leads de meta-lead-ads');
      
      const metaLeadsSnapshot = await firestoreDbAdmin
        .collection('meta-lead-ads')
        .where('organizationId', '==', organizationId)
        .get();

      console.log(`📊 Encontrados ${metaLeadsSnapshot.size} leads en meta-lead-ads`);

      for (const doc of metaLeadsSnapshot.docs) {
        try {
          const result = await transferSingleLead(doc.id, uid, organizationId);
          if (result.success) {
            transferredCount++;
          } else {
            skippedCount++;
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Lead ${doc.id}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Transferencia completada: ${transferredCount} transferidos, ${skippedCount} omitidos, ${errorCount} errores`);

    return NextResponse.json({ 
      message: 'Transferencia completada',
      transferred: transferredCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errors
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error durante la transferencia:', error);
    return NextResponse.json({ 
      message: 'Error durante la transferencia.',
      error: error.message 
    }, { status: 500 });
  }
}

async function transferSingleLead(
  leadId: string, 
  userId: string, 
  organizationId: string
): Promise<{ success: boolean; reason?: string }> {
  
  // Verificar si ya existe en leads-flow
  const existingFlowLead = await firestoreDbAdmin!
    .collection('leads-flow')
    .where('sourceLeadId', '==', leadId)
    .where('organizationId', '==', organizationId)
    .limit(1)
    .get();

  if (!existingFlowLead.empty) {
    console.log(`⏭️ Lead ${leadId} ya existe en leads-flow, omitiendo`);
    return { success: false, reason: 'already_exists' };
  }

  // Obtener el lead original de meta-lead-ads
  const metaLeadDoc = await firestoreDbAdmin!
    .collection('meta-lead-ads')
    .doc(leadId)
    .get();

  if (!metaLeadDoc.exists) {
    throw new Error(`Lead ${leadId} no encontrado en meta-lead-ads`);
  }

  const metaLeadData = metaLeadDoc.data() as MetaLeadAdsModel;
  
  // Crear el nuevo lead en leads-flow con propiedades de flujo
  const now = new Date().toISOString();
  const flowLead: Omit<LeadsFlowModel, 'id'> = {
    // Copiar todas las propiedades del meta-lead
    ...metaLeadData,
    
    // Agregar propiedades específicas del flujo
    ...DEFAULT_FLOW_CONFIG,
    
    // Metadatos de sincronización
    sourceLeadId: leadId,
    sourceCollection: 'meta-lead-ads',
    syncedAt: now,
    lastSyncedAt: now,
    
    // Configuración inicial del flujo
    currentStage: metaLeadData.stage || 'Nuevo',
    stageHistory: [{
      stage: metaLeadData.stage || 'Nuevo',
      enteredAt: now,
      triggeredBy: 'system',
      userId: userId,
      notes: 'Lead transferido desde Meta Ads'
    }],
    
    // Timestamps de Firebase
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  // Guardar en leads-flow
  await firestoreDbAdmin!.collection('leads-flow').add(flowLead);
  
  console.log(`✅ Lead ${leadId} transferido exitosamente a leads-flow`);
  return { success: true };
}

// GET endpoint para obtener estadísticas de transferencia
export async function GET(request: NextRequest) {
  if (!firestoreDbAdmin || !authAdmin) {
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
    return NextResponse.json({ 
      message: 'No autorizado: Token inválido.' 
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

    // Contar leads en meta-lead-ads
    const metaLeadsSnapshot = await firestoreDbAdmin
      .collection('meta-lead-ads')
      .where('organizationId', '==', organizationId)
      .get();

    // Contar leads en leads-flow
    const flowLeadsSnapshot = await firestoreDbAdmin
      .collection('leads-flow')
      .where('organizationId', '==', organizationId)
      .get();

    // Contar leads ya sincronizados
    const syncedLeadsSnapshot = await firestoreDbAdmin
      .collection('leads-flow')
      .where('organizationId', '==', organizationId)
      .where('sourceCollection', '==', 'meta-lead-ads')
      .get();

    return NextResponse.json({
      totalMetaLeads: metaLeadsSnapshot.size,
      totalFlowLeads: flowLeadsSnapshot.size,
      syncedFromMeta: syncedLeadsSnapshot.size,
      pendingTransfer: metaLeadsSnapshot.size - syncedLeadsSnapshot.size
    });

  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ 
      message: 'Error obteniendo estadísticas.',
      error: error.message 
    }, { status: 500 });
  }
}