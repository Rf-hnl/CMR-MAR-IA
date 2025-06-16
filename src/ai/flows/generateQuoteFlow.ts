'use server';
/**
 * @fileOverview Flujo para generar cotizaciones inteligentes basadas en el catálogo de productos y servicios.
 *
 * - generateQuote - Función principal que genera la cotización usando IA.
 * - QuoteInput - Tipo de entrada para generateQuote.
 * - QuoteOutput - Tipo de salida para generateQuote.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Esquemas de entrada
const ProductSchema = z.object({
  nombre: z.string().describe('Nombre del producto o servicio'),
  categoria: z.enum(['producto', 'servicio']).describe('Categoría del item'),
  descripcion: z.string().optional().describe('Descripción del producto/servicio'),
});

const LeadInfoSchema = z.object({
  nombre: z.string().describe('Nombre del lead o empresa'),
  tipo_negocio: z.string().describe('Tipo de negocio del lead'),
  necesidades: z.array(z.string()).optional().describe('Necesidades específicas identificadas'),
  presupuesto_estimado: z.string().optional().describe('Rango de presupuesto si se conoce'),
  tamaño_empresa: z.enum(['pequeña', 'mediana', 'grande', 'enterprise']).optional().describe('Tamaño de la empresa'),
});

const QuoteInputSchema = z.object({
  lead_info: LeadInfoSchema.describe('Información del lead para quien se genera la cotización'),
  catalogo_disponible: z.object({
    productos: z.array(ProductSchema).describe('Lista de productos disponibles'),
    servicios: z.array(ProductSchema).describe('Lista de servicios disponibles'),
  }).describe('Catálogo completo de productos y servicios disponibles'),
  requerimientos_especiales: z.array(z.string()).optional().describe('Requerimientos específicos mencionados por el lead'),
  contexto_adicional: z.string().optional().describe('Información adicional sobre el lead o la oportunidad'),
});

export type QuoteInput = z.infer<typeof QuoteInputSchema>;

// Esquemas de salida
const QuoteItemSchema = z.object({
  nombre: z.string().describe('Nombre del producto/servicio'),
  categoria: z.enum(['producto', 'servicio']).describe('Categoría del item'),
  descripcion: z.string().describe('Descripción detallada del item'),
  cantidad: z.number().min(1).describe('Cantidad sugerida'),
  precio_unitario: z.number().min(0).describe('Precio unitario estimado'),
  precio_total: z.number().min(0).describe('Precio total (cantidad x precio unitario)'),
  justificacion: z.string().describe('Por qué este item es recomendado para este lead'),
  prioridad: z.enum(['alta', 'media', 'baja']).describe('Prioridad de este item para el lead'),
});

const QuotePackageSchema = z.object({
  nombre: z.string().describe('Nombre del paquete (ej: "Paquete Básico", "Solución Integral")'),
  descripcion: z.string().describe('Descripción del paquete'),
  items: z.array(QuoteItemSchema).describe('Items incluidos en este paquete'),
  precio_paquete: z.number().min(0).describe('Precio total del paquete'),
  descuento_aplicado: z.number().min(0).max(100).optional().describe('Porcentaje de descuento aplicado'),
  beneficios: z.array(z.string()).describe('Beneficios específicos de este paquete'),
});

const QuoteOutputSchema = z.object({
  titulo: z.string().describe('Título de la cotización'),
  resumen_ejecutivo: z.string().describe('Resumen ejecutivo de la propuesta'),
  
  // Análisis del lead
  analisis_necesidades: z.object({
    necesidades_identificadas: z.array(z.string()).describe('Necesidades del negocio identificadas'),
    oportunidades: z.array(z.string()).describe('Oportunidades de mejora detectadas'),
    desafios: z.array(z.string()).describe('Desafíos que enfrenta el negocio'),
  }).describe('Análisis detallado de las necesidades del lead'),
  
  // Paquetes de solución
  paquetes_sugeridos: z.array(QuotePackageSchema).describe('Diferentes paquetes de solución propuestos'),
  
  // Items individuales adicionales
  items_adicionales: z.array(QuoteItemSchema).optional().describe('Items que se pueden agregar opcionalmente'),
  
  // Información financiera
  resumen_financiero: z.object({
    precio_minimo: z.number().describe('Precio mínimo de la propuesta más básica'),
    precio_recomendado: z.number().describe('Precio del paquete recomendado'),
    precio_premium: z.number().describe('Precio de la solución más completa'),
    forma_pago_sugerida: z.string().describe('Forma de pago recomendada'),
    condiciones_especiales: z.array(z.string()).optional().describe('Condiciones especiales ofrecidas'),
  }).describe('Resumen financiero de la propuesta'),
  
  // Propuesta de valor
  propuesta_valor: z.object({
    beneficios_principales: z.array(z.string()).describe('Principales beneficios para este lead específico'),
    roi_estimado: z.string().describe('Retorno de inversión estimado'),
    timeline_implementacion: z.string().describe('Tiempo estimado de implementación'),
  }).describe('Propuesta de valor personalizada'),
  
  // Próximos pasos
  proximos_pasos: z.array(z.string()).describe('Acciones recomendadas para seguir el proceso'),
  
  // Validez y términos
  validez_cotizacion: z.string().describe('Tiempo de validez de la cotización'),
  terminos_condiciones: z.array(z.string()).describe('Términos y condiciones importantes'),
});

export type QuoteOutput = z.infer<typeof QuoteOutputSchema>;

export async function generateQuote(input: QuoteInput): Promise<QuoteOutput> {
  return quoteGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'quoteGenerationPrompt',
  input: {schema: QuoteInputSchema},
  output: {schema: QuoteOutputSchema},
  prompt: `Eres un experto consultor en ventas y generación de cotizaciones. Tu misión es crear una cotización profesional, detallada y persuasiva basada en el catálogo de productos y servicios disponibles.

INFORMACIÓN DEL LEAD:
Nombre: {{{lead_info.nombre}}}
Tipo de Negocio: {{{lead_info.tipo_negocio}}}
{{#if lead_info.necesidades}}
Necesidades Identificadas: {{#each lead_info.necesidades}}
- {{{this}}}
{{/each}}
{{/if}}
{{#if lead_info.presupuesto_estimado}}
Presupuesto Estimado: {{{lead_info.presupuesto_estimado}}}
{{/if}}
{{#if lead_info.tamaño_empresa}}
Tamaño de Empresa: {{{lead_info.tamaño_empresa}}}
{{/if}}

CATÁLOGO DISPONIBLE:

PRODUCTOS:
{{#each catalogo_disponible.productos}}
- {{{nombre}}} {{#if descripcion}}({{{descripcion}}}){{/if}}
{{/each}}

SERVICIOS:
{{#each catalogo_disponible.servicios}}
- {{{nombre}}} {{#if descripcion}}({{{descripcion}}}){{/if}}
{{/each}}

{{#if requerimientos_especiales}}
REQUERIMIENTOS ESPECIALES:
{{#each requerimientos_especiales}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if contexto_adicional}}
CONTEXTO ADICIONAL:
{{{contexto_adicional}}}
{{/if}}

INSTRUCCIONES PARA LA COTIZACIÓN:

1. **ANÁLISIS PROFUNDO**: Analiza las necesidades del lead considerando su tipo de negocio y tamaño.

2. **SELECCIÓN INTELIGENTE**: Del catálogo disponible, selecciona SOLO los productos y servicios que realmente agreguen valor al lead.

3. **PAQUETES ESTRATÉGICOS**: Crea 2-3 paquetes de diferentes niveles:
   - Básico: Solución mínima viable
   - Recomendado: Solución ideal costo-beneficio  
   - Premium: Solución completa y avanzada

4. **PRECIOS REALISTAS**: Asigna precios competitivos y realistas basados en:
   - Complejidad del producto/servicio
   - Valor agregado para el tipo de negocio
   - Tamaño de la empresa del lead

5. **JUSTIFICACIÓN SÓLIDA**: Para cada item, explica POR QUÉ es importante para este lead específico.

6. **PROPUESTA DE VALOR CLARA**: Enfócate en beneficios tangibles y ROI específico para su industria.

7. **PROFESIONALISMO**: La cotización debe ser formal pero accesible, técnica pero comprensible.

CONSIDERACIONES ESPECIALES:
- Si es una pequeña empresa, prioriza soluciones costo-efectivas
- Si es enterprise, incluye funcionalidades avanzadas y soporte premium
- Adapta el lenguaje al tipo de industria del lead
- Incluye términos de pago flexibles según el tamaño de empresa
- Sugiere implementación por fases si es apropiado

FORMATO DE SALIDA:
Genera una cotización completa y profesional que el lead pueda entender fácilmente y que lo motive a avanzar en el proceso de compra.`,
});

const quoteGenerationFlow = ai.defineFlow(
  {
    name: 'quoteGenerationFlow',
    inputSchema: QuoteInputSchema,
    outputSchema: QuoteOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar la cotización.');
    }
    return output;
  }
);