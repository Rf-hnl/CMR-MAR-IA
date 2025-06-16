'use server';
/**
 * @fileOverview Flujo para formatear leads desde un archivo CSV usando IA,
 * incluyendo la sugerencia inteligente de una etapa para el lead.
 *
 * - formatCsvLeads - Función que realiza el formateo.
 * - FormatCsvLeadsInput - Tipo de entrada para formatCsvLeads.
 * - FormatCsvLeadsOutput - Tipo de salida para formatCsvLeads.
 * - FormattedLead - Tipo para un lead individual formateado (reutilizado).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { FormattedLead as BaseFormattedLead } from './formatXmlLeadsFlow'; // Reutilizar el tipo FormattedLead base

// Asegúrate de que los campos coincidan con los requeridos para CSV y maneja la lógica de contingencia.
export type FormattedLead = BaseFormattedLead;

const FormatCsvLeadsInputSchema = z.object({
  csvContent: z.string().describe('El contenido completo del archivo CSV como una cadena de texto.'),
});
export type FormatCsvLeadsInput = z.infer<typeof FormatCsvLeadsInputSchema>;

const FormatCsvLeadsOutputSchema = z.object({
  leads: z.array(
    z.object({
      name: z.string().describe('Nombre completo del lead.').refine((val) => val !== '', {
        message: 'El nombre del lead es obligatorio. Por favor, ingresa esta información para continuar.',
      }),
      email: z.string().optional().describe('Correo electrónico del lead. Si no está disponible, debe ser la cadena "null".').refine((val) => val === undefined || val === 'null' || val !== '', {
        message: 'El correo electrónico del lead es opcional, pero si no está disponible debe ser la cadena "null".',
      }),
      phone: z.string().optional().describe('Número de teléfono del lead. Si no está disponible, debe ser la cadena "null".').refine((val) => val === undefined || val === 'null' || val !== '', {
        message: 'El número de teléfono del lead es opcional, pero si no está disponible debe ser la cadena "null".',
      }),
      company: z.string().optional().describe('Nombre de la empresa del lead. Si no está disponible, debe ser la cadena "null".').refine((val) => val === undefined || val === 'null' || val !== '', {
        message: 'El nombre de la empresa del lead es opcional, pero si no está disponible debe ser la cadena "null".',
      }),
      address: z.string().optional().describe('Dirección del lead. Si no está disponible, debe ser la cadena "null".').refine((val) => val === undefined || val === 'null' || val !== '', {
        message: 'La dirección del lead es opcional, pero si no está disponible debe ser la cadena "null".',
      }),
      businessType: z.string().optional().describe('Tipo de negocio del lead. Si no está disponible, debe ser la cadena "null".').refine((val) => val === undefined || val === 'null' || val !== '', {
        message: 'El tipo de negocio del lead es opcional, pero si no está disponible debe ser la cadena "null".',
      }),
      website: z.string().optional().describe('Sitio web del lead. Si no está disponible, debe ser la cadena "null".').refine((val) => val === undefined || val === 'null' || val !== '', {
        message: 'El sitio web del lead es opcional, pero si no está disponible debe ser la cadena "null".',
      }),
      notes: z.string().optional().describe('Notas adicionales sobre el lead. Si no está disponible, debe ser la cadena "null".').refine((val) => val === undefined || val === 'null' || val !== '', {
        message: 'Las notas sobre el lead son opcionales, pero si no están disponibles debe ser la cadena "null".',
      }),
      suggestedStage: z.string().optional().describe('La etapa sugerida para el lead (ej: Nuevo, Contactado, Calificado, etc.) basada en la información del CSV. Si no se puede determinar, se puede omitir o establecer como "Nuevo".').refine((val) => val === undefined || val === 'null' || val !== '', {
        message: 'La etapa sugerida para el lead es opcional, pero si no está disponible debe ser la cadena "null" o "Nuevo".',
      }),
    })
  ).describe('Una lista de leads formateados extraídos del CSV.'),
});
export type FormatCsvLeadsOutput = z.infer<typeof FormatCsvLeadsOutputSchema>;

export async function formatCsvLeads(input: FormatCsvLeadsInput): Promise<FormatCsvLeadsOutput> {
  return await ai.run(prompt, input);
}

const prompt = ai.definePrompt({
  name: 'formatCsvLeadsPrompt',
  input: {schema: FormatCsvLeadsInputSchema},
  output: {schema: FormatCsvLeadsOutputSchema},
  prompt: `Eres un asistente experto en extracción, formateo y clasificación de datos de leads desde archivos CSV, especialmente aquellos provenientes de plataformas de publicidad como Facebook o Instagram.
Tu tarea es analizar el siguiente contenido CSV, extraer la información de cada lead, mapeándola a una estructura JSON específica, incluyendo una sugerencia para su etapa en un pipeline de ventas.

Contenido CSV:
\`\`\`csv
{{{csvContent}}}
\`\`\`

Pipeline de Ventas (Etapas Posibles para 'suggestedStage'): "Nuevo", "Contactado", "Calificado", "Propuesta Enviada", "Negociación", "Ganado", "Perdido".

Instrucciones para procesar el CSV:
1.  Analiza el contenido para identificar si la primera fila parece ser una cabecera (header row) con nombres de columnas.
2.  Si encuentras una cabecera, úsala para entender el significado de cada columna. Presta atención a nombres de columna comunes como "full name", "email", "número_de_teléfono", "nombre_de_la_empresa", "lead_status".
3.  Si no hay una cabecera clara, intenta inferir el tipo de dato en cada columna (ej. si una columna tiene muchos emails, es probable que sea la columna de email).
4.  Los delimitadores comunes en CSV son comas (,), punto y coma (;), o tabuladores (\t). Intenta detectar el delimitador correcto, aunque la coma es el más común.
5.  El campo "name" (Nombre completo del lead) es obligatorio. Busca columnas como "full name", "nombre completo", "nombre y apellido". Si no puedes extraer un nombre para un lead, omite ese lead por completo.
6.  Para cada uno de los siguientes campos (email, phone, company, address, businessType, website, notes): si el valor correspondiente en el archivo CSV está vacío, ausente, o es interpretado como nulo, el valor de este campo en el objeto JSON del lead debe ser la cadena de texto literal "null" (no null real, sino el string "null"). En caso contrario, usa el valor encontrado tal cual.
    - Para 'phone': Si el número tiene prefijos como "p:" o cualquier otro texto no numérico al inicio, extráelo sin ese prefijo, conservando el signo + si es parte del código de país. Ej: "p:+50760434060" debe ser "+50760434060". Si después de esto el valor es vacío, usa "null".
    - Para 'notes': Considera incluir aquí información de columnas como 'campaign_name', 'ad_name', 'adset_name', 'form_name', 'platform', 'created_time', 'id' (del lead en la plataforma de origen) si están presentes y no se mapean a otros campos directos. Puedes formatearlo como "Campaña: [campaign_name], Anuncio: [ad_name], Plataforma: [platform], Creado: [created_time], ID Origen: [id_origen]". Si todos estos campos están vacíos o ausentes, establece 'notes' a "null".

7.  Para cada lead, analiza la información disponible, **especialmente de columnas llamadas 'lead_status', 'status', 'estado_actual'** (o similares), para inferir la etapa más apropiada del pipeline de ventas. Asigna esta etapa al campo "suggestedStage".
    - Si una columna de estado indica "complete", "completed", "enviado", "nuevo" o similar (refiriéndose a la finalización de un formulario de lead o un estado inicial), esto generalmente significa que el lead es "Nuevo".
    - Si el estado indica "contacted", "contactado", "en seguimiento", podría ser "Contactado".
    - Si el estado indica "qualified", "calificado", "interesado", podría ser "Calificado".
    - Si se habla de propuestas o negociaciones en el estado o notas, usa esas etapas.
    - Si se indica cierre exitoso ("won", "ganado"), "Ganado". Si se indica cierre fallido ("lost", "perdido"), "Perdido".
    - Si no hay suficiente información para una sugerencia clara para "suggestedStage" desde una columna de estado o si esta no existe, puedes omitir "suggestedStage" del objeto JSON del lead o asignarle "Nuevo" por defecto.
    - También puedes considerar la información en el campo 'notes' (que podría incluir el \`created_time\`) para refinar esta sugerencia.

Formato de Salida Esperado:
Devuelve un objeto JSON que contenga una única clave "leads". El valor de "leads" debe ser un array de objetos, donde cada objeto representa un lead formateado.

Ejemplo de un objeto lead dentro del array "leads":
{
  "name": "Jahmai Jahzeel Rivera Flores",
  "email": "jahmai18@hotmail.com",
  "phone": "+50760434060",
  "company": "Ministerio de Educación",
  "address": "null",
  "businessType": "null",
  "website": "null",
  "notes": "Campaña: Campaña clientes Hiopos, Anuncio: Hiopos Lite, Plataforma: fb, Creado: 2025-02-23T05:06:50-05:00, ID Origen: l:1396823291684773",
  "suggestedStage": "Nuevo"
}

Si el CSV no contiene leads válidos (con nombre) o no puedes extraer información, devuelve un array "leads" vacío.
Extrae la información de manera precisa y estructurada. Si hay filas vacías o malformadas, intenta omitirlas.`
});
