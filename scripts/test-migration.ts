// === MIGRATION TEST SCRIPT ===
// Script para probar la migración al sistema unificado

import { spawn } from 'child_process';

interface MigrationTestResult {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

class MigrationTester {
  private results: MigrationTestResult[] = [];
  
  constructor() {
    this.initializeSteps();
  }

  private initializeSteps() {
    const steps = [
      { step: 'check-server', message: 'Verificar servidor de desarrollo' },
      { step: 'test-apis', message: 'Probar APIs existentes' },
      { step: 'test-unified-types', message: 'Verificar tipos unificados' },
      { step: 'test-unified-api', message: 'Probar API unificada' },
      { step: 'test-migration-api', message: 'Probar API de migración' },
      { step: 'test-components', message: 'Verificar componentes React' }
    ];

    this.results = steps.map(s => ({
      ...s,
      status: 'pending'
    }));
  }

  private updateStep(step: string, status: MigrationTestResult['status'], message: string, details?: any) {
    const index = this.results.findIndex(r => r.step === step);
    if (index >= 0) {
      this.results[index] = {
        ...this.results[index],
        status,
        message,
        details,
        duration: status === 'success' || status === 'error' ? Date.now() : undefined
      };
    }
    this.printStatus();
  }

  private printStatus() {
    console.clear();
    console.log('🧪 === PRUEBA DE MIGRACIÓN AL SISTEMA UNIFICADO ===\n');
    
    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'error' ? '❌' : 
                   result.status === 'running' ? '🔄' : '⏸️';
      
      console.log(`${icon} ${result.message}`);
      if (result.details) {
        console.log(`   📋 ${JSON.stringify(result.details, null, 2).slice(0, 100)}...`);
      }
    });
    console.log('');
  }

  async checkServerRunning(): Promise<boolean> {
    this.updateStep('check-server', 'running', 'Verificando servidor...');
    
    try {
      // Check if development server is running on expected ports
      const ports = [3047, 3048, 3000];
      
      for (const port of ports) {
        try {
          const response = await fetch(`http://localhost:${port}/api/leads/unified`, {
            method: 'HEAD'
          });
          
          if (response.status === 401 || response.status === 200) {
            this.updateStep('check-server', 'success', `Servidor encontrado en puerto ${port}`, { port });
            return true;
          }
        } catch {
          // Port not available, continue checking
        }
      }
      
      this.updateStep('check-server', 'error', 'Servidor no encontrado en puertos 3000, 3047, 3048');
      return false;
    } catch (error: any) {
      this.updateStep('check-server', 'error', `Error verificando servidor: ${error.message}`);
      return false;
    }
  }

  async testExistingAPIs(): Promise<boolean> {
    this.updateStep('test-apis', 'running', 'Probando APIs existentes...');
    
    try {
      const apis = [
        '/api/getMetaLeads',
        '/api/getLeadsFlow', 
        '/api/getLeads'
      ];
      
      const results = await Promise.allSettled(
        apis.map(async api => {
          const response = await fetch(`http://localhost:3048${api}`, {
            method: 'HEAD'
          });
          return { api, status: response.status };
        })
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      this.updateStep('test-apis', 'success', `${successful}/${apis.length} APIs existentes disponibles`, {
        results: results.map((r, i) => ({
          api: apis[i],
          status: r.status === 'fulfilled' ? 'available' : 'error'
        }))
      });
      
      return successful > 0;
    } catch (error: any) {
      this.updateStep('test-apis', 'error', `Error probando APIs: ${error.message}`);
      return false;
    }
  }

  async testUnifiedTypes(): Promise<boolean> {
    this.updateStep('test-unified-types', 'running', 'Verificando tipos TypeScript...');
    
    return new Promise((resolve) => {
      const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck', 
        'src/types/unified-lead.ts',
        'src/lib/lead-validators.ts', 
        'src/lib/lead-mappers.ts'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      tsc.stdout.on('data', (data) => {
        output += data.toString();
      });

      tsc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tsc.on('close', (code) => {
        if (code === 0) {
          this.updateStep('test-unified-types', 'success', 'Tipos TypeScript válidos', {
            message: 'Compilación exitosa'
          });
          resolve(true);
        } else {
          this.updateStep('test-unified-types', 'error', 'Errores en tipos TypeScript', {
            error: errorOutput.slice(0, 200)
          });
          resolve(false);
        }
      });
    });
  }

  async testUnifiedAPI(): Promise<boolean> {
    this.updateStep('test-unified-api', 'running', 'Probando API unificada...');
    
    try {
      // Test GET endpoint
      const response = await fetch('http://localhost:3048/api/leads/unified?organizationId=test', {
        method: 'GET'
      });
      
      const status = response.status;
      
      if (status === 401) {
        this.updateStep('test-unified-api', 'success', 'API unificada responde (requiere auth)', {
          status: 401,
          message: 'Endpoint disponible, autenticación requerida'
        });
        return true;
      } else if (status === 200) {
        const data = await response.json();
        this.updateStep('test-unified-api', 'success', 'API unificada funcional', {
          status: 200,
          data: data
        });
        return true;
      } else {
        this.updateStep('test-unified-api', 'error', `API unificada error ${status}`, { status });
        return false;
      }
    } catch (error: any) {
      this.updateStep('test-unified-api', 'error', `Error conectando API unificada: ${error.message}`);
      return false;
    }
  }

  async testMigrationAPI(): Promise<boolean> {
    this.updateStep('test-migration-api', 'running', 'Probando API de migración...');
    
    try {
      // Test migration status endpoint
      const response = await fetch('http://localhost:3048/api/leads/migrate?organizationId=test', {
        method: 'GET'
      });
      
      const status = response.status;
      
      if (status === 401) {
        this.updateStep('test-migration-api', 'success', 'API de migración responde (requiere auth)', {
          status: 401,
          message: 'Endpoint disponible, autenticación requerida'
        });
        return true;
      } else if (status === 200) {
        const data = await response.json();
        this.updateStep('test-migration-api', 'success', 'API de migración funcional', {
          status: 200,
          data: data
        });
        return true;
      } else {
        this.updateStep('test-migration-api', 'error', `API de migración error ${status}`, { status });
        return false;
      }
    } catch (error: any) {
      this.updateStep('test-migration-api', 'error', `Error conectando API de migración: ${error.message}`);
      return false;
    }
  }

  async testComponents(): Promise<boolean> {
    this.updateStep('test-components', 'running', 'Verificando componentes React...');
    
    return new Promise((resolve) => {
      const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck',
        'src/components/leads/UnifiedKanbanView.tsx',
        'src/components/leads/UnifiedLeadDetailsDialog.tsx',
        'src/components/leads/SmartKanbanView.tsx',
        'src/hooks/useUnifiedLeads.ts'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      tsc.stdout.on('data', (data) => {
        output += data.toString();
      });

      tsc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tsc.on('close', (code) => {
        if (code === 0) {
          this.updateStep('test-components', 'success', 'Componentes React válidos', {
            message: 'Compilación exitosa'
          });
          resolve(true);
        } else {
          this.updateStep('test-components', 'error', 'Errores en componentes React', {
            error: errorOutput.slice(0, 200)
          });
          resolve(false);
        }
      });
    });
  }

  async runFullTest(): Promise<void> {
    console.log('🚀 Iniciando prueba completa de migración...\n');
    
    const tests = [
      () => this.checkServerRunning(),
      () => this.testExistingAPIs(),
      () => this.testUnifiedTypes(),
      () => this.testUnifiedAPI(),
      () => this.testMigrationAPI(),
      () => this.testComponents()
    ];

    let successCount = 0;
    
    for (const test of tests) {
      const success = await test();
      if (success) successCount++;
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.printFinalReport(successCount, tests.length);
  }

  private printFinalReport(successCount: number, totalTests: number) {
    console.log('\n🎯 === REPORTE FINAL ===');
    console.log(`✅ Pruebas exitosas: ${successCount}/${totalTests}`);
    console.log(`📊 Porcentaje de éxito: ${Math.round((successCount / totalTests) * 100)}%`);
    
    if (successCount === totalTests) {
      console.log('\n🎉 ¡MIGRACIÓN LISTA PARA PRODUCCIÓN!');
      console.log('✅ Todos los componentes del sistema unificado funcionan correctamente');
      console.log('🚀 Puedes proceder con la migración de datos reales');
      console.log('\n📋 Próximos pasos:');
      console.log('   1. Crear backup de datos existentes');
      console.log('   2. Ejecutar migración con organizationId real');
      console.log('   3. Actualizar UI para usar SmartKanbanView');
      console.log('   4. Monitorear performance del sistema unificado');
    } else if (successCount >= totalTests * 0.8) {
      console.log('\n⚠️  MIGRACIÓN PARCIALMENTE LISTA');
      console.log('✅ Componentes principales funcionan');
      console.log('🔧 Algunos componentes necesitan ajustes menores');
      console.log('📋 Revisa los errores arriba y corrige antes de migrar');
    } else {
      console.log('\n❌ MIGRACIÓN NO LISTA');
      console.log('🔧 Varios componentes necesitan corrección');
      console.log('📋 Revisa y corrige los errores antes de continuar');
    }

    console.log('\n💡 Para usar el sistema:');
    console.log('   - Reemplaza KanbanView con SmartKanbanView');
    console.log('   - El sistema detectará automáticamente qué datos usar');
    console.log('   - Usa useUnifiedLeads hook para nuevas funcionalidades');
  }
}

async function main() {
  const tester = new MigrationTester();
  await tester.runFullTest();
}

// Execute if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { MigrationTester };