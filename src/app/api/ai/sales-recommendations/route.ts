import { NextRequest, NextResponse } from 'next/server';
import { generateSalesRecommendations, type SalesRecommendationsInput } from '@/ai/flows/salesRecommendationsFlow';

export async function POST(request: NextRequest) {
  try {
    const body: SalesRecommendationsInput = await request.json();
    
    console.log('Sales recommendations API called with:', body);
    
    if (!body.leadName) {
      return NextResponse.json(
        { error: 'leadName es requerido' },
        { status: 400 }
      );
    }
    
    const result = await generateSalesRecommendations(body);
    
    console.log('Sales recommendations API result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sales recommendations API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar recomendaciones';
    
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