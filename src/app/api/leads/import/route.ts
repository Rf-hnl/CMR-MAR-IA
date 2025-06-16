import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { LeadSource, LeadStage, LeadStatus, BusinessType } from '@/types/unified-lead';

interface ImportLeadRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  address?: string;
  currentStage: string;
  source: string;
  notes?: string;
  estimatedValue?: number;
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
  
  if (normalized === 'import' || normalized === 'csv_upload') return LeadSource.CSV_IMPORT;
  if (normalized === 'manual') return LeadSource.MANUAL;
  if (normalized === 'referral' || normalized === 'referencia') return LeadSource.REFERRAL;
  if (normalized === 'website' || normalized === 'web') return LeadSource.WEBSITE;
  if (normalized === 'social_media' || normalized === 'redes') return LeadSource.LINKEDIN;
  if (normalized === 'other') return LeadSource.CSV_IMPORT;
  
  return LeadSource.CSV_IMPORT;
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
    const { leads, organizationId } = body as { leads: ImportLeadRequest[]; organizationId: string };

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ message: 'No se proporcionaron leads válidos.' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ message: 'organizationId es requerido.' }, { status: 400 });
    }

    console.log(`Importing ${leads.length} leads for UID: ${uid}, Organization: ${organizationId}`);

    const batch = firestoreDbAdmin.batch();
    const leadsCollection = firestoreDbAdmin.collection('leads-flow');
    let savedCount = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        // Validate required fields
        if (!lead.fullName || !lead.email) {
          errors.push(`Lead sin nombre o email válido: ${lead.fullName || 'Sin nombre'}`);
          continue;
        }

        // Check for duplicates based on email and organization
        const existingLeadQuery = await firestoreDbAdmin
          .collection('leads-flow')
          .where('organizationId', '==', organizationId)
          .where('email', '==', lead.email)
          .limit(1)
          .get();

        if (!existingLeadQuery.empty) {
          console.log(`Lead ${lead.fullName} (${lead.email}) already exists. Skipping.`);
          continue;
        }

        const leadDocRef = leadsCollection.doc();
        const timestamp = FieldValue.serverTimestamp();
        
        // Map to UnifiedLead structure
        const unifiedLead = {
          // Core identifiers
          leadId: leadDocRef.id,
          sourceId: leadDocRef.id,
          
          // Core information (matching UnifiedLead interface)
          fullName: lead.fullName,
          email: lead.email,
          phone: lead.phoneNumber || null,
          company: lead.companyName || null,
          
          // Contact details
          address: lead.address ? {
            formatted: lead.address
          } : undefined,
          
          // Business information
          businessType: getBusinessTypeFromString(),
          
          // Lead management
          stage: getLeadStageFromString(lead.currentStage || 'Nuevo'),
          source: getLeadSourceFromString(lead.source || 'import'),
          status: LeadStatus.ACTIVE,
          
          // Sales pipeline
          estimatedValue: lead.estimatedValue || 0,
          
          // Source-specific data for imports
          sourceData: {
            type: 'import',
            importType: 'csv',
            fileName: 'bulk_import',
            importedAt: new Date().toISOString(),
            createdBy: uid
          },
          
          // Notes
          notes: lead.notes || '',
          
          // Metadata
          metadata: {
            version: '1.0',
            tags: ['import', 'csv'],
            automation: {
              enabled: true
            }
          },
          
          // Legacy fields for backward compatibility
          currentStage: lead.currentStage || 'Nuevo',
          phoneNumber: lead.phoneNumber || '',
          companyName: lead.companyName || '',
          
          // Timestamps and organization
          createdAt: timestamp,
          updatedAt: timestamp,
          uid,
          organizationId,
          
          // Stage history
          stageHistory: [{
            stage: lead.currentStage || 'Nuevo',
            enteredAt: new Date().toISOString(),
            triggeredBy: 'import',
            userId: uid,
            notes: `Lead importado`
          }]
        };

        batch.set(leadDocRef, unifiedLead);
        savedCount++;

      } catch (error: any) {
        errors.push(`Error procesando lead ${lead.fullName}: ${error.message}`);
      }
    }

    if (savedCount > 0) {
      await batch.commit();
      console.log(`Successfully imported ${savedCount} leads for UID: ${uid}`);
    }

    const response: any = { 
      message: `${savedCount} lead(s) importados correctamente`,
      saved: savedCount,
      total: leads.length
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.message += ` (${errors.length} errores)`;
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Error al importar leads:', error);
    return NextResponse.json({ 
      message: 'Error al importar leads', 
      error: error.message || 'Error desconocido'
    }, { status: 500 });
  }
}