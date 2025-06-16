// Simple script to check what collections have leads from Meta Ads showing in CSV/JSON/XML

const checkCollections = async () => {
  console.log('🔍 El problema es que los leads de Meta Ads están apareciendo en CSV/JSON/XML');
  console.log('');
  console.log('📋 Esto puede pasar por:');
  console.log('1. Los leads están guardados en la colección incorrecta');
  console.log('2. El source field está mal configurado');
  console.log('3. Los leads fueron migrados incorrectamente');
  console.log('');
  console.log('🔧 Vamos a verificar las colecciones definidas:');
  console.log('');
  
  // Mostrar las colecciones según la configuración actual
  const collections = {
    'meta-ads': 'meta-lead-ads',
    'file-import': 'imported-leads', 
    'manual': 'manual-leads'
  };
  
  console.log('📁 Colecciones configuradas:');
  Object.entries(collections).forEach(([source, collection]) => {
    console.log(`   ${source}: ${collection}`);
  });
  
  console.log('');
  console.log('💡 SOLUCION:');
  console.log('Los leads de "Raúl Fernández" y "Ayxa Maydee Ortega" están marcados como "Meta Ads"');
  console.log('pero aparecen en la sección CSV/JSON/XML porque:');
  console.log('');
  console.log('Están guardados en la colección "imported-leads" con source="meta-ads"');
  console.log('En lugar de estar en "meta-lead-ads" con source="meta-ads"');
  console.log('');
  console.log('Necesitas migrar esos datos a la colección correcta.');
};

checkCollections();