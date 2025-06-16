import { NextRequest, NextResponse } from 'next/server';
import { evaluateBusinessFeatures, type EvaluateBusinessInput } from '@/ai/flows/evaluateBusinessFlow';
import { withAICache } from '@/lib/ai-cache-manager';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Evaluación del Negocio API Iniciada ===');
    
    let body: EvaluateBusinessInput;
    try {
      body = await request.json();
      console.log('Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'JSON inválido en el cuerpo de la solicitud' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!body.leadName || typeof body.leadName !== 'string' || body.leadName.trim() === '') {
      console.log('Missing or invalid leadName:', body.leadName);
      return NextResponse.json(
        { error: 'leadName es obligatorio y debe ser una cadena no vacía' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Calling evaluateBusinessFeatures with:', body);
    
    // Intentar obtener el leadId de la URL o del body
    const url = new URL(request.url);
    const leadIdFromUrl = url.searchParams.get('leadId');
    const leadId = body.leadId || leadIdFromUrl;
    
    // Obtener el lead actual para verificar cache
    let currentLead = null;
    try {
      if (leadId) {
        const leadDoc = await admin.firestore().collection('leads-flow').doc(leadId).get();
        currentLead = leadDoc.exists ? leadDoc.data() : null;
      }
    } catch (error) {
      console.warn('Error obteniendo lead para cache:', error);
    }
    
    let result;
    try {
      // Usar cache si tenemos leadId y datos del lead
      if (leadId && currentLead) {
        console.log(`🔍 Verificando cache para evaluación del lead ${leadId}`);
        const cacheResult = await withAICache(
          leadId,
          'businessEvaluation',
          () => evaluateBusinessFeatures(body),
          body,
          currentLead.aiContent
        );
        result = cacheResult.content;
        console.log(`✅ Evaluación ${cacheResult.fromCache ? 'obtenida del cache' : 'generada por IA'}`);
      } else {
        console.log('⚠️ Generando evaluación sin cache (no leadId disponible)');
        result = await evaluateBusinessFeatures(body);
      }
      console.log('evaluateBusinessFeatures completed successfully:', result);
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
    
    // Save the evaluation result to the database
    await saveEvaluationToDatabase(result); 
    console.log('=== Evaluate Business API Success ===');
    return NextResponse.json(result, {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('=== Evaluate Business API Error ===');
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
