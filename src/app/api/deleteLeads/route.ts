// src/app/api/deleteLeads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {

    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Parsear datos
    const { leadIds, collection: collectionName = 'meta-lead-ads' } = await request.json();

    console.log('🗑️ DELETE REQUEST:', { 
      uid, 
      leadIds, 
      collectionName, 
      leadCount: leadIds?.length 
    });

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de leadIds' }, { status: 400 });
    }

    const batch = firestoreDbAdmin.batch();
    let deletedCount = 0;

    // Verificar que los leads pertenecen al usuario antes de eliminar
    for (const leadId of leadIds) {
      console.log(`🔍 Checking lead: ${leadId}`);
      const leadRef = firestoreDbAdmin.collection(collectionName).doc(leadId);
      const leadDoc = await leadRef.get();
      
      if (leadDoc.exists) {
        const leadData = leadDoc.data();
        console.log(`📄 Lead exists. Full data:`, JSON.stringify({
          leadId,
          hasUid: !!leadData?.uid,
          dataUid: leadData?.uid,
          userUid: uid,
          match: leadData?.uid === uid,
          allFields: Object.keys(leadData || {})
        }, null, 2));
        
        // Verificar que el lead pertenece al usuario
        if (leadData?.uid === uid) {
          console.log(`✅ Adding to batch for deletion: ${leadId}`);
          batch.delete(leadRef);
          deletedCount++;
        } else {
          console.log(`❌ UID mismatch for lead: ${leadId} - Data UID: "${leadData?.uid}", User UID: "${uid}"`);
        }
      } else {
        console.log(`❌ Lead not found: ${leadId}`);
      }
    }

    // Ejecutar eliminación en lote
    console.log(`🔥 Committing batch deletion of ${deletedCount} leads`);
    await batch.commit();
    console.log(`✅ Batch committed successfully`);

    return NextResponse.json({
      success: true,
      message: `${deletedCount} leads eliminados correctamente`,
      deletedCount,
      requested: leadIds.length
    });

  } catch (error) {
    console.error('Error deleting leads:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}