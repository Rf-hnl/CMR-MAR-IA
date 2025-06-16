
'use server';
/**
 * @fileOverview Flujo para formatear leads desde un archivo XML usando IA,
 * incluyendo la sugerencia inteligente de una etapa para el lead.
 *
 * - formatXmlLeads - Función que realiza el formateo.
 * - FormatXmlLeadsInput - Tipo de entrada para formatXmlLeads.
 * - FormatXmlLeadsOutput - Tipo de salida para formatXmlLeads.
 * - FormattedLead - Tipo para un lead individual formateado.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FormatXmlLeadsInputSchema = z.object({
  xmlContent: z.string().describe('El contenido completo del archivo XML como una cadena de texto.'),
});
export type FormatXmlLeadsInput = z.infer<typeof FormatXmlLeadsInputSchema>;

const FormattedLeadSchema = z.object({
  name: z.string().describe('Nombre completo del lead.'),
  email: z.string().optional().describe('Correo electrónico del lead.'),
  phone: z.string().optional().describe('Número de teléfono del lead.'),
  company: z.string().optional().describe('Nombre de la empresa del lead.'),
  address: z.string().optional().describe('Dirección del lead.'),
  businessType: z.string().optional().describe('Tipo de negocio del lead.'),
  website: z.string().optional().describe('Sitio web del lead.'),
  notes: z.string().optional().describe('Notas adicionales sobre el lead.'),
  suggestedStage: z.string().optional().describe('La etapa sugerida para el lead (ej: Nuevo, Contactado, Calificado, etc.) basada en la información del XML. Si no se puede determinar, se puede omitir o establecer como "Nuevo".'),
});
export type FormattedLead = z.infer<typeof FormattedLeadSchema>;

const FormatXmlLeadsOutputSchema = z.object({
  leads: z.array(FormattedLeadSchema).describe('Una lista de leads formateados extraídos del XML.'),
});
export type FormatXmlLeadsOutput = z.infer<typeof FormatXmlLeadsOutputSchema>;

export async function formatXmlLeads(input: FormatXmlLeadsInput): Promise<FormatXmlLeadsOutput> {
  return formatXmlLeadsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formatXmlLeadsPrompt',
  input: {schema: FormatXmlLeadsInputSchema},
  output: {schema: FormatXmlLeadsOutputSchema},
  prompt: `Eres un asistente experto en extracción, formateo y clasificación de datos de leads desde archivos XML.
Tu tarea es analizar el siguiente contenido XML, extraer la información de cada lead y mapearla a una estructura JSON específica, incluyendo una sugerencia para su etapa en un pipeline de ventas.

Contenido XML:
\`\`\`xml
{{{xmlContent}}}
\`\`\`

Pipeline de Ventas (Etapas Posibles para 'suggestedStage'): "Nuevo", "Contactado", "Calificado", "Propuesta Enviada", "Negociación", "Ganado", "Perdido".

Instrucciones:
1.  El campo "name" (Nombre completo del lead) es obligatorio. Si no puedes extraer un nombre para un lead, omite ese lead por completo.
2.  Para cada uno de los siguientes campos (email, phone, company, address, businessType, website, notes): si el valor correspondiente en el archivo XML está vacío, ausente, o es interpretado como nulo, el valor de este campo en el objeto JSON del lead debe ser la cadena de texto literal "null". En caso contrario, usa el valor encontrado tal cual.
3.  Para el campo "suggestedStage": analiza la información disponible (especialmente en 'notes', o si existen campos como 'status', 'estado_actual', 'valor_oportunidad', 'ultima_interaccion', etc.) e intenta inferir la etapa más apropiada del pipeline de ventas.
    - Si un lead parece recién añadido o sin interacción, podría ser "Nuevo".
    - Si se menciona contacto reciente o interés inicial, podría ser "Contactado" o "Calificado".
    - Si se habla de propuestas o negociaciones, usa esas etapas.
    - Si se indica cierre exitoso, "Ganado". Si se indica cierre fallido, "Perdido".
    - Si no hay suficiente información para una sugerencia clara para "suggestedStage", puedes omitir este campo del objeto JSON del lead o asignarle "Nuevo" por defecto.

Formato de Salida Esperado:
Devuelve un objeto JSON que contenga una única clave "leads". El valor de "leads" debe ser un array de objetos, donde cada objeto representa un lead formateado.

Ejemplo de un objeto lead dentro del array "leads":
{
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "phone": "555-1234",
  "company": "Soluciones Ejemplo S.L.",
  "address": "Calle Falsa 123, Ciudad, País",
  "businessType": "Consultoría Tecnológica",
  "website": "http://www.solucionesejemplo.com",
  "notes": "Interesado en producto X. Contactar la próxima semana. Parece calificado.",
  "suggestedStage": "Calificado"
}
Si un campo como 'website' no estuviera presente para Juan Pérez, el ejemplo sería:
{
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "phone": "555-1234",
  "company": "Soluciones Ejemplo S.L.",
  "address": "Calle Falsa 123, Ciudad, País",
  "businessType": "Consultoría Tecnológica",
  "website": "null",
  "notes": "Interesado en producto X. Contactar la próxima semana. Parece calificado.",
  "suggestedStage": "Calificado"
}


Si el XML no contiene leads válidos (con nombre) o no puedes extraer información, devuelve un array "leads" vacío.
Extrae la información de manera precisa y estructurada.`,
});

const formatXmlLeadsFlow = ai.defineFlow(
  {
    name: 'formatXmlLeadsFlow',
    inputSchema: FormatXmlLeadsInputSchema,
    outputSchema: FormatXmlLeadsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.leads) {
      // Ensure an empty array is returned if AI gives nothing or malformed output
      return { leads: [] };
    }
    return output;
  }
);
