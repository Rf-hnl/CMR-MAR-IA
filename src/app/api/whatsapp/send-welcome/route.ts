import { NextRequest, NextResponse } from 'next/server';
import { getEvolutionAPI } from '@/lib/evolution-api';

interface SendWelcomeRequest {
  phone: string;
  leadName: string;
  businessType?: string;
  message?: string; // Mensaje personalizado de IA
}

export async function POST(request: NextRequest) {
  try {
    const body: SendWelcomeRequest = await request.json();
    
    console.log('WhatsApp welcome message API called with:', body);
    
    // Validaciones
    if (!body.phone || !body.leadName) {
      return NextResponse.json(
        { error: 'phone y leadName son requeridos' },
        { status: 400 }
      );
    }

    const evolutionAPI = getEvolutionAPI();
    
    // Si hay un mensaje personalizado de IA, enviarlo
    if (body.message) {
      const result = await evolutionAPI.sendTextMessage({
        number: body.phone,
        text: body.message
      });

      if (!result.success) {
        return NextResponse.json(
          { error: `Error al enviar mensaje por WhatsApp: ${result.error}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Mensaje personalizado enviado exitosamente',
        data: result.data
      });
    }

    // Si no hay mensaje personalizado, usar el template de bienvenida
    const result = await evolutionAPI.sendWelcomeMessage(
      body.phone,
      body.leadName,
      body.businessType
    );

    if (!result.success) {
      return NextResponse.json(
        { error: `Error al enviar mensaje por WhatsApp: ${result.error}` },
        { status: 500 }
      );
    }

    console.log('WhatsApp message sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Mensaje de bienvenida enviado exitosamente',
      data: result.data
    });

  } catch (error) {
    console.error('WhatsApp API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar WhatsApp';
    
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