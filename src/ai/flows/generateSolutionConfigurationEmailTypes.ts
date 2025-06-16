import {z} from 'genkit';

const ProductoPropuestoSchema = z.object({
  nombre_producto: z.string().describe('Nombre del producto TPV sugerido.'),
  cantidad: z.number().describe('Cantidad de este producto sugerida.'),
  justificacion_base_del_sistema: z.string().describe('Justificación base proporcionada por el sistema para incluir este producto. MAR-IA debe elaborar sobre esto.'),
});

const ComponenteConfiguracionSchema = z.object({
  area_o_funcion_destino: z.string().describe('El área o función principal que este componente de la configuración aborda para el lead (ej. "Gestión Integral del Negocio", "Movilidad en la Atención").'),
  productos_sugeridos: z.array(ProductoPropuestoSchema).describe('Lista de productos sugeridos para esta área/función.'),
});

export const GenerateSolutionConfigurationEmailInputSchema = z.object({
  nombre_lead: z.string().describe("Nombre del negocio o lead principal."),
  tipo_negocio_lead: z.string().describe("Tipo de negocio del lead (ej. Restaurante, Salón de Belleza)."),
  contacto_lead: z.string().describe("Nombre de la persona de contacto en el negocio del lead, para el saludo del correo."),
  caracteristicas_clave_lead: z.array(z.string()).describe("Características o necesidades clave identificadas para el lead (ej. 'mejorar gestión de inventario', 'optimizar servicio al cliente')."),
  configuracion_propuesta: z.array(ComponenteConfiguracionSchema).describe("La configuración de solución TPV detallada propuesta por el sistema."),
  beneficios_generales_configuracion: z.array(z.string()).describe("Lista de beneficios generales que esta configuración aportaría al lead."),
  nombre_remitente_crm: z.string().describe("Nombre del usuario del CRM que está enviando el correo, para referencia en la firma si es necesario."),
});
export type GenerateSolutionConfigurationEmailInput = z.infer<typeof GenerateSolutionConfigurationEmailInputSchema>;

export const GenerateSolutionConfigurationEmailOutputSchema = z.object({
  email_subject: z.string().describe("El asunto del correo electrónico generado."),
  email_body: z.string().describe("El cuerpo completo del correo electrónico generado, en texto plano."),
});
export type GenerateSolutionConfigurationEmailOutput = z.infer<typeof GenerateSolutionConfigurationEmailOutputSchema>;