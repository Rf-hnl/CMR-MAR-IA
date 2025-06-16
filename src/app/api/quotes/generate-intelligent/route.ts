import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema para la entrada de cotización inteligente
const IntelligentQuoteInputSchema = z.object({
  leadName: z.string().describe('Nombre del lead/cliente'),
  businessType: z.string().optional().describe('Tipo de negocio del cliente'),
  evaluation: z.string().describe('Evaluación completa del negocio realizada por IA'),
  requestedServices: z.array(z.string()).describe('Lista de servicios recomendados extraídos de la evaluación'),
});

// Schema para la respuesta
const IntelligentQuoteOutputSchema = z.object({
  quotationUrl: z.string().describe('URL del documento de cotización generado en PandaDoc'),
  quotationId: z.string().describe('ID único de la cotización'),
  estimatedValue: z.number().describe('Valor estimado total de la cotización'),
  services: z.array(z.object({
    name: z.string(),
    price: z.number(),
    description: z.string()
  })).describe('Lista de servicios incluidos en la cotización'),
});

// Definir el flujo de IA para generar cotizaciones inteligentes
const generateIntelligentQuoteFlow = ai.defineFlow(
  {
    name: 'generateIntelligentQuoteFlow',
    inputSchema: IntelligentQuoteInputSchema,
    outputSchema: IntelligentQuoteOutputSchema,
  },
  async (input) => {
    // Catálogo de servicios con precios base
    const servicesCatalog = {
      'CRM y Gestión de Leads': { price: 150, description: 'Sistema completo de gestión de clientes y seguimiento de oportunidades' },
      'WhatsApp Business Automation': { price: 120, description: 'Automatización avanzada de mensajes y gestión de conversaciones' },
      'Tracking y Analytics': { price: 100, description: 'Sistema de seguimiento de interacciones y métricas de engagement' },
      'Inteligencia Artificial': { price: 200, description: 'Generación de contenido, evaluaciones y recomendaciones personalizadas' },
      'Desarrollo Web': { price: 300, description: 'Sitios web profesionales y plataformas digitales personalizadas' },
      'Marketing Digital': { price: 180, description: 'Estrategias de presencia online y optimización de conversiones' },
      'Sistemas TPV': { price: 250, description: 'Puntos de venta y gestión completa de transacciones' },
      'Cotizaciones Inteligentes': { price: 80, description: 'Generación automática de propuestas comerciales' },
      'Integración de APIs': { price: 220, description: 'Conexión entre sistemas y automatización de procesos' },
      'Consultoría Digital': { price: 160, description: 'Asesoría en transformación digital y optimización de procesos' },
    };

    // Mapear servicios solicitados con el catálogo
    const selectedServices = input.requestedServices.map(serviceName => {
      const catalogService = servicesCatalog[serviceName as keyof typeof servicesCatalog];
      if (catalogService) {
        return {
          name: serviceName,
          price: catalogService.price,
          description: catalogService.description
        };
      }
      // Servicio genérico si no está en el catálogo
      return {
        name: serviceName,
        price: 100,
        description: `Servicio personalizado: ${serviceName}`
      };
    });

    // Calcular valor total
    const estimatedValue = selectedServices.reduce((total, service) => total + service.price, 0);

    // Generar un ID único para la cotización
    const quotationId = `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simular integración con PandaDoc (en un escenario real, aquí se haría la llamada a PandaDoc API)
    const pandaDocUrl = await createPandaDocQuotation({
      leadName: input.leadName,
      businessType: input.businessType || 'Negocio',
      services: selectedServices,
      totalValue: estimatedValue,
      quotationId
    });

    return {
      quotationUrl: pandaDocUrl,
      quotationId,
      estimatedValue,
      services: selectedServices
    };
  }
);

// Función simulada para crear documento en PandaDoc
async function createPandaDocQuotation(data: {
  leadName: string;
  businessType: string;
  services: Array<{ name: string; price: number; description: string }>;
  totalValue: number;
  quotationId: string;
}) {
  // En un escenario real, aquí se integraría con PandaDoc API
  // Por ahora, simulamos la creación y retornamos una URL simulada
  
  console.log('🔄 Creando documento en PandaDoc para:', data.leadName);
  console.log('📊 Servicios incluidos:', data.services.map(s => s.name).join(', '));
  console.log('💰 Valor total:', data.totalValue);

  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 2000));

  // URL simulada de PandaDoc (en producción sería la URL real del documento)
  return `https://app.pandadoc.com/s/${data.quotationId}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Solicitud de cotización inteligente recibida:', body);

    // Validar entrada
    const validatedInput = IntelligentQuoteInputSchema.parse(body);

    // Ejecutar el flujo de IA
    const result = await generateIntelligentQuoteFlow(validatedInput);

    console.log('✅ Cotización inteligente generada exitosamente:', result);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error generando cotización inteligente:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al generar cotización'
      },
      { status: 500 }
    );
  }
}