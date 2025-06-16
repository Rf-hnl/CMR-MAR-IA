import { NextRequest, NextResponse } from 'next/server';
import { generateQuote, type QuoteInput } from '@/ai/flows/generateQuoteFlow';

interface QuoteRequestBody {
  leadName: string;
  businessType: string;
  leadInfo?: {
    necesidades?: string[];
    presupuesto_estimado?: string;
    tamaño_empresa?: 'pequeña' | 'mediana' | 'grande' | 'enterprise';
  };
  requerimientos_especiales?: string[];
  contexto_adicional?: string;
  organizationId: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Generate Quote API Iniciada ===');
    
    let body: QuoteRequestBody;
    try {
      body = await request.json();
      console.log('Request body parsed successfully:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'JSON inválido en el cuerpo de la solicitud' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validaciones básicas
    if (!body.leadName || typeof body.leadName !== 'string' || body.leadName.trim() === '') {
      console.log('Missing or invalid leadName:', body.leadName);
      return NextResponse.json(
        { error: 'leadName es obligatorio y debe ser una cadena no vacía' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.businessType || typeof body.businessType !== 'string' || body.businessType.trim() === '') {
      console.log('Missing or invalid businessType:', body.businessType);
      return NextResponse.json(
        { error: 'businessType es obligatorio y debe ser una cadena no vacía' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.organizationId || typeof body.organizationId !== 'string') {
      console.log('Missing or invalid organizationId:', body.organizationId);
      return NextResponse.json(
        { error: 'organizationId es obligatorio' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Fetching catalog for organization:', body.organizationId);
    
    // Obtener el catálogo de productos y servicios
    let catalogData;
    try {
      const catalogResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/catalog?organizationId=${body.organizationId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!catalogResponse.ok) {
        throw new Error(`Error al obtener catálogo: ${catalogResponse.status}`);
      }

      catalogData = await catalogResponse.json();
      console.log('Catalog data fetched:', catalogData);
    } catch (catalogError) {
      console.error('Error fetching catalog:', catalogError);
      
      // Usar catálogo por defecto si no se puede obtener
      catalogData = {
        products: [
          'Sistema TPV',
          'Software de Gestión',
          'Aplicación Móvil',
          'Página Web',
          'Sistema de Inventario'
        ],
        services: [
          'Consultoría IT',
          'Soporte Técnico',
          'Capacitación',
          'Implementación',
          'Mantenimiento'
        ],
        targetAudience: ['Pequeñas empresas', 'Restaurantes', 'Retail'],
        isEmpty: false
      };
      
      console.log('Using default catalog due to error');
    }
    
    // Transformar el catálogo al formato esperado por la IA
    const catalogoTransformado = {
      productos: (catalogData.products || []).map((producto: string) => ({
        nombre: producto,
        categoria: 'producto' as const,
        descripcion: `${producto} adaptado para ${body.businessType}`
      })),
      servicios: (catalogData.services || []).map((servicio: string) => ({
        nombre: servicio,
        categoria: 'servicio' as const,
        descripcion: `${servicio} especializado para ${body.businessType}`
      }))
    };

    console.log('Transformed catalog:', catalogoTransformado);
    
    // Preparar el input para la IA
    const quoteInput: QuoteInput = {
      lead_info: {
        nombre: body.leadName,
        tipo_negocio: body.businessType,
        necesidades: body.leadInfo?.necesidades || [],
        presupuesto_estimado: body.leadInfo?.presupuesto_estimado,
        tamaño_empresa: body.leadInfo?.tamaño_empresa || 'pequeña'
      },
      catalogo_disponible: catalogoTransformado,
      requerimientos_especiales: body.requerimientos_especiales || [],
      contexto_adicional: body.contexto_adicional
    };

    console.log('Calling generateQuote with input:', JSON.stringify(quoteInput, null, 2));
    
    let result;
    try {
      result = await generateQuote(quoteInput);
      console.log('generateQuote completed successfully');
    } catch (aiError) {
      console.error('AI Flow error:', aiError);
      console.error('AI Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
      
      return NextResponse.json(
        { error: `Error en el procesamiento de IA: ${aiError instanceof Error ? aiError.message : 'Error desconocido'}` },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!result || typeof result !== 'object') {
      console.error('Invalid result from AI:', result);
      return NextResponse.json(
        { error: 'Respuesta no válida del sistema de IA' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Agregar metadata adicional
    const enhancedResult = {
      ...result,
      metadata: {
        generated_at: new Date().toISOString(),
        lead_name: body.leadName,
        business_type: body.businessType,
        organization_id: body.organizationId,
        catalog_items_used: catalogoTransformado.productos.length + catalogoTransformado.servicios.length
      }
    };

    console.log('=== Generate Quote API Success ===');
    return NextResponse.json(enhancedResult, {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Generate Quote API Error ===');
    console.error('Unexpected error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}