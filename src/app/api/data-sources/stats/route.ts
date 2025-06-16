import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { DataSource, DATA_SOURCE_CONFIG, type DataSourceStats } from '@/types/data-sources';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    console.log('📊 Obteniendo estadísticas de fuentes de datos para:', organizationId);
    console.log('📁 Fuentes configuradas:', Object.keys(DATA_SOURCE_CONFIG));

    const stats: DataSourceStats[] = [];

    // Para cada fuente de datos, obtener estadísticas
    for (const [source, config] of Object.entries(DATA_SOURCE_CONFIG)) {
      console.log(`🔍 Procesando fuente: ${source} -> ${config.collection}`);
      try {
        // Contar total de leads en la colección fuente
        let totalLeads = 0;
        let transferredLeads = 0;
        
        try {
          const sourceQuery = firestoreDbAdmin
            .collection(config.collection)
            .where('organizationId', '==', organizationId);
          
          const sourceSnapshot = await sourceQuery.get();
          totalLeads = sourceSnapshot.size;
        } catch (collectionError) {
          console.log(`ℹ️ Colección ${config.collection} no existe, asumiendo 0 leads`);
          totalLeads = 0;
        }

        // Contar leads ya transferidos al flujo desde esta fuente
        try {
          const flowQuery = firestoreDbAdmin
            .collection('leads-flow')
            .where('organizationId', '==', organizationId)
            .where('sourceCollection', '==', config.collection);
          
          const flowSnapshot = await flowQuery.get();
          transferredLeads = flowSnapshot.size;
        } catch (flowError) {
          console.log(`ℹ️ No hay leads transferidos para ${config.collection}, asumiendo 0`);
          transferredLeads = 0;
        }

        const pendingLeads = Math.max(0, totalLeads - transferredLeads);

        stats.push({
          source: source as DataSource,
          total: totalLeads,
          transferred: transferredLeads,
          pending: pendingLeads,
          isActive: config.autoSync || totalLeads > 0,
          lastSync: totalLeads > 0 ? new Date().toISOString() : undefined
        });

        console.log(`📈 ${config.name}: ${totalLeads} total, ${transferredLeads} transferidos, ${pendingLeads} pendientes`);

      } catch (error) {
        console.error(`❌ Error obteniendo stats para ${config.name}:`, error);
        
        // Agregar stats por defecto en caso de error
        stats.push({
          source: source as DataSource,
          total: 0,
          transferred: 0,
          pending: 0,
          isActive: false
        });
      }
    }

    // Ordenar por número de leads pendientes (descendente)
    stats.sort((a, b) => b.pending - a.pending);

    console.log('✅ Estadísticas obtenidas para todas las fuentes');

    return NextResponse.json({ 
      stats,
      organizationId,
      generatedAt: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error obteniendo estadísticas de fuentes:', error);
    return NextResponse.json({ 
      message: 'Error obteniendo estadísticas de fuentes de datos.',
      error: error.message 
    }, { status: 500 });
  }
}