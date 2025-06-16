# Modelo de Datos: Meta Lead Ads

## Descripción General

Este documento define la estructura de datos recomendada para la colección `meta-lead-ads` en Firebase, diseñada para integrar leads provenientes de Meta Ads (Facebook/Instagram) con el sistema de gestión de leads.

## Estructura del Modelo

### Interface TypeScript

```typescript
export interface MetaLeadAdsModel {
  // Identificadores únicos
  leadId: string;              // ID único del lead
  formId: string;              // ID del formulario de Meta
  
  // Información personal del lead
  fullName: string;            // Nombre completo
  email: string;               // Email del lead
  phoneNumber: string;         // Teléfono
  
  // Información comercial
  companyName?: string;        // Nombre de la empresa (opcional)
  businessType?: string;       // Tipo de negocio
  website?: string;           // Sitio web
  
  // Ubicación
  address?: string;           // Dirección completa
  city?: string;              // Ciudad
  state?: string;             // Estado/Provincia
  zipCode?: string;           // Código postal
  country?: string;           // País
  
  // Información de campaña Meta
  campaignId: string;         // ID de campaña
  campaignName: string;       // Nombre de campaña
  adSetId: string;            // ID del conjunto de anuncios
  adSetName: string;          // Nombre del conjunto de anuncios
  adName: string;             // Nombre del anuncio
  
  // Metadata de plataforma
  platformId: string;         // ID de plataforma Meta
  partnerName: string;        // Nombre del socio
  isOrganic: boolean;         // Si es orgánico o pagado
  
  // Datos específicos del formulario
  customDisclaimerResponses?: string;  // Respuestas personalizadas
  homeListing?: string;       // Información de listado
  vehicle?: string;           // Información de vehículo
  visitRequest?: 'yes' | 'no' | 'maybe'; // Solicitud de visita
  retailerItemId?: string;    // ID del artículo del retailer
  
  // Timestamps (usar Firestore Timestamp)
  dateCreated: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  
  // Información de gestión interna
  uid: string;                // ID del usuario propietario
  stage: LeadStage;          // Etapa del lead
  priority: 'high' | 'medium' | 'low';
  value?: number;            // Valor estimado del lead
  score?: number;            // Puntuación del lead
  
  // Metadatos adicionales
  source: 'meta_ads';        // Fuente fija
  status: 'active' | 'inactive' | 'converted' | 'lost';
  notes?: string;            // Notas adicionales
  tags?: string[];           // Etiquetas
  
  // Seguimiento
  lastContactDate?: FirebaseFirestore.Timestamp;
  nextFollowUpDate?: FirebaseFirestore.Timestamp;
  contactAttempts?: number;
}
```

### Enums y Tipos

```typescript
type LeadStage = 'Nuevo' | 'Contactado' | 'Calificado' | 'Propuesta Enviada' | 'Negociación' | 'Ganado' | 'Perdido';
type Priority = 'high' | 'medium' | 'low';
type VisitRequest = 'yes' | 'no' | 'maybe';
type LeadStatus = 'active' | 'inactive' | 'converted' | 'lost';
```

## Estructura en Firebase

### Ejemplo de Documento

```json
{
  "leadId": "meta_12345",
  "formId": "form_67890",
  "fullName": "Juan Pérez",
  "email": "juan@example.com",
  "phoneNumber": "+1234567890",
  "companyName": "Empresa XYZ",
  "businessType": "restaurant",
  "website": "https://example.com",
  "address": "Calle 123, Ciudad",
  "city": "Madrid",
  "state": "Madrid",
  "zipCode": "28001",
  "country": "España",
  "campaignId": "camp_123",
  "campaignName": "Campaña Restaurantes",
  "adSetId": "adset_456",
  "adSetName": "AdSet Principal",
  "adName": "Anuncio Promocional",
  "platformId": "meta_platform_789",
  "partnerName": "Partner ABC",
  "isOrganic": false,
  "customDisclaimerResponses": "Acepto términos y condiciones",
  "visitRequest": "yes",
  "dateCreated": "Timestamp(2024-01-15T10:30:00Z)",
  "updatedAt": "Timestamp(2024-01-15T10:30:00Z)",
  "uid": "user_abc123",
  "stage": "Nuevo",
  "priority": "medium",
  "value": 500,
  "score": 75,
  "source": "meta_ads",
  "status": "active",
  "tags": ["restaurante", "premium"],
  "notes": "Lead interesado en solución premium",
  "contactAttempts": 0
}
```

## Validación con Zod

```typescript
import { z } from 'zod';

const MetaLeadAdsSchema = z.object({
  // Identificadores
  leadId: z.string(),
  formId: z.string(),
  
  // Información personal
  fullName: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  phoneNumber: z.string().min(1, "Teléfono requerido"),
  
  // Información comercial (opcional)
  companyName: z.string().optional(),
  businessType: z.string().optional(),
  website: z.string().url().optional(),
  
  // Ubicación (opcional)
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  
  // Campaña Meta (requeridos)
  campaignId: z.string(),
  campaignName: z.string(),
  adSetId: z.string(),
  adSetName: z.string(),
  adName: z.string(),
  
  // Metadata plataforma
  platformId: z.string(),
  partnerName: z.string(),
  isOrganic: z.boolean(),
  
  // Datos específicos formulario (opcional)
  customDisclaimerResponses: z.string().optional(),
  homeListing: z.string().optional(),
  vehicle: z.string().optional(),
  visitRequest: z.enum(['yes', 'no', 'maybe']).optional(),
  retailerItemId: z.string().optional(),
  
  // Gestión interna
  uid: z.string(),
  stage: z.enum(['Nuevo', 'Contactado', 'Calificado', 'Propuesta Enviada', 'Negociación', 'Ganado', 'Perdido']),
  priority: z.enum(['high', 'medium', 'low']),
  value: z.number().min(0).optional(),
  score: z.number().min(0).max(100).optional(),
  
  // Metadatos
  source: z.literal('meta_ads'),
  status: z.enum(['active', 'inactive', 'converted', 'lost']),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Seguimiento
  contactAttempts: z.number().min(0).default(0)
});

export type MetaLeadAdsModel = z.infer<typeof MetaLeadAdsSchema>;
```

## Campos Requeridos vs Opcionales

### ✅ Campos Requeridos
- `leadId`: Identificador único
- `formId`: ID del formulario Meta
- `fullName`: Nombre del lead
- `email`: Email de contacto
- `phoneNumber`: Teléfono de contacto
- `campaignId`, `campaignName`: Información de campaña
- `adSetId`, `adSetName`: Información del conjunto
- `adName`: Nombre del anuncio
- `platformId`: ID de plataforma
- `partnerName`: Socio Meta
- `isOrganic`: Tipo de tráfico
- `uid`: Propietario del lead
- `stage`: Etapa actual
- `priority`: Prioridad
- `source`: Siempre 'meta_ads'
- `status`: Estado del lead

### ⚠️ Campos Opcionales
- Información comercial: `companyName`, `businessType`, `website`
- Ubicación: `address`, `city`, `state`, `zipCode`, `country`
- Formulario específico: `customDisclaimerResponses`, `homeListing`, `vehicle`, `visitRequest`, `retailerItemId`
- Gestión: `value`, `score`, `notes`, `tags`
- Seguimiento: `lastContactDate`, `nextFollowUpDate`, `contactAttempts`

## Integración con Make.com

### Webhook de Entrada
```json
{
  "lead_id": "{{ lead.id }}",
  "form_id": "{{ form.id }}",
  "full_name": "{{ lead.full_name }}",
  "email": "{{ lead.email }}",
  "phone_number": "{{ lead.phone_number }}",
  "campaign_id": "{{ campaign.id }}",
  "campaign_name": "{{ campaign.name }}",
  "ad_set_id": "{{ adset.id }}",
  "ad_set_name": "{{ adset.name }}",
  "ad_name": "{{ ad.name }}",
  "platform_id": "{{ platform.id }}",
  "created_time": "{{ lead.created_time }}"
}
```

### Transformación en Make
```javascript
// Transformar datos de Meta a nuestro modelo
const transformedLead = {
  leadId: `meta_${input.lead_id}`,
  formId: input.form_id,
  fullName: input.full_name,
  email: input.email,
  phoneNumber: input.phone_number,
  campaignId: input.campaign_id,
  campaignName: input.campaign_name,
  adSetId: input.ad_set_id,
  adSetName: input.ad_set_name,
  adName: input.ad_name,
  platformId: input.platform_id,
  partnerName: "Meta Business",
  isOrganic: false,
  dateCreated: new Date(input.created_time),
  updatedAt: new Date(),
  uid: "{{ organization.uid }}", // Del contexto
  stage: "Nuevo",
  priority: "medium",
  source: "meta_ads",
  status: "active",
  contactAttempts: 0
};
```

## Índices Recomendados en Firebase

```javascript
// Índices compuestos recomendados
{
  "collectionGroup": "meta-lead-ads",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "uid", "order": "ASCENDING" },
    { "fieldPath": "stage", "order": "ASCENDING" },
    { "fieldPath": "dateCreated", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "meta-lead-ads",
  "queryScope": "COLLECTION", 
  "fields": [
    { "fieldPath": "uid", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "priority", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "meta-lead-ads",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "campaignId", "order": "ASCENDING" },
    { "fieldPath": "dateCreated", "order": "DESCENDING" }
  ]
}
```

## Reglas de Seguridad Firebase

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /meta-lead-ads/{leadId} {
      // Solo el propietario puede leer/escribir
      allow read, write: if request.auth != null && 
                        request.auth.uid == resource.data.uid;
      
      // Validar estructura en escritura
      allow create: if request.auth != null &&
                   request.auth.uid == request.resource.data.uid &&
                   request.resource.data.source == 'meta_ads' &&
                   request.resource.data.keys().hasAll(['leadId', 'formId', 'fullName', 'email']);
    }
  }
}
```

## Migración de Datos Existentes

### Script de Migración
```typescript
// Migrar datos existentes al nuevo modelo
async function migrateMetaLeads() {
  const batch = writeBatch(db);
  const existingLeads = await getDocs(collection(db, 'meta-lead-ads'));
  
  existingLeads.forEach((doc) => {
    const oldData = doc.data();
    const newData: MetaLeadAdsModel = {
      // Mapear campos existentes
      leadId: oldData.leadId || `meta_${doc.id}`,
      formId: oldData.formId || 'unknown',
      fullName: oldData.fullName,
      email: oldData.email,
      phoneNumber: oldData.phoneNumber,
      // ... resto de campos con valores por defecto
      stage: 'Nuevo',
      priority: 'medium',
      source: 'meta_ads',
      status: 'active',
      contactAttempts: 0,
      dateCreated: oldData.dateCreated || Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    batch.update(doc.ref, newData);
  });
  
  await batch.commit();
}
```

## Consideraciones de Rendimiento

1. **Paginación**: Usar `limit()` y `startAfter()` para consultas grandes
2. **Índices**: Crear índices compuestos para consultas frecuentes
3. **Caché**: Implementar caché local para datos frecuentemente accedidos
4. **Batch Operations**: Usar transacciones para operaciones múltiples

## Ejemplo de Uso en Componentes

```typescript
// Hook para manejar Meta Leads
export function useMetaLeads(uid: string) {
  const [leads, setLeads] = useState<MetaLeadAdsModel[]>([]);
  
  useEffect(() => {
    const q = query(
      collection(db, 'meta-lead-ads'),
      where('uid', '==', uid),
      where('status', '==', 'active'),
      orderBy('dateCreated', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as MetaLeadAdsModel[];
      
      setLeads(leadsData);
    });
    
    return unsubscribe;
  }, [uid]);
  
  return leads;
}
```

---

## Changelog

- **v1.0** (2024-01-15): Modelo inicial con campos básicos de Meta Ads
- **v1.1** (2024-01-15): Agregados campos de gestión interna y seguimiento
- **v1.2** (2024-01-15): Definida validación Zod y estructura Firebase