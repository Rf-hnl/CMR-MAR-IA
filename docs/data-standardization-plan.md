# 📋 Plan de Estandarización de Datos - CRM Sistema de Leads

## 🎯 Objetivo
Estandarizar toda la arquitectura de datos de leads para eliminar inconsistencias, mejorar el mantenimiento y facilitar el desarrollo futuro.

## 📊 Análisis de Situación Actual

### 🔴 Problemas Identificados:

1. **Múltiples Colecciones Descoordinadas**
   - `meta-lead-ads` - Datos originales de Meta
   - `leads-flow` - Datos de flujo de ventas  
   - `leads` - Datos simplificados (legacy)
   
2. **Tipos de Datos Inconsistentes**
   - `MetaLeadAdsModel` - Modelo original
   - `ExtendedLead` - Modelo para UI
   - `LeadsFlowModel` - Modelo de flujo
   - `MappedMetaLead` - Modelo de mapeo

3. **Problemas de Mapeo**
   - Campos duplicados con nombres diferentes
   - Pérdida de información en conversiones
   - Lógica de mapeo esparcida en múltiples archivos

4. **Falta de Validación**
   - No hay esquemas de validación consistentes
   - Datos faltantes o nulos sin manejo estándar
   - Inconsistencias entre fuentes

## 🏗️ Arquitectura de Datos Propuesta

### 📚 Colección Principal Unificada: `leads-unified`

```typescript
interface UnifiedLead {
  // === IDENTIFIERS ===
  id: string                    // Document ID
  leadId: string               // External Lead ID (Meta, etc.)
  sourceId?: string            // Original source document ID
  
  // === CORE INFORMATION ===
  fullName: string
  email: string | null
  phone: string | null
  company: string | null
  
  // === CONTACT DETAILS ===
  address?: ContactAddress
  website?: string
  socialMedia?: SocialMediaLinks
  
  // === BUSINESS INFORMATION ===
  businessType?: BusinessType
  industry?: Industry
  interests?: LeadInterests
  
  // === LEAD MANAGEMENT ===
  stage: LeadStage
  source: LeadSource
  priority: Priority
  status: LeadStatus
  
  // === SALES PIPELINE ===
  estimatedValue?: number
  closeProbability?: number
  expectedCloseDate?: Date
  
  // === ENGAGEMENT ===
  leadScore?: number
  engagementScore?: number
  lastContactDate?: Date
  nextFollowUpDate?: Date
  
  // === ASSIGNMENT ===
  assignedTo?: string
  assignedDate?: Date
  
  // === SOURCE-SPECIFIC DATA ===
  sourceData: SourceSpecificData
  
  // === METADATA ===
  metadata: LeadMetadata
  
  // === TIMESTAMPS ===
  createdAt: Date
  updatedAt: Date
  sourceCreatedAt?: Date       // Original creation date from source
  
  // === ORGANIZATION ===
  uid: string
  organizationId: string
}
```

### 🏷️ Tipos de Datos Estandarizados

```typescript
// === CONTACT ADDRESS ===
interface ContactAddress {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  formatted?: string           // Dirección completa formateada
}

// === SOCIAL MEDIA ===
interface SocialMediaLinks {
  facebook?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  whatsapp?: string
}

// === BUSINESS TYPES ===
enum BusinessType {
  AUTOMOTIVE = 'automotive',
  REAL_ESTATE = 'real_estate',
  RESTAURANT = 'restaurant',
  HEALTH = 'health',
  RETAIL = 'retail',
  SERVICES = 'services',
  TECHNOLOGY = 'technology',
  GENERAL = 'general'
}

// === LEAD SOURCES ===
enum LeadSource {
  META_ADS = 'meta_ads',
  FACEBOOK_ADS = 'facebook_ads', 
  INSTAGRAM_ADS = 'instagram_ads',
  GOOGLE_ADS = 'google_ads',
  GOOGLE_PLACES = 'google_places',
  XML_IMPORT = 'xml_import',
  CSV_IMPORT = 'csv_import',
  MANUAL = 'manual',
  WEBSITE = 'website',
  REFERRAL = 'referral'
}

// === LEAD STAGES ===
enum LeadStage {
  NEW = 'Nuevo',
  CONTACTED = 'Contactado', 
  QUALIFIED = 'Calificado',
  PROPOSAL_SENT = 'Propuesta Enviada',
  NEGOTIATION = 'Negociación',
  WON = 'Ganado',
  LOST = 'Perdido',
  PROSPECT = 'Prospecto',
  INTERESTED = 'Interesado',
  PROPOSAL = 'Propuesta',
  SOLD = 'Vendido'
}

// === LEAD STATUS ===
enum LeadStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// === PRIORITY ===
enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// === LEAD INTERESTS ===
interface LeadInterests {
  vehicle?: VehicleInterest
  property?: PropertyInterest
  service?: ServiceInterest
  product?: ProductInterest
  visitRequested?: boolean
}

interface VehicleInterest {
  type?: string
  brand?: string
  model?: string
  year?: number
  priceRange?: PriceRange
}

interface PropertyInterest {
  type?: 'house' | 'apartment' | 'commercial' | 'land'
  location?: string
  priceRange?: PriceRange
  bedrooms?: number
  bathrooms?: number
}

// === SOURCE-SPECIFIC DATA ===
type SourceSpecificData = MetaAdsData | GooglePlacesData | ImportData | ManualData

interface MetaAdsData {
  type: 'meta_ads'
  campaignId: string
  campaignName: string
  adSetId: string
  adSetName: string
  adId?: string
  adName: string
  formId: string
  platformId: string
  partnerName?: string
  isOrganic: boolean
  customResponses?: string
  retailerItemId?: string
}

interface GooglePlacesData {
  type: 'google_places'
  placeId: string
  rating?: number
  reviewCount?: number
  categories?: string[]
  openingHours?: OpeningHours
}

interface ImportData {
  type: 'import'
  importType: 'csv' | 'xml'
  fileName: string
  importedAt: Date
  batchId?: string
  originalRow?: number
}

interface ManualData {
  type: 'manual'
  createdBy: string
  source?: string
  notes?: string
}

// === METADATA ===
interface LeadMetadata {
  version: string              // Schema version
  tags?: string[]
  customFields?: Record<string, any>
  automation?: AutomationSettings
  communication?: CommunicationHistory
  attachments?: Attachment[]
  images?: LeadImage[]
}
```

## 🔄 Plan de Migración

### Fase 1: Preparación (1-2 días)
1. **Crear nuevos tipos TypeScript**
   - Definir `UnifiedLead` interface
   - Crear enums estandarizados
   - Validadores con Zod

2. **Crear utilidades de migración**
   - Mappers desde cada fuente actual
   - Validators para datos
   - Scripts de migración

### Fase 2: APIs Unificadas (2-3 días)
1. **Crear nueva API `/api/leads/unified`**
   - GET: Obtener leads unificados
   - POST: Crear lead unificado
   - PUT: Actualizar lead unificado
   - DELETE: Eliminar lead

2. **Middleware de compatibilidad**
   - Mantener APIs existentes funcionando
   - Redirect gradualmente a nuevas APIs

### Fase 3: Migración de Datos (1 día)
1. **Script de migración masiva**
   - `meta-lead-ads` → `leads-unified`
   - `leads-flow` → `leads-unified`
   - `leads` → `leads-unified`

2. **Verificación de integridad**
   - Comparar datos antes/después
   - Validar que no se pierda información

### Fase 4: Actualización UI (2-3 días)
1. **Actualizar componentes**
   - KanbanView usar `UnifiedLead`
   - LeadDetailsDialog mostrar todos los campos
   - Formularios de creación/edición

2. **Mejorar experiencia**
   - Campos dinámicos según fuente
   - Validación en tiempo real
   - Mejor manejo de errores

### Fase 5: Cleanup (1 día)
1. **Deprecar colecciones antiguas**
   - Marcar como deprecated
   - Planes de eliminación futura

2. **Documentación**
   - Actualizar README
   - Documentar nuevas APIs
   - Guías de desarrollo

## 📝 Archivos a Crear/Modificar

### Nuevos Archivos:
```
src/types/unified-lead.ts           # Tipos unificados
src/lib/lead-validators.ts          # Validadores Zod
src/lib/lead-mappers.ts            # Mappers desde fuentes existentes
src/lib/lead-unifier.ts            # Lógica de unificación
src/app/api/leads/unified/route.ts  # API unificada
scripts/migrate-to-unified.ts      # Script de migración
```

### Archivos a Modificar:
```
src/components/leads/KanbanView.tsx
src/components/leads/LeadDetailsDialog.tsx
src/types/index.ts                 # Re-exports actualizados
src/lib/leads-utils.ts            # Utilidades actualizadas
```

## 🎯 Beneficios Esperados

### ✅ Consistencia
- Un solo tipo de dato para todos los leads
- Validación estándar en toda la aplicación
- Eliminación de conversiones confusas

### ✅ Mantenibilidad  
- Código más limpio y predecible
- Fácil agregar nuevas fuentes de datos
- Tests más sencillos

### ✅ Escalabilidad
- Preparado para futuras integraciones
- Soporte para campos personalizados
- Arquitectura extensible

### ✅ Performance
- Menos queries a múltiples colecciones
- Índices optimizados
- Caché más efectivo

## ⚠️ Consideraciones de Riesgo

### 🔴 Riesgos Altos
- **Pérdida de datos** durante migración
- **Downtime** durante transición
- **Bugs** en mapeo de datos complejos

### 🟡 Mitigaciones
- **Backup completo** antes de migración
- **Migración gradual** con rollback
- **Testing exhaustivo** con datos reales
- **Monitoreo** de APIs durante transición

## 📋 Checklist de Implementación

### Pre-implementación
- [ ] Backup de base de datos completo
- [ ] Análisis de datos existentes
- [ ] Definición de casos edge
- [ ] Plan de rollback detallado

### Implementación
- [ ] Crear tipos unificados
- [ ] Implementar validadores
- [ ] Crear mappers de migración
- [ ] Desarrollar API unificada
- [ ] Actualizar UI components
- [ ] Ejecutar migración de datos
- [ ] Verificar integridad de datos
- [ ] Testing exhaustivo
- [ ] Deployment gradual

### Post-implementación
- [ ] Monitorear performance
- [ ] Validar datos en producción
- [ ] Documentar cambios
- [ ] Training del equipo
- [ ] Plan de deprecación de APIs antiguas

---

**Tiempo estimado total: 7-10 días**
**Riesgo: Medio-Alto**
**Beneficio: Muy Alto**

Este plan asegura que el sistema sea escalable, mantenible y preparado para el futuro.