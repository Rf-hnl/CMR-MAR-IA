
'use server';
/**
 * @fileOverview Flujo para generar recomendaciones de venta para un lead,
 * utilizando opcionalmente una lista de productos específica del usuario.
 *
 * - generateSalesRecommendations - Función que genera las recomendaciones.
 * - SalesRecommendationsInput - Tipo de entrada para generateSalesRecommendations.
 * - SalesRecommendationsOutput - Tipo de salida para generateSalesRecommendations.
 * - Product - Tipo para la estructura de un producto.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSchema = z.object({
  name: z.string().describe('El nombre del producto o servicio.'),
  category: z.string().describe('La categoría del producto (ej: software, hardware).'),
  price: z.string().describe('El precio del producto.'),
  original_price: z.string().optional().describe('El precio original, si aplica (ej: para descuentos).'),
  description: z.string().optional().describe('La descripción detallada del producto o servicio.'),
});
export type Product = z.infer<typeof ProductSchema>;

const SalesRecommendationsInputSchema = z.object({
  leadName: z.string().describe('El nombre del negocio.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  businessEvaluation: z.string().optional().describe('Una evaluación previa del negocio, si está disponible, que podría incluir puntos fuertes y áreas de oportunidad.'),
  userProducts: z.array(ProductSchema).optional().describe('Lista de productos/servicios que ofrece el usuario para la recomendación.'),
});
export type SalesRecommendationsInput = z.infer<typeof SalesRecommendationsInputSchema>;

const SalesRecommendationItemSchema = z.object({
  area: z.string().describe("El nombre exacto del producto/servicio recomendado de la lista proporcionada, o el área de necesidad si se usan categorías genéricas."),
  suggestion: z.string().describe("La recomendación específica o justificación de por qué sería beneficioso para el lead."),
});

const SalesRecommendationsOutputSchema = z.object({
  recommendations: z.array(SalesRecommendationItemSchema).describe('Una lista de hasta 3 recomendaciones de venta o áreas de colaboración.'),
});
export type SalesRecommendationsOutput = z.infer<typeof SalesRecommendationsOutputSchema>;

export async function generateSalesRecommendations(input: SalesRecommendationsInput): Promise<SalesRecommendationsOutput> {
  return salesRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'salesRecommendationsPrompt',
  input: {schema: SalesRecommendationsInputSchema},
  output: {schema: SalesRecommendationsOutputSchema},
  prompt: `Eres un consultor de ventas estratégico. Tu objetivo es ayudar a encontrar oportunidades de venta para el negocio "{{leadName}}".

Información del Lead:
- Nombre: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}
{{#if businessEvaluation}}
- Evaluación Previa del Negocio:
{{{businessEvaluation}}}
{{/if}}

{{#if userProducts.length}}
A continuación se presenta TU LISTA DE PRODUCTOS. Tu tarea principal es analizar la información del lead y seleccionar HASTA 3 productos de ESTA LISTA que sean los más adecuados para "{{leadName}}".

TU LISTA DE PRODUCTOS (USA ÚNICAMENTE ESTOS):
{{#each userProducts}}
- Nombre del Producto: "{{this.name}}"
  Categoría: {{this.category}}
  Precio (USD): {{this.price_usd}}
  {{#if this.original_price_usd}}Precio Original (USD): {{this.original_price_usd}}{{/if}}
  Descripción Detallada: {{this.description}}
{{/each}}

Instrucciones CRÍTICAS para la recomendación con tu lista de productos:
1.  ANALIZA CUIDADOSAMENTE la información del lead y las descripciones detalladas de cada producto en "TU LISTA DE PRODUCTOS".
2.  SELECCIONA HASTA 3 productos. Es vital que los productos recomendados provengan EXCLUSIVAMENTE de "TU LISTA DE PRODUCTOS". No inventes productos nuevos ni uses categorías genéricas si esta lista está presente.
3.  Para cada producto seleccionado, el campo "area" en la salida JSON debe ser el "Nombre del Producto" EXACTO tal como aparece en "TU LISTA DE PRODUCTOS".
4.  El campo "suggestion" debe ser una justificación CONVINCENTE y PERSONALIZADA (1-2 frases concisas) de por qué ESE producto específico de tu lista es una solución valiosa para "{{leadName}}". Debes basar esta justificación explícitamente en la "Descripción Detallada" del producto y cómo se alinea con las necesidades inferidas del lead.
5.  Si, después de un análisis cuidadoso, consideras que menos de 3 productos son adecuados, o incluso ninguno, puedes recomendar menos (o un array vacío si ninguno encaja). Sin embargo, intenta encontrar hasta 3 opciones pertinentes.
{{else}}
No se proporcionó una lista específica de productos. Considera los siguientes productos/servicios genéricos que podrías ofrecer:
- Desarrollo Web y Presencia Online (sitios web, e-commerce)
- Marketing Digital (SEO, SEM, redes sociales)
- Software de Gestión (CRM, ERP, herramientas de productividad)
- Consultoría Tecnológica y Transformación Digital
- Soluciones de Inteligencia Artificial (chatbots, análisis de datos)

Instrucciones para la recomendación (categorías genéricas):
1.  Identifica 2 o 3 áreas de necesidad o productos/servicios de la lista genérica anterior que serían MÁS relevantes y beneficiosos para "{{leadName}}".
2.  Para cada recomendación, la "area" será la categoría genérica (ej: "Marketing Digital").
3.  La "suggestion" debe ser una breve justificación (1-2 frases) de por qué sería valioso para ellos.
4.  Sé específico y práctico en tus sugerencias.
{{/if}}

Genera una lista de recomendaciones en formato JSON de acuerdo con el esquema de salida esperado, siguiendo estrictamente las instrucciones anteriores.`,
});

interface SalesRecommendationsFlowInput extends SalesRecommendationsInput {}
interface SalesRecommendationsFlowOutput extends SalesRecommendationsOutput {}

const salesRecommendationsFlow = ai.defineFlow(
  {
    name: 'salesRecommendationsFlow',
    inputSchema: SalesRecommendationsInputSchema,
    outputSchema: SalesRecommendationsOutputSchema,
  },
  async (input: SalesRecommendationsFlowInput): Promise<SalesRecommendationsFlowOutput> => {
    const {output} = await prompt(input);
    if (!output || !output.recommendations) {
      // Si la IA no devuelve nada o un formato incorrecto, asegurar un array vacío
      // para evitar errores en el frontend.
      console.warn('SalesRecommendationsFlow: AI did not return valid recommendations. Returning empty array.');
      return { recommendations: [] };
    }
    // Asegurar que no se devuelvan más de 3 recomendaciones
    if (output.recommendations.length > 3) {
      output.recommendations = output.recommendations.slice(0, 3);
    }
    return output;
  }
);

