# 🛠️ **Módulo de Configuración de Prompts de IA**

## **📋 Resumen del Módulo**

El módulo de **Configuración de Prompts de IA** permite a los usuarios personalizar y gestionar manualmente todos los prompts utilizados en las funciones de inteligencia artificial del sistema. Proporciona una interfaz intuitiva para editar, probar y optimizar los prompts según las necesidades específicas de cada organización.

## **🎯 Características Principales**

### **✨ Funcionalidades Core**
- **Editor Visual de Prompts**: Editor con resaltado de sintaxis y validación en tiempo real
- **Vista Previa en Vivo**: Prueba prompts con datos reales antes de aplicarlos
- **Sistema de Variables**: Gestión visual de variables con validación automática
- **Configuración Global**: Ajustes de modelo de IA, temperatura, tokens, etc.
- **Versionado**: Historial de cambios y reversión a prompts por defecto
- **Persistencia**: Guardado automático en Firebase con sincronización

### **🎨 Experiencia de Usuario**
- **Interfaz Intuitiva**: Diseño limpio y profesional con navegación por tabs
- **Búsqueda y Filtrado**: Encuentra prompts rápidamente
- **Duplicación**: Crea variaciones de prompts existentes
- **Validación Visual**: Indicadores de estado y errores en tiempo real

## **📁 Estructura de Archivos**

```
src/
├── app/ai-prompts/
│   └── page.tsx                    # Página principal del módulo
├── components/ai-prompts/
│   ├── PromptEditor.tsx            # Editor principal de prompts
│   ├── PromptPreview.tsx           # Vista previa con testing
│   └── GlobalSettings.tsx         # Configuración global de IA
├── hooks/
│   └── usePromptConfig.ts          # Hook para gestión de estado
├── types/
│   └── ai-prompts.ts               # Tipos TypeScript
└── app/api/ai-prompts/
    └── route.ts                    # API REST para persistencia
```

## **🔧 Configuración Técnica**

### **Tipos de Datos Principales**

```typescript
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_actions' | 'lead_import' | 'other';
  variables: PromptVariable[];
  defaultPrompt: string;
  customPrompt?: string;
  isActive: boolean;
  version: number;
}

interface PromptVariable {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  description: string;
  required: boolean;
  example?: string;
}
```

### **Prompts Predeterminados**

El sistema incluye 4 plantillas predefinidas:

1. **Mensaje de Bienvenida**
   - Variables: `leadName`, `businessType`
   - Propósito: Primer contacto personalizado

2. **Evaluación de Negocio**
   - Variables: `leadName`, `businessType`, `address`, `website`
   - Propósito: Análisis de oportunidades tecnológicas

3. **Recomendaciones de Ventas**
   - Variables: `leadName`, `businessType`, `userProducts`
   - Propósito: Sugerencias de productos específicos

4. **Email de Configuración TPV**
   - Variables: `nombre_lead`, `tipo_negocio_lead`, `configuracion_propuesta`
   - Propósito: Propuestas técnicas personalizadas

## **🚀 Guía de Uso**

### **1. Acceso al Módulo**
- Navegar a `/ai-prompts`
- Autenticación requerida (Firebase Auth)
- Carga automática de configuración personal

### **2. Edición de Prompts**

#### **Pasos para Editar:**
1. **Seleccionar Prompt**: Click en tarjeta de prompt deseado
2. **Activar Edición**: Botón "Editar" en panel derecho
3. **Modificar Contenido**: Editor de texto con sintaxis Handlebars
4. **Validar**: Verificación automática de variables requeridas
5. **Guardar**: Persistencia inmediata en base de datos

#### **Sintaxis de Variables:**
- **Variable simple**: `{{{leadName}}}`
- **Condicional**: `{{#if businessType}}...{{/if}}`
- **Iteración**: `{{#each userProducts}}...{{/each}}`

### **3. Vista Previa y Testing**

#### **Proceso de Testing:**
1. **Completar Datos**: Formulario con variables del prompt
2. **Ver Prompt Procesado**: Preview del texto final
3. **Generar con IA**: Prueba real con modelo configurado
4. **Analizar Resultado**: Revisión de calidad y formato

### **4. Configuración Global**

#### **Parámetros Disponibles:**
- **Modelo**: Gemini 1.5 Flash/Pro, Gemini 1.0 Pro
- **Temperature**: 0.1 (conservador) a 1.2 (creativo)
- **Max Tokens**: 512-4096 tokens de respuesta
- **Top-P**: 0.1-1.0 para control de diversidad

## **🛡️ Sistema de Persistencia**

### **API Endpoints**

#### **GET /api/ai-prompts**
- **Propósito**: Cargar configuración del usuario
- **Autenticación**: Bearer token (Firebase)
- **Respuesta**: `PromptConfig` completa o 404 si no existe

#### **POST /api/ai-prompts**
- **Propósito**: Guardar configuración actualizada
- **Validación**: Estructura de datos y variables requeridas
- **Respuesta**: Confirmación de guardado exitoso

#### **DELETE /api/ai-prompts**
- **Propósito**: Eliminar configuración (reset completo)
- **Efecto**: Próxima carga usa plantillas por defecto

### **Base de Datos (Firestore)**

```
promptConfigs/
  {userId}/
    - userId: string
    - templates: PromptTemplate[]
    - globalSettings: GlobalSettings
    - createdAt: timestamp
    - updatedAt: timestamp
```

## **🎮 Hook de Gestión (usePromptConfig)**

### **Funcionalidades del Hook**

```typescript
const {
  promptConfig,        // Configuración actual
  loading,            // Estado de carga
  error,              // Errores de red/validación
  saveConfig,         // Guardar configuración
  loadConfig,         // Recargar desde servidor
  resetToDefaults,    // Restaurar defaults
  updateTemplate,     // Actualizar prompt específico
  addTemplate,        // Agregar nuevo prompt
  removeTemplate,     // Eliminar prompt
  getTemplateByName,  // Buscar por nombre
  isModified         // Indicador de cambios pendientes
} = usePromptConfig();
```

### **Gestión de Estado**
- **Optimistic Updates**: Cambios inmediatos en UI
- **Persistencia Automática**: Guardado en background
- **Sync Status**: Indicadores de sincronización
- **Error Recovery**: Manejo robusto de fallos de red

## **🔗 Integración con Flujos de IA**

### **Proceso de Integración**

Para que los prompts personalizados se apliquen a los flujos de IA existentes:

1. **Carga de Configuración**: Los flows consultarán la configuración del usuario
2. **Fallback a Default**: Si no hay personalización, usa prompts por defecto
3. **Inyección de Variables**: Las variables se procesan con datos reales
4. **Ejecución**: El prompt final se envía al modelo de IA

### **Modificaciones Requeridas en Flows**

```typescript
// Ejemplo de integración en welcomeMessageFlow.ts
const getUserPromptConfig = async (userId: string) => {
  // Consultar configuración personalizada
  // Retornar prompt personalizado o default
};

const prompt = ai.definePrompt({
  name: 'welcomeMessagePrompt',
  input: {schema: WelcomeMessageInputSchema},
  output: {schema: WelcomeMessageOutputSchema},
  prompt: await getUserPromptConfig(userId) || defaultPrompt
});
```

## **📈 Beneficios del Sistema**

### **Para Usuarios**
- **Control Total**: Personalización completa de mensajes de IA
- **Testing Seguro**: Pruebas antes de aplicar en producción
- **Optimización**: Mejora iterativa de resultados
- **Flexibilidad**: Adaptación a diferentes industrias/contextos

### **Para Desarrolladores**
- **Mantenibilidad**: Separación de lógica y contenido
- **Escalabilidad**: Fácil agregar nuevos tipos de prompts
- **Versionado**: Control de cambios y rollbacks
- **Monitoreo**: Tracking de uso y efectividad

## **🔒 Seguridad y Validación**

### **Validaciones Implementadas**

#### **Frontend**
- **Sintaxis de Variables**: Verificación de handlebars válidos
- **Variables Requeridas**: Validación de campos obligatorios
- **Formato de Datos**: Tipo correcto para cada variable
- **Longitud de Prompts**: Límites razonables de texto

#### **Backend**
- **Autenticación**: Firebase Auth en todos los endpoints
- **Autorización**: Solo el propietario puede modificar sus prompts
- **Sanitización**: Limpieza de datos de entrada
- **Rate Limiting**: Prevención de abuso (futuro)

### **Consideraciones de Seguridad**
- **No Injection**: Prevención de inyección de prompts maliciosos
- **Audit Trail**: Log de cambios para auditoría
- **Backup**: Respaldo automático de configuraciones
- **Rollback**: Capacidad de revertir cambios problemáticos

## **🎯 Roadmap Futuro**

### **Funcionalidades Planeadas**

#### **Corto Plazo**
- **Templates Compartidos**: Biblioteca de prompts comunitarios
- **A/B Testing**: Comparación de efectividad de prompts
- **Analytics**: Métricas de uso y rendimiento
- **Import/Export**: Intercambio de configuraciones

#### **Mediano Plazo**
- **Prompt Marketplace**: Tienda de prompts especializados
- **Auto-Optimization**: Sugerencias automáticas de mejoras
- **Multi-Language**: Soporte para múltiples idiomas
- **Team Collaboration**: Gestión de prompts en equipo

#### **Largo Plazo**
- **AI-Assisted Prompting**: IA que ayuda a crear mejores prompts
- **Dynamic Prompts**: Prompts que se adaptan según contexto
- **Performance Monitoring**: Análisis detallado de efectividad
- **Enterprise Features**: Gestión avanzada para organizaciones

## **📚 Documentación Técnica**

### **Comandos de Desarrollo**
```bash
# Ejecutar en desarrollo
npm run dev

# Validar tipos
npm run type-check

# Tests unitarios
npm run test

# Build para producción
npm run build
```

### **Variables de Entorno Requeridas**
```env
GOOGLE_API_KEY=your_gemini_api_key
FIREBASE_SERVICE_ACCOUNT_JSON=your_firebase_config
```

### **Dependencias Principales**
- **React 18+**: Framework principal
- **Next.js 14+**: Full-stack framework
- **Firebase**: Autenticación y base de datos
- **Tailwind CSS**: Styling
- **Shadcn/ui**: Componentes base
- **Genkit**: Framework de IA
- **TypeScript**: Type safety

---

**Última actualización**: Enero 2025  
**Versión**: v1.0  
**Autor**: Sistema de Configuración de IA para LEAds