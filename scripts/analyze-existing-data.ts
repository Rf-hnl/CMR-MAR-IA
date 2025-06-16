// === DATA ANALYSIS SCRIPT ===
// Script para analizar los datos existentes y verificar qué campos están disponibles

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Tipos para análisis
interface FieldAnalysis {
  fieldName: string;
  totalDocuments: number;
  documentsWithField: number;
  percentage: number;
  sampleValues: any[];
  dataTypes: Set<string>;
  nullCount: number;
  emptyStringCount: number;
}

interface CollectionAnalysis {
  collectionName: string;
  totalDocuments: number;
  fields: Record<string, FieldAnalysis>;
  sampleDocuments: any[];
}

// Inicializar Firebase Admin
let db: any;

function initializeFirebase() {
  try {
    // Intentar cargar el service account key
    let serviceAccount;
    try {
      const serviceAccountPath = join(process.cwd(), 'serviceAccountKey.json');
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    } catch {
      console.log('⚠️  serviceAccountKey.json no encontrado. Usando variables de entorno...');
      
      // Usar variables de entorno como fallback
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };
    }

    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    db = getFirestore(app);
    console.log('✅ Firebase Admin inicializado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
    return false;
  }
}

// Funciones de análisis
function analyzeField(fieldName: string, values: any[]): FieldAnalysis {
  const analysis: FieldAnalysis = {
    fieldName,
    totalDocuments: values.length,
    documentsWithField: 0,
    percentage: 0,
    sampleValues: [],
    dataTypes: new Set(),
    nullCount: 0,
    emptyStringCount: 0
  };

  const sampleSize = Math.min(10, values.length);
  const sampleIndices = new Set<number>();
  
  values.forEach((value, index) => {
    if (value !== undefined) {
      analysis.documentsWithField++;
      
      // Agregar a muestra si no está llena
      if (analysis.sampleValues.length < sampleSize && !sampleIndices.has(index)) {
        analysis.sampleValues.push(value);
        sampleIndices.add(index);
      }
      
      // Analizar tipos de datos
      if (value === null) {
        analysis.nullCount++;
        analysis.dataTypes.add('null');
      } else if (value === '') {
        analysis.emptyStringCount++;
        analysis.dataTypes.add('empty_string');
      } else {
        analysis.dataTypes.add(typeof value);
      }
    }
  });

  analysis.percentage = (analysis.documentsWithField / analysis.totalDocuments) * 100;
  
  return analysis;
}

async function analyzeCollection(collectionName: string, limit: number = 100): Promise<CollectionAnalysis> {
  console.log(`\n📊 Analizando colección: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).limit(limit).get();
    const documents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    console.log(`   📄 Documentos encontrados: ${documents.length}`);
    
    if (documents.length === 0) {
      return {
        collectionName,
        totalDocuments: 0,
        fields: {},
        sampleDocuments: []
      };
    }

    // Obtener todos los campos únicos
    const allFields = new Set<string>();
    documents.forEach(doc => {
      Object.keys(doc).forEach(key => allFields.add(key));
    });

    console.log(`   🏷️  Campos únicos encontrados: ${allFields.size}`);

    // Analizar cada campo
    const fieldAnalyses: Record<string, FieldAnalysis> = {};
    
    for (const fieldName of allFields) {
      const values = documents.map(doc => doc[fieldName]);
      fieldAnalyses[fieldName] = analyzeField(fieldName, values);
    }

    // Tomar muestra de documentos completos
    const sampleSize = Math.min(3, documents.length);
    const sampleDocuments = documents.slice(0, sampleSize);

    return {
      collectionName,
      totalDocuments: documents.length,
      fields: fieldAnalyses,
      sampleDocuments
    };
    
  } catch (error) {
    console.error(`❌ Error analizando ${collectionName}:`, error);
    return {
      collectionName,
      totalDocuments: 0,
      fields: {},
      sampleDocuments: []
    };
  }
}

function printCollectionAnalysis(analysis: CollectionAnalysis) {
  console.log(`\n🔍 === ANÁLISIS DE ${analysis.collectionName.toUpperCase()} ===`);
  console.log(`📊 Total documentos: ${analysis.totalDocuments}`);
  
  if (analysis.totalDocuments === 0) {
    console.log('   (Colección vacía)');
    return;
  }

  console.log('\n📋 CAMPOS DISPONIBLES:');
  
  // Ordenar campos por porcentaje de disponibilidad
  const sortedFields = Object.values(analysis.fields)
    .sort((a, b) => b.percentage - a.percentage);

  sortedFields.forEach(field => {
    const availability = field.percentage.toFixed(1);
    const types = Array.from(field.dataTypes).join(', ');
    const status = field.percentage >= 80 ? '✅' : 
                   field.percentage >= 50 ? '⚠️' : '❌';
    
    console.log(`   ${status} ${field.fieldName}: ${availability}% (${field.documentsWithField}/${field.totalDocuments})`);
    console.log(`      Tipos: ${types}`);
    
    if (field.sampleValues.length > 0) {
      const samples = field.sampleValues.slice(0, 3).map(v => {
        if (typeof v === 'string' && v.length > 50) {
          return v.substring(0, 50) + '...';
        }
        return JSON.stringify(v);
      });
      console.log(`      Ejemplos: ${samples.join(', ')}`);
    }
    console.log('');
  });

  // Campos críticos faltantes
  const criticalFields = ['id', 'name', 'fullName', 'email', 'phone', 'phoneNumber'];
  const missingCritical = criticalFields.filter(field => 
    !analysis.fields[field] || analysis.fields[field].percentage < 50
  );

  if (missingCritical.length > 0) {
    console.log(`⚠️  CAMPOS CRÍTICOS FALTANTES: ${missingCritical.join(', ')}`);
  }

  // Mostrar ejemplo de documento completo
  if (analysis.sampleDocuments.length > 0) {
    console.log('\n📄 EJEMPLO DE DOCUMENTO:');
    const sample = analysis.sampleDocuments[0];
    const cleanSample = Object.fromEntries(
      Object.entries(sample).slice(0, 10) // Solo primeros 10 campos
    );
    console.log(JSON.stringify(cleanSample, null, 2));
    
    if (Object.keys(sample).length > 10) {
      console.log(`   ... y ${Object.keys(sample).length - 10} campos más`);
    }
  }
}

// Análisis específico para leads
async function analyzeLeadCompatibility() {
  console.log('\n🎯 === ANÁLISIS DE COMPATIBILIDAD PARA UNIFIED LEAD ===');

  // Campos requeridos para UnifiedLead
  const requiredFields = [
    'id', 'fullName', 'email', 'phone', 'uid', 'organizationId',
    'stage', 'source', 'createdAt', 'updatedAt'
  ];

  // Campos de Meta Ads específicos
  const metaFields = [
    'campaignName', 'campaignId', 'adSetName', 'adSetId', 'adName',
    'formId', 'platformId', 'leadId', 'isOrganic', 'partnerName',
    'vehicle', 'homeListing', 'visitRequest', 'customDisclaimerResponses'
  ];

  const collections = ['meta-lead-ads', 'leads-flow', 'leads'];
  
  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).limit(50).get();
      if (snapshot.empty) {
        console.log(`\n❌ ${collectionName}: Colección vacía`);
        continue;
      }

      const documents = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      console.log(`\n✅ ${collectionName}: ${documents.length} documentos`);

      // Verificar campos requeridos
      console.log('   📋 Campos requeridos:');
      requiredFields.forEach(field => {
        const docsWithField = documents.filter(doc => 
          doc[field] !== undefined && doc[field] !== null && doc[field] !== ''
        ).length;
        const percentage = (docsWithField / documents.length * 100).toFixed(1);
        const status = docsWithField === documents.length ? '✅' : 
                       docsWithField > documents.length * 0.8 ? '⚠️' : '❌';
        console.log(`      ${status} ${field}: ${percentage}% (${docsWithField}/${documents.length})`);
      });

      // Verificar campos de Meta Ads
      if (collectionName === 'meta-lead-ads') {
        console.log('   🎯 Campos específicos de Meta Ads:');
        metaFields.forEach(field => {
          const docsWithField = documents.filter(doc => 
            doc[field] !== undefined && doc[field] !== null && doc[field] !== ''
          ).length;
          const percentage = (docsWithField / documents.length * 100).toFixed(1);
          const status = docsWithField > documents.length * 0.8 ? '✅' : 
                         docsWithField > documents.length * 0.5 ? '⚠️' : '❌';
          console.log(`      ${status} ${field}: ${percentage}% (${docsWithField}/${documents.length})`);
        });
      }

    } catch (error) {
      console.error(`❌ Error analizando ${collectionName}:`, error);
    }
  }
}

// Script principal
async function main() {
  console.log('🔍 === ANÁLISIS DE DATOS EXISTENTES ===\n');

  if (!initializeFirebase()) {
    process.exit(1);
  }

  try {
    // Analizar cada colección
    const collections = ['meta-lead-ads', 'leads-flow', 'leads'];
    const analyses: CollectionAnalysis[] = [];

    for (const collectionName of collections) {
      const analysis = await analyzeCollection(collectionName, 100);
      analyses.push(analysis);
      printCollectionAnalysis(analysis);
    }

    // Análisis de compatibilidad específico
    await analyzeLeadCompatibility();

    // Resumen final
    console.log('\n📊 === RESUMEN FINAL ===');
    console.log('Colecciones analizadas:');
    analyses.forEach(analysis => {
      console.log(`   • ${analysis.collectionName}: ${analysis.totalDocuments} documentos, ${Object.keys(analysis.fields).length} campos únicos`);
    });

    console.log('\n🎯 RECOMENDACIONES:');
    
    const metaAnalysis = analyses.find(a => a.collectionName === 'meta-lead-ads');
    if (metaAnalysis && metaAnalysis.totalDocuments > 0) {
      console.log('   ✅ meta-lead-ads contiene datos - usar como fuente principal');
      console.log('   📋 Implementar mapeo desde MetaLeadAdsModel a UnifiedLead');
    }

    const flowAnalysis = analyses.find(a => a.collectionName === 'leads-flow');
    if (flowAnalysis && flowAnalysis.totalDocuments > 0) {
      console.log('   ✅ leads-flow contiene datos enriquecidos - usar para migración');
    }

    const leadsAnalysis = analyses.find(a => a.collectionName === 'leads');
    if (leadsAnalysis && leadsAnalysis.totalDocuments > 0) {
      console.log('   ⚠️  leads es colección legacy - migrar gradualmente');
    }

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Implementar API unificada basada en datos disponibles');
    console.log('   2. Crear script de migración gradual');
    console.log('   3. Actualizar UI para usar estructura unificada');
    console.log('   4. Validar integridad de datos migrados');

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { analyzeCollection, analyzeLeadCompatibility, initializeFirebase };