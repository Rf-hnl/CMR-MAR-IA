// Temporal - sin validación de UID para debugging
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

    console.log('🗑️ TEMP DELETE REQUEST:', { 
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

    // TEMPORAL: Eliminar sin validar UID para debugging
    for (const leadId of leadIds) {
      console.log(`🔍 TEMP: Checking lead: ${leadId}`);
      const leadRef = firestoreDbAdmin.collection(collectionName).doc(leadId);
      const leadDoc = await leadRef.get();
      
      if (leadDoc.exists) {
        const leadData = leadDoc.data();
        console.log(`📄 TEMP: Lead exists, deleting without UID validation`);
        
        // ELIMINAR SIN VALIDAR UID (SOLO PARA DEBUG)
        batch.delete(leadRef);
        deletedCount++;
      } else {
        console.log(`❌ TEMP: Lead not found: ${leadId}`);
      }
    }

    // Ejecutar eliminación en lote
    console.log(`🔥 TEMP: Committing batch deletion of ${deletedCount} leads`);
    await batch.commit();
    console.log(`✅ TEMP: Batch committed successfully`);

    return NextResponse.json({
      success: true,
      message: `${deletedCount} leads eliminados correctamente (TEMP - sin validación UID)`,
      deletedCount,
      requested: leadIds.length
    });

  } catch (error) {
    console.error('TEMP Error deleting leads:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}