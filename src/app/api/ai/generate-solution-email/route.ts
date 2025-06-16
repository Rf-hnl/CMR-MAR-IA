import { NextRequest, NextResponse } from 'next/server';
import { generateSolutionConfigurationEmail } from '@/ai/flows/generateSolutionConfigurationEmailFlow';
import type { GenerateSolutionConfigurationEmailInput } from '@/ai/flows/generateSolutionConfigurationEmailTypes';

export async function POST(req: NextRequest) {
  try {
    const { leadName, businessType, configurationProposal, products, benefits } = await req.json();

    if (!leadName || !businessType) {
      return NextResponse.json(
        { error: 'Lead name and business type are required' },
        { status: 400 }
      );
    }

    const input: GenerateSolutionConfigurationEmailInput = {
      nombre_lead: leadName as string,
      tipo_negocio_lead: businessType as string,
      contacto_lead: leadName as string,
      caracteristicas_clave_lead: ['Modernización del sistema TPV', 'Optimización de procesos'],
      configuracion_propuesta: [{
        area_o_funcion_destino: 'Gestión Integral del Negocio',
        productos_sugeridos: (products as string[] || []).map((product: string) => ({
          nombre_producto: product,
          cantidad: 1,
          justificacion_base_del_sistema: 'Recomendado para optimizar las operaciones del negocio'
        }))
      }],
      beneficios_generales_configuracion: benefits as string[] || [],
      nombre_remitente_crm: 'Sistema CRM'
    };

    const result = await generateSolutionConfigurationEmail(input);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating solution configuration email:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar email';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}