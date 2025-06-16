'use server';
/**
 * @fileOverview Flujo para generar un mensaje de bienvenida para un nuevo lead.
 *
 * - generateWelcomeMessage - Función que genera el mensaje de bienvenida.
 * - WelcomeMessageInput - Tipo de entrada para generateWelcomeMessage.
 * - WelcomeMessageOutput - Tipo de salida para generateWelcomeMessage.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WelcomeMessageInputSchema = z.object({
  leadName: z.string().describe('El nombre del negocio o contacto principal del lead.'),
  businessType: z.string().optional().describe('El tipo o categoría del negocio (ej: restaurante, software, etc.).'),
  companyName: z.string().optional().describe('El nombre de nuestra empresa.'),
  companyDescription: z.string().optional().describe('Breve descripción de nuestra empresa y servicios.'),
  senderName: z.string().optional().describe('El nombre de la persona que envía el mensaje.'),
});
export type WelcomeMessageInput = z.infer<typeof WelcomeMessageInputSchema>;

const WelcomeMessageOutputSchema = z.object({
  message: z.string().describe('El mensaje de bienvenida generado.'),
});
export type WelcomeMessageOutput = z.infer<typeof WelcomeMessageOutputSchema>;

export async function generateWelcomeMessage(input: WelcomeMessageInput): Promise<WelcomeMessageOutput> {
  return welcomeMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'welcomeMessagePrompt',
  input: {schema: WelcomeMessageInputSchema},
  output: {schema: WelcomeMessageOutputSchema},
  prompt: `Eres un asistente de ventas amigable y profesional. Tu tarea es redactar un mensaje de bienvenida personalizado para WhatsApp.

INFORMACIÓN DEL LEAD:
- Nombre: {{{leadName}}}
{{#if businessType}}
- Tipo de Negocio: {{{businessType}}}
{{/if}}

INFORMACIÓN DE NUESTRA EMPRESA:
{{#if companyName}}
- Nombre de la empresa: {{{companyName}}}
{{/if}}
{{#if companyDescription}}
- Descripción: {{{companyDescription}}}
{{/if}}
{{#if senderName}}
- Nombre del remitente: {{{senderName}}}
{{/if}}

INSTRUCCIONES ESPECÍFICAS:
1. Inicia el mensaje con "Hola {leadName}," de forma natural y humana
{{#if senderName}}
2. Presenta tu nombre: "soy {senderName}" o "me llamo {senderName}"
3. Menciona que te diriges desde {companyName} (si se proporciona)
{{else}}
2. Menciona que te diriges desde {companyName} (si se proporciona)
{{/if}}
3. Incluye una presentación breve de la empresa usando {companyDescription}
4. Haz referencia sutil al tipo de negocio del lead si es relevante
5. Invita de manera natural a conocer nuestro catálogo de productos y servicios
6. NO incluyas links o URLs, la plataforma los agregará automáticamente

ESTILO:
- Tono humano, cálido y profesional
- Como si fuera una persona real escribiendo
- Evita sonar como bot o muy comercial
- Máximo 3-4 oraciones
- Usa emojis con moderación (máximo 2)

Genera solo el mensaje completo de WhatsApp.`,
});

const welcomeMessageFlow = ai.defineFlow(
  {
    name: 'welcomeMessageFlow',
    inputSchema: WelcomeMessageInputSchema,
    outputSchema: WelcomeMessageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo generar el mensaje de bienvenida.');
    }
    return output;
  }
);
