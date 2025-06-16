import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AI Test Endpoint ===');
    
    // Test environment variables
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'GOOGLE_API_KEY not configured',
          env: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    // Test genkit import
    try {
      const { ai } = await import('@/ai/genkit');
      console.log('Genkit import successful');
      
      return NextResponse.json({
        status: 'OK',
        message: 'AI system is configured correctly',
        apiKeyPresent: !!apiKey,
        apiKeyLength: apiKey.length,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      
    } catch (importError) {
      console.error('Genkit import failed:', importError);
      return NextResponse.json(
        { 
          error: 'Failed to import AI system',
          details: importError instanceof Error ? importError.message : 'Unknown import error',
          stack: importError instanceof Error ? importError.stack : 'No stack trace'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Test endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}