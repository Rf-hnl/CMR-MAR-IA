import { NextRequest, NextResponse } from 'next/server';
import { getEvolutionAPI } from '@/lib/evolution-api';

export async function GET(request: NextRequest) {
  try {
    const evolutionAPI = getEvolutionAPI();
    
    console.log('Checking WhatsApp connection status...');
    
    const result = await evolutionAPI.checkConnectionStatus();
    
    console.log('WhatsApp status result:', result);

    return NextResponse.json({
      success: result.success,
      connected: result.data?.connected || false,
      state: result.data?.state || 'unknown',
      error: result.error
    });

  } catch (error) {
    console.error('WhatsApp status API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al verificar estado';
    
    return NextResponse.json(
      { 
        success: false,
        connected: false,
        state: 'error',
        error: errorMessage 
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}