const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

async function debugLeads() {
  try {
    console.log('🔍 Verificando colecciones de leads...\n');
    
    // Verificar meta-lead-ads
    const metaLeadsSnapshot = await db.collection('meta-lead-ads').get();
    console.log(`📊 meta-lead-ads: ${metaLeadsSnapshot.size} documentos`);
    
    if (metaLeadsSnapshot.size > 0) {
      const firstMetaLead = metaLeadsSnapshot.docs[0];
      console.log('   Ejemplo de meta-lead-ads:');
      console.log('   ID:', firstMetaLead.id);
      console.log('   organizationId:', firstMetaLead.data().organizationId);
      console.log('   name:', firstMetaLead.data().fullName || firstMetaLead.data().name);
    }
    
    console.log('');
    
    // Verificar leads-flow
    const flowLeadsSnapshot = await db.collection('leads-flow').get();
    console.log(`📊 leads-flow: ${flowLeadsSnapshot.size} documentos`);
    
    if (flowLeadsSnapshot.size > 0) {
      const firstFlowLead = flowLeadsSnapshot.docs[0];
      console.log('   Ejemplo de leads-flow:');
      console.log('   ID:', firstFlowLead.id);
      console.log('   organizationId:', firstFlowLead.data().organizationId);
      console.log('   name:', firstFlowLead.data().fullName || firstFlowLead.data().name);
      console.log('   flowStatus:', firstFlowLead.data().flowStatus);
      console.log('   currentStage:', firstFlowLead.data().currentStage);
      console.log('   sourceLeadId:', firstFlowLead.data().sourceLeadId);
    }
    
    console.log('');
    
    // Verificar leads-flow activos
    const activeFlowLeadsSnapshot = await db.collection('leads-flow')
      .where('flowStatus', '==', 'active')
      .get();
    console.log(`📊 leads-flow (activos): ${activeFlowLeadsSnapshot.size} documentos`);
    
    console.log('');
    
    // Verificar organizaciones disponibles
    const orgSnapshot = await db.collection('organizations').get();
    console.log(`📊 organizations: ${orgSnapshot.size} documentos`);
    
    if (orgSnapshot.size > 0) {
      console.log('   Organizaciones encontradas:');
      orgSnapshot.docs.forEach(doc => {
        console.log(`   - ${doc.id}: ${doc.data().name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugLeads();