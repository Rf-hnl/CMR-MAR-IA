# 🧮 Generador de Cotizaciones Inteligentes con IA

## 📋 Resumen

El **Generador de Cotizaciones** es un módulo GPT completo que utiliza el catálogo de productos y servicios junto con el entrenamiento del asistente de IA para crear cotizaciones profesionales, personalizadas e inteligentes.

## 🎯 Características Principales

### ✨ **Generación Inteligente con IA**
- **Análisis profundo** del lead y sus necesidades específicas
- **Selección automática** de productos y servicios del catálogo
- **Cálculo inteligente** de precios basado en el tipo y tamaño de negocio
- **Paquetes estratégicos** (Básico, Recomendado, Premium)

### 🛍️ **Integración Total con Catálogo**
- **Productos dinámicos** obtenidos del catálogo organizacional
- **Servicios personalizados** según el tipo de negocio
- **Justificación detallada** de cada item recomendado
- **Categorización automática** (producto/servicio)

### 📊 **Cotización Profesional Completa**
- **Análisis de necesidades** identificadas
- **Propuesta de valor personalizada** con ROI estimado
- **Múltiples paquetes** con diferentes niveles de inversión
- **Términos y condiciones** incluidos

### 📱 **Envío Automático por WhatsApp**
- **Integración con Evolution API**
- **Mensajes optimizados** para móvil
- **Formato profesional** con emojis y estructura clara

## 🚀 Flujo de Funcionamiento

### 1. **Activación del Generador**
```
Usuario → Selecciona lead → "Generar Cotización" → Modal se abre
```

### 2. **Formulario de Entrada**
- ✅ **Información del lead** (auto-completada)
- ✅ **Presupuesto estimado** (opcional)
- ✅ **Tamaño de empresa** (pequeña/mediana/grande/enterprise)
- ✅ **Necesidades identificadas** (separadas por comas)
- ✅ **Requerimientos especiales** (integraciones, soporte, etc.)
- ✅ **Contexto adicional** (información relevante)

### 3. **Procesamiento con IA**
```
🤖 IA Analizando...
├── 📊 Analizando catálogo de productos y servicios
├── 🎯 Evaluando necesidades del lead
├── 💰 Calculando precios y paquetes
└── ✨ Creando propuesta de valor
```

### 4. **Cotización Generada**
- **Header profesional** con información del lead
- **Análisis de necesidades** (necesidades, oportunidades, desafíos)
- **Paquetes de solución** con selector interactivo
- **Resumen financiero** (precios mínimo, recomendado, premium)
- **Propuesta de valor** (ROI, timeline, beneficios)
- **Próximos pasos** claros y accionables

## 🎨 Interfaz de Usuario

### **Vista de Formulario**
```
┌─────────────────────────────────────┐
│ 🧮 Generador de Cotizaciones con IA │
├─────────────────────────────────────┤
│ Información del Lead:               │
│ ├─ Nombre: [Auto]                   │
│ ├─ Tipo de Negocio: [Auto]          │
│ ├─ Presupuesto: [$5,000 - $10,000]  │
│ └─ Tamaño: [Pequeña ▼]              │
│                                     │
│ Necesidades: [Control de inventario,│
│ Reportes de ventas, Automatización] │
│                                     │
│ [✨ Generar Cotización con IA]       │
└─────────────────────────────────────┘
```

### **Vista de Cotización**
```
┌─────────────────────────────────────┐
│ 📄 COTIZACIÓN PERSONALIZADA         │
│ Sistema TPV Integral - Restaurante  │
│ 🎯 Generado con IA                  │
├─────────────────────────────────────┤
│ 🎯 Análisis  │ 📦 Paquetes          │
│ ├─ Necesidades│ [Básico][Recom][Prem]│
│ ├─ Oportun.   │ ┌─────────────────── │
│ └─ Desafíos   │ │ 💼 Paquete Recom.  │
│               │ │ $12,500            │
│               │ │ ✅ TPV Principal   │
│               │ │ ✅ Inventario      │
│               │ │ ✅ Soporte 24/7    │
│               │ └─────────────────── │
├─────────────────────────────────────┤
│ 💰 Financiero │ 🚀 Propuesta Valor  │
│ $8K│$12.5K│$18K│ ROI: 300% en 6 meses│
├─────────────────────────────────────┤
│ [📋 Copiar] [📱 WhatsApp] [✨ Nueva]│
└─────────────────────────────────────┘
```

## 🔧 Arquitectura Técnica

### **Backend - Flow de IA**
```typescript
// src/ai/flows/generateQuoteFlow.ts
export async function generateQuote(input: QuoteInput): Promise<QuoteOutput>
```

**Entrada (QuoteInput):**
- `lead_info`: Datos del lead (nombre, tipo_negocio, necesidades, etc.)
- `catalogo_disponible`: Productos y servicios disponibles
- `requerimientos_especiales`: Requisitos específicos
- `contexto_adicional`: Información extra

**Salida (QuoteOutput):**
- `titulo`: Título de la cotización
- `analisis_necesidades`: Análisis detallado del lead
- `paquetes_sugeridos`: 2-3 paquetes con diferentes niveles
- `resumen_financiero`: Precios y formas de pago
- `propuesta_valor`: Beneficios y ROI
- `proximos_pasos`: Acciones recomendadas

### **API Routes**
```typescript
// src/app/api/ai/generate-quote/route.ts
POST /api/ai/generate-quote
```

**Request Body:**
```json
{
  "leadName": "Restaurante La Pasta",
  "businessType": "restaurante",
  "organizationId": "org123",
  "leadInfo": {
    "necesidades": ["control inventario", "reportes ventas"],
    "presupuesto_estimado": "$10,000 - $15,000",
    "tamaño_empresa": "pequeña"
  },
  "requerimientos_especiales": ["integración existente"],
  "contexto_adicional": "Restaurante familiar con 3 años"
}
```

### **Frontend - Modal Interactivo**
```typescript
// src/components/QuoteGeneratorModal.tsx
<QuoteGeneratorModal 
  open={isOpen}
  currentLead={lead}
  onOpenChange={setIsOpen}
/>
```

## 📱 Integración WhatsApp

### **Mensaje Optimizado**
```
🎯 *COTIZACIÓN PERSONALIZADA*

Hola Restaurante La Pasta! 👋

He preparado una cotización especial para tu restaurante:

💼 *Paquete Recomendado*
Sistema TPV integral con gestión de inventario

💰 *Inversión: $12,500*
🎉 *Con 15% de descuento especial*

✅ *Incluye:*
• Sistema TPV Principal
• Control de Inventario
• Reportes de Ventas

🚀 *ROI Estimado:* 300% en 6 meses
⏱️ *Implementación:* 2-3 semanas

¿Te interesa conocer más detalles? ¡Hablemos! 📞
```

## 🎛️ Configuración y Personalización

### **Variables de Entorno**
```bash
# Evolution API (para WhatsApp)
EVOLUTION_API_BASE_URL=http://localhost:8081
EVOLUTION_API_KEY=evolution_api_key_2024
EVOLUTION_API_INSTANCE=h

# OpenAI (para generación de IA)
OPENAI_API_KEY=sk-...
```

### **Personalización del Prompt**
El prompt de IA está diseñado para:
- ✅ **Adaptar precios** según tamaño de empresa
- ✅ **Seleccionar productos relevantes** del catálogo
- ✅ **Crear justificaciones específicas** por industria
- ✅ **Generar múltiples opciones** de paquetes
- ✅ **Calcular ROI realista** por tipo de negocio

## 🚀 Casos de Uso

### **Caso 1: Restaurante**
```
Lead: "Restaurante familiar, necesita control de inventario"
IA Genera:
├─ Paquete Básico: TPV + Inventario ($8,000)
├─ Paquete Recomendado: + Reportes + Soporte ($12,500)
└─ Paquete Premium: + Análisis + Integración ($18,000)
```

### **Caso 2: Retail**
```
Lead: "Tienda de ropa, quiere modernizar punto de venta"
IA Genera:
├─ Análisis: "Necesidad de multicanal e inventario en tiempo real"
├─ Productos: TPV, E-commerce, CRM
└─ ROI: "250% en 8 meses por optimización de ventas"
```

### **Caso 3: Servicios Profesionales**
```
Lead: "Bufete de abogados, gestión de clientes"
IA Genera:
├─ Enfoque: CRM + Facturación + Documentos
├─ Justificación: "Optimización tiempo facturable"
└─ Timeline: "Implementación por fases, 4 semanas"
```

## 📊 Métricas y Seguimiento

### **Analytics Incluidas**
- ✅ **Cotizaciones generadas** por periodo
- ✅ **Tipos de negocio** más cotizados
- ✅ **Paquetes más seleccionados**
- ✅ **Rangos de precios** preferidos
- ✅ **Tasa de envío** por WhatsApp

### **Metadata Capturada**
```json
{
  "generated_at": "2024-01-15T10:30:00Z",
  "lead_name": "Restaurante La Pasta",
  "business_type": "restaurante",
  "organization_id": "org123",
  "catalog_items_used": 12
}
```

## 🔮 Próximas Mejoras

1. **📊 Templates por Industria**: Plantillas específicas por tipo de negocio
2. **💾 Historial de Cotizaciones**: Guardar y gestionar cotizaciones enviadas
3. **📈 Seguimiento de Conversión**: Tracking desde cotización hasta venta
4. **🔄 Cotizaciones Recurrentes**: Templates para clientes recurrentes
5. **📋 Exportación PDF**: Generar PDFs profesionales
6. **📧 Envío por Email**: Integración con sistemas de email
7. **🔗 Links de Aceptación**: Enlaces para aprobación directa
8. **💳 Integración de Pagos**: Procesamiento directo de pagos

---

¡El Generador de Cotizaciones está listo para revolucionar tu proceso de ventas! 🚀