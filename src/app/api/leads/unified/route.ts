// === UNIFIED LEADS API ===
// API principal para el sistema unificado de leads

import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { leadUnifier } from '@/lib/lead-unifier';
import type { CreateLeadInput, UpdateLeadInput, LeadFilters } from '@/types/unified-lead';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return { error: 'Firebase Admin SDK not initialized', status: 500 };
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { error: 'No autorizado: Token faltante o inválido', status: 401 };
  }

  const token = authorizationHeader.split('Bearer ')[1];
  try {
    const decodedToken = await authAdmin.verifyIdToken(token);
    if (!decodedToken.uid) {
      return { error: 'No autorizado: UID no encontrado en el token', status: 401 };
    }
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { error: 'No autorizado: Token inválido', status: 401 };
  }
}

// === GET: Search and retrieve leads ===
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const leadId = searchParams.get('leadId');

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'organizationId es requerido' 
      }, { status: 400 });
    }

    // Get single lead by ID
    if (leadId) {
      const result = await leadUnifier.getLeadById(leadId);
      return NextResponse.json(result, { 
        status: result.success ? 200 : 404 
      });
    }

    // Parse filters from query parameters
    const filters: LeadFilters = {};
    
    const sources = searchParams.get('sources');
    if (sources) {
      filters.sources = sources.split(',') as any[];
    }
    
    const stages = searchParams.get('stages');
    if (stages) {
      filters.stages = stages.split(',') as any[];
    }
    
    const businessTypes = searchParams.get('businessTypes');
    if (businessTypes) {
      filters.businessTypes = businessTypes.split(',') as any[];
    }
    
    const assignedTo = searchParams.get('assignedTo');
    if (assignedTo) {
      filters.assignedTo = assignedTo.split(',');
    }
    
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }
    
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');
    if (minValue || maxValue) {
      filters.valueRange = {
        min: minValue ? parseFloat(minValue) : undefined,
        max: maxValue ? parseFloat(maxValue) : undefined
      };
    }
    
    const tags = searchParams.get('tags');
    if (tags) {
      filters.tags = tags.split(',');
    }

    // Search leads
    const result = await leadUnifier.searchLeads(organizationId, filters, page, limit);
    
    return NextResponse.json({ 
      success: true, 
      ...result 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/leads/unified:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    }, { status: 500 });
  }
}

// === POST: Create new lead ===
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const body = await request.json();
    const { leadData, sourceType, sourceData } = body;

    // Validate required fields
    if (!leadData && !sourceData) {
      return NextResponse.json({ 
        success: false, 
        message: 'leadData o sourceData son requeridos' 
      }, { status: 400 });
    }

    let result;

    if (sourceData && sourceType) {
      // Create from source data (meta, extended, flow)
      result = await leadUnifier.createLeadFromSource(sourceData, sourceType);
    } else {
      // Create from unified lead data
      const createInput: CreateLeadInput = {
        ...leadData,
        uid: authResult.uid
      };
      result = await leadUnifier.createLead(createInput);
    }

    return NextResponse.json(result, { 
      status: result.success ? 201 : 400 
    });

  } catch (error: any) {
    console.error('Error in POST /api/leads/unified:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error creando lead',
      error: error.message 
    }, { status: 500 });
  }
}

// === PUT: Update existing lead ===
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ 
        success: false, 
        message: 'leadId es requerido' 
      }, { status: 400 });
    }

    const body = await request.json();
    const updateData: UpdateLeadInput = body;

    const result = await leadUnifier.updateLead(leadId, updateData);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });

  } catch (error: any) {
    console.error('Error in PUT /api/leads/unified:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error actualizando lead',
      error: error.message 
    }, { status: 500 });
  }
}

// === DELETE: Delete lead (soft delete) ===
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.error 
      }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ 
        success: false, 
        message: 'leadId es requerido' 
      }, { status: 400 });
    }

    const result = await leadUnifier.deleteLead(leadId);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/leads/unified:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error eliminando lead',
      error: error.message 
    }, { status: 500 });
  }
}