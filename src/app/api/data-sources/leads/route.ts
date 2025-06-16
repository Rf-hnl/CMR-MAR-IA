import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import type { Timestamp } from 'firebase-admin/firestore';
import { DataSource, DATA_SOURCE_CONFIG, type UnifiedLead } from '@/types/data-sources';

export async function POST(request: NextRequest) {
  console.log('🚀 API /data-sources/leads called');
  
  if (!authAdmin || !firestoreDbAdmin) {
    console.error('❌ Firebase Admin SDK not initialized');
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  console.log('🔐 Checking authorization...');
  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    console.error('❌ Missing or invalid authorization header');
    return NextResponse.json({ 
      message: 'No autorizado: Token faltante o inválido.' 
    }, { status: 401 });
  }
  
  const token = authorizationHeader.split('Bearer ')[1];
  console.log('🔑 Token received (length):', token ? token.length : 'null');
  
  let decodedToken;
  try {
    console.log('🔓 Verifying Firebase token...');
    decodedToken = await authAdmin.verifyIdToken(token);
    console.log('✅ Token verified successfully');
  } catch (error) {
    console.error('❌ Error al verificar el token de ID de Firebase:', error);
    return NextResponse.json({ 
      message: 'No autorizado: Token inválido.' 
    }, { status: 401 });
  }

  const uid = decodedToken.uid;
  if (!uid) {
    console.error('❌ UID not found in token');
    return NextResponse.json({ 
      message: 'No autorizado: UID no encontrado en el token.' 
    }, { status: 401 });
  }
  
  console.log('👤 User UID:', uid);

  try {
    console.log('📥 Parsing request body...');
    const requestBody = await request.json();
    const { organizationId, source } = requestBody;
    
    console.log('📥 Request recibido:', requestBody);
    console.log('🔍 organizationId:', organizationId);
    console.log('🔍 source:', source);
    
    if (!organizationId || !source) {
      return NextResponse.json({ 
        message: 'organizationId y source son requeridos.' 
      }, { status: 400 });
    }

    console.log(`📋 Obteniendo leads de ${source} para organización:`, organizationId);

    const config = DATA_SOURCE_CONFIG[source as DataSource];
    if (!config) {
      console.error(`❌ Fuente de datos no válida: ${source}`);
      console.log('📁 Fuentes válidas:', Object.keys(DATA_SOURCE_CONFIG));
      return NextResponse.json({ 
        message: `Fuente de datos no válida: ${source}. Fuentes válidas: ${Object.keys(DATA_SOURCE_CONFIG).join(', ')}` 
      }, { status: 400 });
    }

    // Obtener leads de la colección fuente (manejar colecciones que no existen)
    let sourceSnapshot;
    try {
      const sourceQuery = firestoreDbAdmin
        .collection(config.collection)
        .where('organizationId', '==', organizationId)
        .orderBy('updatedAt', 'desc');
      
      sourceSnapshot = await sourceQuery.get();
      console.log(`📊 Encontrados ${sourceSnapshot.size} leads en ${config.collection}`);
    } catch (collectionError: any) {
      console.log(`ℹ️ Colección ${config.collection} no existe o está vacía:`, collectionError.message);
      // Retornar array vacío si la colección no existe
      return NextResponse.json({ 
        leads: [],
        source,
        total: 0,
        transferred: 0,
        available: 0,
        metadata: {
          collection: config.collection,
          organizationId,
          generatedAt: new Date().toISOString(),
          note: 'Colección no existe - tabla vacía'
        }
      }, { status: 200 });
    }

    // Si no hay leads en la fuente, retornar array vacío (no es error)
    if (sourceSnapshot.size === 0) {
      console.log(`ℹ️ No hay leads en ${config.collection}, retornando array vacío`);
      return NextResponse.json({ 
        leads: [],
        source,
        total: 0,
        transferred: 0,
        available: 0,
        metadata: {
          collection: config.collection,
          organizationId,
          generatedAt: new Date().toISOString()
        }
      }, { status: 200 });
    }

    // Obtener IDs de leads ya transferidos al flujo
    let flowSnapshot;
    let transferredIds = new Set<string>();
    
    try {
      const flowQuery = firestoreDbAdmin
        .collection('leads-flow')
        .where('organizationId', '==', organizationId)
        .where('sourceCollection', '==', config.collection);
      
      flowSnapshot = await flowQuery.get();
      transferredIds = new Set(
        flowSnapshot.docs.map(doc => doc.data().sourceLeadId)
      );
      console.log(`✅ ${transferredIds.size} leads ya transferidos al flujo`);
    } catch (flowError: any) {
      console.log(`ℹ️ No se pudieron obtener leads transferidos (esto es normal si no hay transferencias):`, flowError.message);
      transferredIds = new Set();
    }

    // Convertir a formato unificado
    const unifiedLeads: UnifiedLead[] = sourceSnapshot.docs.map(doc => {
      const data = doc.data();
      const isTransferred = transferredIds.has(doc.id);
      
      // Mapear campos comunes según la fuente
      let unifiedData: Partial<UnifiedLead> = {
        id: doc.id,
        source: source as DataSource,
        sourceId: doc.id,
        sourceData: data,
        organizationId,
        uid: data.uid || uid,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        transferredToFlow: isTransferred
      };

      // Mapear campos específicos según la fuente
      switch (source) {
        case DataSource.META_ADS:
          unifiedData.name = data.fullName || data.name || '';
          unifiedData.email = data.email || '';
          unifiedData.phone = data.phoneNumber || '';
          unifiedData.company = data.companyName || '';
          break;
          
        case DataSource.FILE_IMPORT:
          unifiedData.name = data.name || data.fullName || '';
          unifiedData.email = data.email || '';
          unifiedData.phone = data.phone || data.phoneNumber || '';
          unifiedData.company = data.company || data.companyName || '';
          break;
          
        case DataSource.MANUAL:
          unifiedData.name = data.name || '';
          unifiedData.email = data.email || '';
          unifiedData.phone = data.phone || '';
          unifiedData.company = data.company || '';
          break;
      }

      // Si está transferido, obtener información del lead en el flujo
      if (isTransferred) {
        const flowLead = flowSnapshot.docs.find(
          flowDoc => flowDoc.data().sourceLeadId === doc.id
        );
        if (flowLead) {
          unifiedData.flowLeadId = flowLead.id;
          unifiedData.transferredAt = flowLead.data().syncedAt || flowLead.data().createdAt?.toDate?.()?.toISOString();
        }
      }

      return unifiedData as UnifiedLead;
    });

    // Ordenar: no transferidos primero, luego por fecha de actualización
    unifiedLeads.sort((a, b) => {
      if (a.transferredToFlow !== b.transferredToFlow) {
        return a.transferredToFlow ? 1 : -1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    console.log(`🎯 Retornando ${unifiedLeads.length} leads unificados`);

    return NextResponse.json({ 
      leads: unifiedLeads,
      source,
      total: unifiedLeads.length,
      transferred: unifiedLeads.filter(lead => lead.transferredToFlow).length,
      available: unifiedLeads.filter(lead => !lead.transferredToFlow).length,
      metadata: {
        collection: config.collection,
        organizationId,
        generatedAt: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error obteniendo leads de fuente de datos:', error);
    console.error('💥 Error stack:', error.stack);
    return NextResponse.json({ 
      message: 'Error obteniendo leads de la fuente de datos.',
      error: error.message,
      stack: error.stack,
      source: request.body,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}