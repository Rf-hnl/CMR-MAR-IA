export interface PromptVariable {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  description: string;
  required: boolean;
  example?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_actions' | 'lead_import' | 'other';
  variables: PromptVariable[];
  defaultPrompt: string;
  customPrompt?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  version: number;
}

export interface PromptConfig {
  id?: string;
  userId: string;
  templates: PromptTemplate[];
  globalSettings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PROMPT_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'version'>[] = [
  {
    name: 'Mensaje de Bienvenida',
    description: 'Genera mensajes personalizados de primer contacto para nuevos leads',
    category: 'lead_actions',
    variables: [
      {
        name: 'leadName',
        type: 'string',
        description: 'Nombre del negocio o contacto principal',
        required: true,
        example: 'Restaurante El Buen Sabor'
      },
      {
        name: 'businessType',
        type: 'string',
        description: 'Tipo o categoría del negocio',
        required: false,
        example: 'restaurante'
      }
    ],
    defaultPrompt: `Eres un asistente de ventas amigable y profesional. Tu tarea es redactar un mensaje de bienvenida corto y personalizado para un nuevo lead.

Nombre del Lead: {{{leadName}}}
{{#if businessType}}
Tipo de Negocio: {{{businessType}}}
{{/if}}

Considera lo siguiente para el mensaje:
- Sé cordial y entusiasta.
- Menciona el nombre del lead.
- Si se proporciona el tipo de negocio, puedes hacer una referencia sutil a él.
- El objetivo es iniciar una conversación y mostrar interés genuino en explorar cómo tus servicios/productos podrían ayudarle.
- Evita ser demasiado genérico o insistente.
- Mantén el mensaje breve, ideal para un primer contacto (email corto o mensaje directo).

Genera solo el cuerpo del mensaje.`,
    isActive: true
  },
  {
    name: 'Evaluación de Negocio',
    description: 'Analiza características y oportunidades de un negocio',
    category: 'lead_actions',
    variables: [
      {
        name: 'leadName',
        type: 'string',
        description: 'Nombre del negocio',
        required: true,
        example: 'Clínica Dental Dr. García'
      },
      {
        name: 'businessType',
        type: 'string',
        description: 'Tipo de negocio',
        required: false,
        example: 'clínica dental'
      },
      {
        name: 'address',
        type: 'string',
        description: 'Dirección del negocio',
        required: false,
        example: 'Av. Principal 123, Madrid'
      },
      {
        name: 'website',
        type: 'string',
        description: 'Sitio web del negocio',
        required: false,
        example: 'https://clinicadrgarcia.com'
      }
    ],
    defaultPrompt: `Eres un analista de negocios especializado en identificar oportunidades para empresas a través de la tecnología y servicios digitales. Tu tarea es proporcionar una breve evaluación del negocio "{{leadName}}".

Información disponible del negocio:
- Nombre: {{leadName}}
{{#if businessType}}- Tipo: {{businessType}}{{/if}}
{{#if address}}- Dirección: {{address}}{{/if}}
{{#if website}}- Sitio Web: {{website}}{{/if}}

Basándote en esta información (y en conocimiento general si es un tipo de negocio común):
1. Identifica 1-2 posibles puntos fuertes del negocio.
2. Identifica 1-2 áreas donde podrían beneficiarse de mejoras tecnológicas, digitalización o nuevos servicios (ej. marketing digital, optimización de procesos, presencia online, herramientas de gestión, etc.).
3. Sé conciso y directo. El resultado debe ser un texto breve y fácil de entender.

Formato de la evaluación:
Puntos Fuertes:
- [Punto fuerte 1]
- [Punto fuerte 2 (si aplica)]

Áreas de Oportunidad (Tecnología/Digital):
- [Oportunidad 1 con breve descripción]
- [Oportunidad 2 con breve descripción (si aplica)]

Genera solo la evaluación.`,
    isActive: true
  },
  {
    name: 'Recomendaciones de Ventas',
    description: 'Genera sugerencias de productos específicos para un lead',
    category: 'lead_actions',
    variables: [
      {
        name: 'leadName',
        type: 'string',
        description: 'Nombre del negocio',
        required: true,
        example: 'Tienda de Ropa Fashion'
      },
      {
        name: 'businessType',
        type: 'string',
        description: 'Tipo de negocio',
        required: false,
        example: 'tienda de ropa'
      },
      {
        name: 'userProducts',
        type: 'array',
        description: 'Lista de productos/servicios disponibles',
        required: false,
        example: '[{name: "TPV Básico", category: "hardware", price: "$299"}]'
      }
    ],
    defaultPrompt: `Eres MAR-IA, una asesora experta en soluciones de punto de venta (TPV) y tecnología para negocios. Tu tarea es generar recomendaciones específicas para el negocio "{{{leadName}}}".

Información del Lead:
- Nombre: {{{leadName}}}
{{#if businessType}}- Tipo de Negocio: {{{businessType}}}{{/if}}

{{#if userProducts}}
Productos/Servicios Disponibles:
{{#each userProducts}}
- {{this.name}} ({{this.category}}) - {{this.price}}
  {{#if this.description}}Descripción: {{this.description}}{{/if}}
{{/each}}
{{else}}
IMPORTANTE: No tienes productos específicos proporcionados, así que debes hacer recomendaciones generales por categorías.
{{/if}}

Instrucciones:
1. Analiza las necesidades típicas de este tipo de negocio.
{{#if userProducts}}
2. De la lista de productos proporcionada, selecciona máximo 3 que mejor se adapten.
3. Para cada producto recomendado, explica específicamente por qué sería valioso para este negocio.
{{else}}
2. Sugiere máximo 3 categorías de productos/servicios generales que serían valiosos.
3. Para cada recomendación, la "area" será la categoría genérica (ej: "Marketing Digital").
4. La "suggestion" debe ser una breve justificación (1-2 frases) de por qué sería valioso para ellos.
5. Sé específico y práctico en tus sugerencias.
{{/if}}

Genera una lista de recomendaciones en formato JSON de acuerdo con el esquema de salida esperado, siguiendo estrictamente las instrucciones anteriores.`,
    isActive: true
  },
  {
    name: 'Email de Configuración TPV',
    description: 'Crea emails técnicos personalizados para propuestas TPV',
    category: 'lead_actions',
    variables: [
      {
        name: 'leadName',
        type: 'string',
        description: 'Nombre del negocio lead',
        required: true,
        example: 'Café Central'
      },
      {
        name: 'businessType',
        type: 'string',
        description: 'Tipo de negocio del lead',
        required: true,
        example: 'cafetería'
      },
      {
        name: 'contactName',
        type: 'string',
        description: 'Persona de contacto en el lead',
        required: false,
        example: 'Sr. Martínez'
      },
      {
        name: 'proposedConfiguration',
        type: 'array',
        description: 'Configuración de productos propuestos',
        required: true,
        example: 'Lista de productos y configuraciones TPV'
      }
    ],
    defaultPrompt: `Eres MAR-IA, una asesora experta en soluciones TPV de HIOPOS, altamente competente en redacción de correos electrónicos de ventas persuasivos y profesionales.
Tu tarea es generar el ASUNTO y el CUERPO de un correo electrónico personalizado para un lead, presentando una propuesta de configuración de solución TPV.

Información del Lead y Propuesta (proporcionada por el sistema CRM):
- Nombre del Lead (Negocio): {{leadName}}
- Tipo de Negocio del Lead: {{businessType}}
{{#if contactName}}- Persona de Contacto en el Lead: {{contactName}}{{/if}}

- Configuración de Solución TPV Propuesta:
{{#each proposedConfiguration}}
  - Área/Función: {{this.areaFunction}}
  {{#each this.suggestedProducts}}
    - Producto: {{this.quantity}} x {{this.productName}}
    - Justificación Base (Sistema): {{this.justification}}
  {{/each}}
{{/each}}

Instrucciones para MAR-IA:

1. **Asunto del Correo:**
   - Debe ser atractivo y profesional
   - Mencionar el nombre del negocio
   - Hacer referencia a la solución TPV personalizada
   - Máximo 60 caracteres

2. **Cuerpo del Correo:**
   - Saludo personalizado (usar contactName si está disponible, sino dirigirse al negocio)
   - Introducción breve que demuestre conocimiento del tipo de negocio
   - Presentación clara de la configuración propuesta
   - Beneficios específicos para su tipo de negocio
   - Call-to-action claro para próximos pasos
   - Cierre profesional firmado como MAR-IA, Asesora en Soluciones HIOPOS

3. **Tono y Estilo:**
   - Profesional pero cercano
   - Enfocado en valor y beneficios
   - Específico y técnico cuando sea necesario
   - Persuasivo sin ser agresivo

Genera el email completo con asunto y cuerpo.`,
    isActive: true
  }
];

export const DEFAULT_GLOBAL_SETTINGS = {
  model: 'googleai/gemini-1.5-flash',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9
};