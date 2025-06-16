'use server';
/**
 * @fileOverview Flujo para evaluar las características de un negocio.
 *
 * - evaluateBusinessFeatures - Función que realiza la evaluación.
 * - EvaluateBusinessInput - Tipo de entrada para evaluateBusinessFeatures.
 * - EvaluateBusinessOutput - Tipo de salida para evaluateBusinessFeatures.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateBusinessInputSchema = z.object({
  leadName: z.string().describe('El nombre del negocio.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio.'),
  address: z.string().optional().describe('La dirección del negocio.'),
  website: z.string().optional().describe('El sitio web del negocio.'),
  // Información de la empresa que hace la evaluación
  companyName: z.string().optional().describe('Nombre de nuestra empresa que hace la evaluación.'),
  companyServices: z.string().optional().describe('Lista detallada de productos y servicios que ofrecemos.'),
  companyDescription: z.string().optional().describe('Descripción de nuestra empresa y especialización.'),
});
export type EvaluateBusinessInput = z.infer<typeof EvaluateBusinessInputSchema>;

const EvaluateBusinessOutputSchema = z.object({
  evaluation: z.string().describe('Evaluación completa del negocio en formato markdown bien estructurado y legible.'),
});
export type EvaluateBusinessOutput = z.infer<typeof EvaluateBusinessOutputSchema>;

export async function evaluateBusinessFeatures(input: EvaluateBusinessInput): Promise<EvaluateBusinessOutput> {
  return evaluateBusinessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateBusinessPrompt',
  input: {schema: EvaluateBusinessInputSchema},
  output: {schema: EvaluateBusinessOutputSchema},
  prompt: `Eres un consultor empresarial experto que trabaja para {{{companyName}}} analizando oportunidades de negocio para clientes potenciales.

INFORMACIÓN DEL CLIENTE A EVALUAR:
- Nombre: {{{leadName}}}
{{#if businessType}}- Sector: {{{businessType}}}{{/if}}
{{#if address}}- Ubicación: {{{address}}}{{/if}}
{{#if website}}- Presencia Web: {{{website}}}{{/if}}

INFORMACIÓN DE NUESTRA EMPRESA ({{{companyName}}}):
{{#if companyDescription}}- Especialización: {{{companyDescription}}}{{/if}}
{{#if companyServices}}- Productos y Servicios que Ofrecemos:
{{{companyServices}}}{{/if}}

INSTRUCCIONES:
Genera una evaluación empresarial profesional que identifique específicamente cómo NUESTROS productos y servicios pueden beneficiar a este cliente. Analiza las necesidades del lead y conecta con nuestras soluciones disponibles.

Sigue EXACTAMENTE este formato markdown:

## 📊 Análisis Empresarial: {{{leadName}}}

### 🏢 Contexto del Sector
[Análisis breve de la industria y tendencias del mercado]

### ✅ Fortalezas Identificadas
- **Fortaleza 1:** [Descripción específica del punto fuerte]
- **Fortaleza 2:** [Descripción específica del punto fuerte]
{{#if businessType}}- **Fortaleza 3:** [Tercera fortaleza si aplica]{{/if}}

### 🚀 Oportunidades con Nuestros Servicios
- **[Servicio/Producto 1]:** [Cómo específicamente puede beneficiar a este cliente]
- **[Servicio/Producto 2]:** [Beneficio directo para su tipo de negocio]
- **[Servicio/Producto 3]:** [Solución a sus necesidades identificadas]

### 🎯 Recomendaciones de Implementación
1. **Fase 1 (Inmediato):** [Qué servicio nuestro implementar primero y por qué]
2. **Fase 2 (1-3 meses):** [Siguiente servicio/producto a implementar]
3. **Fase 3 (3-6 meses):** [Estrategia completa con nuestras soluciones]

### 💰 Valor Proyectado para el Cliente
[ROI estimado y beneficios cuantificables usando nuestros servicios]

### 📈 Próximos Pasos Recomendados
[Acciones específicas que el cliente debe tomar para aprovechar nuestros servicios]

IMPORTANTE:
- SIEMPRE menciona productos/servicios específicos de {{{companyName}}}
- Conecta las necesidades del cliente con nuestras soluciones exactas
- Sé específico sobre cómo nuestros servicios resolverán sus problemas
- Incluye estimaciones realistas de ROI y beneficios
- Usa un tono consultivo y profesional
- Enfócate en valor agregado y resultados medibles
- NO generes recomendaciones genéricas, todo debe ser específico a nuestros servicios`,
});

const evaluateBusinessFlow = ai.defineFlow(
  {
    name: 'evaluateBusinessFlow',
    inputSchema: EvaluateBusinessInputSchema,
    outputSchema: EvaluateBusinessOutputSchema,
  },
  async (input: EvaluateBusinessInput) => {
    try {
      console.log('evaluateBusinessFlow started with input:', input);
      
      const {output} = await prompt(input);
      
      console.log('evaluateBusinessFlow prompt result:', output);
      
      if (!output) {
        throw new Error('No se pudo generar la evaluación del negocio - respuesta vacía del modelo de IA.');
      }
      
      if (!output.evaluation || typeof output.evaluation !== 'string') {
        throw new Error('La respuesta del modelo de IA no contiene una evaluación válida.');
      }
      
      console.log('evaluateBusinessFlow completed successfully');
      return output;
    } catch (error) {
      console.error('Error in evaluateBusinessFlow:', error);
      console.error('Flow error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Re-throw with more context
      throw new Error(`Error en el flujo de evaluación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
);
