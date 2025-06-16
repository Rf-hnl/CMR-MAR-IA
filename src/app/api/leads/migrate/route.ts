// === MIGRATION API ===
// API para migrar datos existentes al sistema unificado

import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { leadUnifier } from '@/lib/lead-unifier';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return { error: 'Firebase Admin SDK not initialized', status: 500 };
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { error: 'No autorizado: Token faltante o inválido', status: 401 };
  }

  const token = authorizationHeader.split('Bearer ')[1];
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    if (!decodedToken.uid) {
      return { error: 'No autorizado: UID no encontrado en el token', status: 401 };
    }
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { error: 'No autorizado: Token inválido', status: 401 };
  }
}

// === POST: Run migration ===
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const body = await request.json();
    const { organizationId, sources, dryRun = false } = body;

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'organizationId es requerido' 
      }, { status: 400 });
    }

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'sources array es requerido (valores: meta-lead-ads, leads-flow, leads)' 
      }, { status: 400 });
    }

    console.log(`🔄 Iniciando migración para organización: ${organizationId}`);
    console.log(`📊 Fuentes: ${sources.join(', ')}`);
    console.log(`🧪 Dry run: ${dryRun}`);

    const migrationResults: any = {
      organizationId,
      sources: sources,
      dryRun,
      timestamp: new Date().toISOString(),
      results: {},
      summary: {
        totalProcessed: 0,
        totalCreated: 0,
        totalErrors: 0
      }
    };

    // Migrate from meta-lead-ads
    if (sources.includes('meta-lead-ads')) {
      console.log('📊 Migrando desde meta-lead-ads...');
      
      if (dryRun) {
        // Just count what would be migrated
        const metaSnapshot = await firestoreDbAdmin
          .collection('meta-lead-ads')
          .where('organizationId', '==', organizationId)
          .get();
        
        migrationResults.results['meta-lead-ads'] = {
          totalDocuments: metaSnapshot.size,
          processed: metaSnapshot.size,
          created: metaSnapshot.size,
          errors: [],
          dryRun: true
        };
      } else {
        const metaResult = await leadUnifier.migrateFromMetaLeads(organizationId);
        migrationResults.results['meta-lead-ads'] = metaResult;
      }
      
      const metaRes = migrationResults.results['meta-lead-ads'];
      migrationResults.summary.totalProcessed += metaRes.processed || 0;
      migrationResults.summary.totalCreated += metaRes.created || 0;
      migrationResults.summary.totalErrors += metaRes.errors?.length || 0;
    }

    // Migrate from leads-flow
    if (sources.includes('leads-flow')) {
      console.log('📊 Migrando desde leads-flow...');
      
      if (dryRun) {
        // Just count what would be migrated
        const flowSnapshot = await firestoreDbAdmin
          .collection('leads-flow')
          .where('organizationId', '==', organizationId)
          .get();
        
        migrationResults.results['leads-flow'] = {
          totalDocuments: flowSnapshot.size,
          processed: flowSnapshot.size,
          created: flowSnapshot.size,
          errors: [],
          dryRun: true
        };
      } else {
        const flowResult = await leadUnifier.migrateFromLeadsFlow(organizationId);
        migrationResults.results['leads-flow'] = flowResult;
      }
      
      const flowRes = migrationResults.results['leads-flow'];
      migrationResults.summary.totalProcessed += flowRes.processed || 0;
      migrationResults.summary.totalCreated += flowRes.created || 0;
      migrationResults.summary.totalErrors += flowRes.errors?.length || 0;
    }

    // Migrate from legacy leads collection
    if (sources.includes('leads')) {
      console.log('📊 Migrando desde leads (legacy)...');
      
      // For now, we'll just count - can implement later if needed
      const leadsSnapshot = await firestoreDbAdmin
        .collection('leads')
        .where('organizationId', '==', organizationId)
        .get();
      
      migrationResults.results['leads'] = {
        totalDocuments: leadsSnapshot.size,
        processed: 0,
        created: 0,
        errors: [],
        note: 'Legacy leads collection - migration not yet implemented'
      };
    }

    const isSuccess = migrationResults.summary.totalErrors === 0;
    const statusCode = isSuccess ? 200 : (migrationResults.summary.totalCreated > 0 ? 206 : 400);

    console.log(`✅ Migración completada. Procesados: ${migrationResults.summary.totalProcessed}, Creados: ${migrationResults.summary.totalCreated}, Errores: ${migrationResults.summary.totalErrors}`);

    return NextResponse.json({
      success: isSuccess,
      message: dryRun 
        ? 'Dry run completado - no se realizaron cambios'
        : `Migración completada: ${migrationResults.summary.totalCreated} leads creados, ${migrationResults.summary.totalErrors} errores`,
      data: migrationResults
    }, { status: statusCode });

  } catch (error: any) {
    console.error('Error en migración:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error durante la migración',
      error: error.message 
    }, { status: 500 });
  }
}

// === GET: Check migration status ===
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'organizationId es requerido' 
      }, { status: 400 });
    }

    // Check existing data in all collections
    const [metaSnapshot, flowSnapshot, leadsSnapshot, unifiedSnapshot] = await Promise.all([
      firestoreDbAdmin.collection('meta-lead-ads').where('organizationId', '==', organizationId).count().get(),
      firestoreDbAdmin.collection('leads-flow').where('organizationId', '==', organizationId).count().get(),
      firestoreDbAdmin.collection('leads').where('organizationId', '==', organizationId).count().get(),
      firestoreDbAdmin.collection('leads-unified').where('organizationId', '==', organizationId).count().get()
    ]);

    const status = {
      organizationId,
      collections: {
        'meta-lead-ads': metaSnapshot.data().count,
        'leads-flow': flowSnapshot.data().count,
        'leads': leadsSnapshot.data().count,
        'leads-unified': unifiedSnapshot.data().count
      },
      migrationNeeded: {
        'meta-lead-ads': metaSnapshot.data().count > 0,
        'leads-flow': flowSnapshot.data().count > 0,
        'leads': leadsSnapshot.data().count > 0
      },
      isFullyMigrated: unifiedSnapshot.data().count > 0 && 
                       (metaSnapshot.data().count + flowSnapshot.data().count) <= unifiedSnapshot.data().count,
      recommendations: []
    };

    // Generate recommendations
    if (status.collections['meta-lead-ads'] > 0 && status.collections['leads-unified'] === 0) {
      status.recommendations.push('Migrar desde meta-lead-ads para obtener datos completos de Meta');
    }
    if (status.collections['leads-flow'] > 0) {
      status.recommendations.push('Migrar desde leads-flow para obtener datos enriquecidos del pipeline');
    }
    if (status.collections['leads'] > 0) {
      status.recommendations.push('Considerar migrar desde leads (legacy) si contiene datos únicos');
    }
    if (status.collections['leads-unified'] === 0) {
      status.recommendations.push('Ejecutar migración completa para comenzar a usar el sistema unificado');
    }

    return NextResponse.json({
      success: true,
      data: status
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error checking migration status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error verificando estado de migración',
      error: error.message 
    }, { status: 500 });
  }
}