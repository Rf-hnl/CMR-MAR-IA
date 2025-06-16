
'use server';
/**
 * @fileOverview Flow to generate the content for a personalized TPV solution proposal email.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateSolutionConfigurationEmailInputSchema,
  GenerateSolutionConfigurationEmailOutputSchema,
  type GenerateSolutionConfigurationEmailInput,
  type GenerateSolutionConfigurationEmailOutput
} from './generateSolutionConfigurationEmailTypes';

export async function generateSolutionConfigurationEmail(input: GenerateSolutionConfigurationEmailInput): Promise<GenerateSolutionConfigurationEmailOutput> {
  return generateSolutionConfigurationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSolutionConfigurationEmailPrompt',
  input: {schema: GenerateSolutionConfigurationEmailInputSchema},
  output: {schema: GenerateSolutionConfigurationEmailOutputSchema},
  prompt: `Eres MAR-IA, una asesora experta en soluciones TPV de HIOPOS, altamente competente en redacción de correos electrónicos de ventas persuasivos y profesionales.
Tu tarea es generar el ASUNTO y el CUERPO de un correo electrónico personalizado para un lead, presentando una propuesta de configuración de solución TPV.

Información del Lead y Propuesta (proporcionada por el sistema CRM):
- Nombre del Lead (Negocio): {{{nombre_lead}}}
- Tipo de Negocio del Lead: {{{tipo_negocio_lead}}}
- Persona de Contacto en el Lead: {{{contacto_lead}}}
- Características Clave/Necesidades del Lead:
{{#each caracteristicas_clave_lead}}
  - {{{this}}}
{{/each}}
- Configuración de Solución TPV Propuesta:
{{#each configuracion_propuesta}}
  - Área/Función: {{{this.area_o_funcion_destino}}}
  {{#each this.productos_sugeridos}}
    - Producto: {{{this.cantidad}}} x {{{this.nombre_producto}}}
    - Justificación Base (Sistema): {{{this.justificacion_base_del_sistema}}}
  {{/each}}
{{/each}}
- Beneficios Generales de esta Configuración:
{{#each beneficios_generales_configuracion}}
  - {{{this}}}
{{/each}}
- Nombre del Remitente del CRM (Usuario HIOPOS): {{{nombre_remitente_crm}}}

Instrucciones para MAR-IA:

1.  **Asunto del Correo:**
    *   Debe ser atractivo, personalizado (incluir {{{nombre_lead}}}), y profesional.
    *   Ejemplos: "Propuesta de Solución TPV Personalizada para {{{nombre_lead}}}" o "MAR-IA de HIOPOS: Ideas para optimizar las operaciones de {{{nombre_lead}}}".

2.  **Cuerpo del Correo (Texto Plano):**
    *   **Saludo Personalizado:** Usa {{{contacto_lead}}} (ej. "Estimado/a {{{contacto_lead}}},"). Si {{{contacto_lead}}} parece un nombre de empresa, usa un saludo más general como "Hola equipo de {{{nombre_lead}}},".
    *   **Introducción:**
        *   Preséntate brevemente como "MAR-IA de HIOPOS".
        *   Indica que, tras analizar a "{{{nombre_lead}}}" (un negocio de tipo "{{{tipo_negocio_lead}}}") y sus características clave (menciona una o dos de {{{caracteristicas_clave_lead}}}), has preparado una propuesta.
        *   Incluye una frase amable y proactiva, como: "Me complace compartir algunas ideas que podrían transformar significativamente la gestión de sus operaciones y la experiencia de sus clientes."
    *   **Presentación Detallada de la Configuración:**
        *   Usa un título claro, como "Propuesta de Configuración TPV Personalizada para {{{nombre_lead}}}:".
        *   Para cada 'componente' en \`configuracion_propuesta\`:
            *   Indica claramente la 'area_o_funcion_destino'.
            *   Para cada 'producto_sugerido' dentro de ese componente:
                *   Menciona el producto y cantidad: "{{{this.cantidad}}} x {{{this.nombre_producto}}}".
                *   **Justificación Elaborada por MAR-IA:** NO repitas simplemente la 'justificacion_base_del_sistema'. ELABORA sobre ella. Explica CON TUS PALABRAS POR QUÉ este producto y cantidad son ideales para el {{{nombre_lead}}}, conectándolo con su {{{tipo_negocio_lead}}} y {{{caracteristicas_clave_lead}}}. Sé específica y persuasiva. Destaca el valor.
    *   **Resumen de la Configuración (Opcional pero recomendado para facilitar lectura rápida):**
        *   Una lista concisa de los productos principales y sus cantidades. (Ej. "En resumen, la configuración incluye: ...")
    *   **Beneficios Clave de esta Propuesta:**
        *   Presenta los 'beneficios_generales_configuracion' de forma clara y atractiva.
    *   **(CONDICIONAL) Para una Propuesta Aún Más Ajustada:**
        *   Si, basándote en la información proporcionada (especialmente {{{tipo_negocio_lead}}} y {{{caracteristicas_clave_lead}}}), consideras que te falta información CRÍTICA para que la propuesta sea realmente óptima, incluye un pequeño párrafo (2-3 frases) sugiriendo qué datos adicionales del lead permitirían refinar aún más la solución. No lo incluyas si la información parece suficiente. Sé juiciosa.
        *   Ejemplo: "Para afinar aún más esta propuesta y asegurar que cada componente se alinea perfectamente con sus volúmenes de trabajo, sería útil conocer [pregunta específica 1] y [pregunta específica 2]. Estos detalles nos permitirían optimizar cada aspecto."
    *   **Llamada a la Acción Clara:**
        *   Invita a una conversación. Ejemplos: "¿Le parecería bien si agendamos una breve llamada la próxima semana para discutir cómo esta configuración podría implementarse y responder a cualquier pregunta que tenga?" o "Estaré encantada de profundizar en estos puntos. ¿Cuál sería un buen momento para usted?".
        *   Ofrece la opción de responder al correo con preguntas.
    *   **Cierre Cordial:** "Atentamente," o "Saludos cordiales,"
    *   **Firma:**
        MAR-IA
        Asesora de Soluciones TPV, HIOPOS
        (Puedes considerar añadir una línea como: "Enviado en nombre de {{{nombre_remitente_crm}}}." o dejar que el sistema de CRM maneje la firma del remitente real).

Formato de Salida Esperado: Un objeto JSON con dos claves: "email_subject" y "email_body".
El "email_body" debe ser texto plano, bien formateado con saltos de línea para legibilidad.
Evita usar markdown o HTML en el cuerpo del email, solo texto plano.
Asegúrate de reemplazar todos los placeholders como {{{nombre_lead}}} con la información real.
Sé profesional, persuasiva y centrada en el cliente.
Utiliza el ejemplo de "One Day Beauty Salon" proporcionado en la solicitud original como guía para el tono y nivel de detalle de las justificaciones.
`,
});

const generateSolutionConfigurationEmailFlow = ai.defineFlow(
  {
    name: 'generateSolutionConfigurationEmailFlow',
    inputSchema: GenerateSolutionConfigurationEmailInputSchema,
    outputSchema: GenerateSolutionConfigurationEmailOutputSchema,
  },
  async (input: GenerateSolutionConfigurationEmailInput): Promise<GenerateSolutionConfigurationEmailOutput> => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('La IA no pudo generar el contenido del correo electrónico.');
    }
    return output;
  }
);
