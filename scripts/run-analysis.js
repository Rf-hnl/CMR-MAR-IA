#!/usr/bin/env node

// === EXECUTABLE ANALYSIS SCRIPT ===
// Script ejecutable para analizar datos existentes

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 === ANÁLISIS DE DATOS EXISTENTES ===\n');

// Check if TypeScript files exist
const scriptsDir = path.join(__dirname);
const tsScript = path.join(scriptsDir, 'analyze-existing-data.ts');

if (!fs.existsSync(tsScript)) {
  console.error('❌ Error: analyze-existing-data.ts no encontrado');
  process.exit(1);
}

// Try to run with tsx (if available) or ts-node
function runTypeScript() {
  console.log('📊 Ejecutando análisis de datos...\n');
  
  // Try tsx first (faster)
  const tsx = spawn('npx', ['tsx', tsScript], {
    stdio: 'inherit',
    cwd: path.dirname(scriptsDir)
  });

  tsx.on('error', (error) => {
    if (error.code === 'ENOENT') {
      console.log('⚠️  tsx no encontrado, intentando con ts-node...\n');
      
      // Fallback to ts-node
      const tsNode = spawn('npx', ['ts-node', tsScript], {
        stdio: 'inherit',
        cwd: path.dirname(scriptsDir)
      });

      tsNode.on('error', (error) => {
        console.error('❌ Error ejecutando ts-node:', error.message);
        console.log('\n💡 Instala ts-node o tsx:');
        console.log('   npm install -g ts-node');
        console.log('   npm install -g tsx');
        process.exit(1);
      });

      tsNode.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Análisis completado exitosamente');
        } else {
          console.log(`\n❌ Análisis falló con código: ${code}`);
        }
        process.exit(code);
      });
    } else {
      console.error('❌ Error ejecutando tsx:', error.message);
      process.exit(1);
    }
  });

  tsx.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Análisis completado exitosamente');
    } else {
      console.log(`\n❌ Análisis falló con código: ${code}`);
    }
    process.exit(code);
  });
}

// Check for service account key
const serviceAccountPath = path.join(path.dirname(scriptsDir), 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.log('⚠️  serviceAccountKey.json no encontrado');
  console.log('📋 El script intentará usar variables de entorno de Firebase');
  console.log('   Asegúrate de tener configuradas las variables:');
  console.log('   - FIREBASE_PROJECT_ID');
  console.log('   - FIREBASE_PRIVATE_KEY');
  console.log('   - FIREBASE_CLIENT_EMAIL');
  console.log('   - etc.\n');
}

runTypeScript();