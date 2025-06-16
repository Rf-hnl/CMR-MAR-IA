import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { LeadSource, LeadStage, LeadStatus, BusinessType } from '@/types/unified-lead';

interface CreateLeadRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  address?: string;
  currentStage: string;
  source: string;
  notes?: string;
  estimatedValue?: number;
  businessType?: string;
}

function getBusinessTypeFromString(businessType?: string): BusinessType {
  if (!businessType) return BusinessType.GENERAL;
  
  const normalized = businessType.toLowerCase();
  
  if (normalized.includes('restaurant') || normalized.includes('comida')) return BusinessType.RESTAURANT;
  if (normalized.includes('auto') || normalized.includes('vehic')) return BusinessType.AUTOMOTIVE;
  if (normalized.includes('inmobil') || normalized.includes('casa') || normalized.includes('property')) return BusinessType.REAL_ESTATE;
  if (normalized.includes('salud') || normalized.includes('medic') || normalized.includes('health')) return BusinessType.HEALTH;
  if (normalized.includes('tienda') || normalized.includes('retail') || normalized.includes('shop')) return BusinessType.RETAIL;
  if (normalized.includes('servicio') || normalized.includes('service')) return BusinessType.SERVICES;
  if (normalized.includes('tech') || normalized.includes('software') || normalized.includes('tecnolog')) return BusinessType.TECHNOLOGY;
  if (normalized.includes('educac') || normalized.includes('escuela') || normalized.includes('education')) return BusinessType.EDUCATION;
  if (normalized.includes('financ') || normalized.includes('banco') || normalized.includes('finance')) return BusinessType.FINANCE;
  
  return BusinessType.GENERAL;
}

function getLeadSourceFromString(source: string): LeadSource {
  const normalized = source.toLowerCase();
  
  if (normalized === 'manual') return LeadSource.MANUAL;
  if (normalized === 'referral' || normalized === 'referencia') return LeadSource.REFERRAL;
  if (normalized === 'website' || normalized === 'web') return LeadSource.WEBSITE;
  if (normalized === 'social_media' || normalized === 'redes') return LeadSource.LINKEDIN;
  if (normalized === 'email') return LeadSource.MANUAL; // Email campaigns would be manual for now
  if (normalized === 'phone' || normalized === 'telefono') return LeadSource.MANUAL;
  if (normalized === 'event' || normalized === 'evento') return LeadSource.MANUAL;
  
  return LeadSource.MANUAL;
}

function getLeadStageFromString(stage: string): LeadStage {
  switch (stage) {
    case 'Nuevo': return LeadStage.NEW;
    case 'Contactado': return LeadStage.CONTACTED;
    case 'Calificado': return LeadStage.QUALIFIED;
    case 'Propuesta Enviada': return LeadStage.PROPOSAL_SENT;
    case 'Negociación': return LeadStage.NEGOTIATION;
    case 'Ganado': return LeadStage.WON;
    case 'Perdido': return LeadStage.LOST;
    case 'Prospecto': return LeadStage.PROSPECT;
    case 'Interesado': return LeadStage.INTERESTED;
    case 'Propuesta': return LeadStage.PROPOSAL;
    case 'Vendido': return LeadStage.SOLD;
    default: return LeadStage.NEW;
  }
}

export async function POST(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    console.error("Firebase Admin SDK not initialized.");
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'No autorizado: Token faltante o inválido.' }, { status: 401 });
  }
  const token = authorizationHeader.split('Bearer ')[1];

  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(token);
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return NextResponse.json({ message: 'No autorizado: Token inválido.' }, { status: 401 });
  }

  const uid = decodedToken.uid;
  if (!uid) {
    return NextResponse.json({ message: 'No autorizado: UID no encontrado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { lead, organizationId } = body as { lead: CreateLeadRequest; organizationId: string };

    if (!lead || !organizationId) {
      return NextResponse.json({ message: 'Datos del lead y organizationId son requeridos.' }, { status: 400 });
    }

    // Validate required fields
    if (!lead.fullName || !lead.email || !lead.phoneNumber) {
      return NextResponse.json({ message: 'Nombre, email y teléfono son campos requeridos.' }, { status: 400 });
    }

    console.log(`Creating manual lead for UID: ${uid}, Organization: ${organizationId}`);

    // Check for duplicates based on email and organization
    const existingLeadQuery = await firestoreDbAdmin
      .collection('leads-flow')
      .where('organizationId', '==', organizationId)
      .where('email', '==', lead.email)
      .limit(1)
      .get();

    if (!existingLeadQuery.empty) {
      return NextResponse.json({ 
        message: `Ya existe un lead con el email ${lead.email}`,
        duplicate: true 
      }, { status: 409 });
    }

    // Create the lead document
    const leadDocRef = firestoreDbAdmin.collection('leads-flow').doc();
    const timestamp = FieldValue.serverTimestamp();
    
    // Map to UnifiedLead structure
    const unifiedLead = {
      // Core identifiers
      leadId: leadDocRef.id,
      sourceId: leadDocRef.id,
      
      // Core information (matching UnifiedLead interface)
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phoneNumber,
      company: lead.companyName || null,
      
      // Contact details
      address: lead.address ? {
        formatted: lead.address
      } : undefined,
      
      // Business information
      businessType: getBusinessTypeFromString(lead.businessType),
      
      // Lead management
      stage: getLeadStageFromString(lead.currentStage),
      source: getLeadSourceFromString(lead.source),
      status: LeadStatus.ACTIVE,
      
      // Sales pipeline
      estimatedValue: lead.estimatedValue || 0,
      
      // Source-specific data for manual leads
      sourceData: {
        type: 'manual',
        createdBy: uid,
        source: lead.source,
        notes: lead.notes || ''
      },
      
      // Notes
      notes: lead.notes || '',
      
      // Metadata
      metadata: {
        version: '1.0',
        tags: ['manual'],
        automation: {
          enabled: true
        }
      },
      
      // Legacy fields for backward compatibility
      currentStage: lead.currentStage,
      phoneNumber: lead.phoneNumber,
      companyName: lead.companyName || '',
      
      // Timestamps and organization
      createdAt: timestamp,
      updatedAt: timestamp,
      uid,
      organizationId,
      
      // Stage history
      stageHistory: [{
        stage: lead.currentStage,
        enteredAt: new Date().toISOString(),
        triggeredBy: 'manual',
        userId: uid,
        notes: `Lead creado manualmente`
      }]
    };

    await leadDocRef.set(unifiedLead);
    
    console.log(`Successfully created manual lead: ${leadDocRef.id}`);

    return NextResponse.json({ 
      message: 'Lead creado exitosamente',
      leadId: leadDocRef.id,
      success: true
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error al crear lead manual:', error);
    return NextResponse.json({ 
      message: 'Error al crear el lead', 
      error: error.message || 'Error desconocido'
    }, { status: 500 });
  }
}