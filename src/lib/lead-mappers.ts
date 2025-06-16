// === LEAD MAPPERS ===
// Mappers para convertir desde fuentes existentes al formato unificado

import type { 
  UnifiedLead, 
  CreateLeadInput,
  BusinessType, 
  LeadSource, 
  LeadStage, 
  LeadStatus,
  MetaAdsData,
  GooglePlacesData,
  ImportData,
  ManualData
} from '@/types/unified-lead';
import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';
import type { ExtendedLead } from '@/types';
import type { LeadsFlowModel } from '@/types/leads-flow';
import { validateCreateLeadInput } from './lead-validators';

// === UTILITY FUNCTIONS ===

/**
 * Determines business type from various data sources
 */
function determineBusinessType(data: {
  vehicle?: string;
  homeListing?: string;
  campaignName?: string;
  businessType?: string;
  industry?: string;
}): BusinessType | undefined {
  // Explicit business type
  if (data.businessType) {
    const typeMap: Record<string, BusinessType> = {
      'automotive': BusinessType.AUTOMOTIVE,
      'automotriz': BusinessType.AUTOMOTIVE,
      'auto': BusinessType.AUTOMOTIVE,
      'real_estate': BusinessType.REAL_ESTATE,
      'inmobiliaria': BusinessType.REAL_ESTATE,
      'restaurant': BusinessType.RESTAURANT,
      'restaurante': BusinessType.RESTAURANT,
      'health': BusinessType.HEALTH,
      'salud': BusinessType.HEALTH,
      'retail': BusinessType.RETAIL,
      'services': BusinessType.SERVICES,
      'servicios': BusinessType.SERVICES,
      'technology': BusinessType.TECHNOLOGY,
      'tecnologia': BusinessType.TECHNOLOGY,
      'education': BusinessType.EDUCATION,
      'educacion': BusinessType.EDUCATION,
      'finance': BusinessType.FINANCE,
      'finanzas': BusinessType.FINANCE
    };
    
    const normalized = data.businessType.toLowerCase();
    if (typeMap[normalized]) {
      return typeMap[normalized];
    }
  }

  // Infer from vehicle interest
  if (data.vehicle && data.vehicle.trim() !== '') {
    return BusinessType.AUTOMOTIVE;
  }

  // Infer from property interest
  if (data.homeListing && data.homeListing.trim() !== '') {
    return BusinessType.REAL_ESTATE;
  }

  // Infer from campaign name
  if (data.campaignName) {
    const campaign = data.campaignName.toLowerCase();
    if (campaign.includes('auto') || campaign.includes('car') || campaign.includes('vehicle')) {
      return BusinessType.AUTOMOTIVE;
    }
    if (campaign.includes('real estate') || campaign.includes('home') || campaign.includes('inmobili') || campaign.includes('propiedad')) {
      return BusinessType.REAL_ESTATE;
    }
    if (campaign.includes('restaurant') || campaign.includes('food') || campaign.includes('comida')) {
      return BusinessType.RESTAURANT;
    }
    if (campaign.includes('health') || campaign.includes('medical') || campaign.includes('salud')) {
      return BusinessType.HEALTH;
    }
    if (campaign.includes('tech') || campaign.includes('software') || campaign.includes('app')) {
      return BusinessType.TECHNOLOGY;
    }
    if (campaign.includes('education') || campaign.includes('course') || campaign.includes('educacion')) {
      return BusinessType.EDUCATION;
    }
  }

  return BusinessType.GENERAL;
}

/**
 * Maps lead stage from various formats
 */
function mapLeadStage(stage?: string): LeadStage {
  if (!stage) return LeadStage.NEW;

  const stageMap: Record<string, LeadStage> = {
    'nuevo': LeadStage.NEW,
    'new': LeadStage.NEW,
    'contactado': LeadStage.CONTACTED,
    'contacted': LeadStage.CONTACTED,
    'calificado': LeadStage.QUALIFIED,
    'qualified': LeadStage.QUALIFIED,
    'propuesta enviada': LeadStage.PROPOSAL_SENT,
    'proposal sent': LeadStage.PROPOSAL_SENT,
    'propuesta_enviada': LeadStage.PROPOSAL_SENT,
    'negociación': LeadStage.NEGOTIATION,
    'negotiation': LeadStage.NEGOTIATION,
    'negociacion': LeadStage.NEGOTIATION,
    'ganado': LeadStage.WON,
    'won': LeadStage.WON,
    'perdido': LeadStage.LOST,
    'lost': LeadStage.LOST,
    'prospecto': LeadStage.PROSPECT,
    'prospect': LeadStage.PROSPECT,
    'interesado': LeadStage.INTERESTED,
    'interested': LeadStage.INTERESTED,
    'propuesta': LeadStage.PROPOSAL,
    'proposal': LeadStage.PROPOSAL,
    'vendido': LeadStage.SOLD,
    'sold': LeadStage.SOLD
  };

  const normalized = stage.toLowerCase().trim();
  return stageMap[normalized] || LeadStage.NEW;
}

/**
 * Maps lead source from various formats
 */
function mapLeadSource(source?: string): LeadSource {
  if (!source) return LeadSource.MANUAL;

  const sourceMap: Record<string, LeadSource> = {
    'meta_ads': LeadSource.META_ADS,
    'meta_lead_ads': LeadSource.META_ADS,
    'facebook_ads': LeadSource.FACEBOOK_ADS,
    'instagram_ads': LeadSource.INSTAGRAM_ADS,
    'google_ads': LeadSource.GOOGLE_ADS,
    'google_places': LeadSource.GOOGLE_PLACES,
    'google_places_search': LeadSource.GOOGLE_PLACES,
    'xml_import': LeadSource.XML_IMPORT,
    'xml_import_ia': LeadSource.XML_IMPORT,
    'csv_import': LeadSource.CSV_IMPORT,
    'csv_import_ia': LeadSource.CSV_IMPORT,
    'manual': LeadSource.MANUAL,
    'website': LeadSource.WEBSITE,
    'referral': LeadSource.REFERRAL,
    'linkedin': LeadSource.LINKEDIN,
    'whatsapp': LeadSource.WHATSAPP
  };

  const normalized = source.toLowerCase().trim();
  return sourceMap[normalized] || LeadSource.MANUAL;
}

/**
 * Cleans and validates string fields
 */
function cleanString(value: any): string | null {
  if (!value || typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned === '' ? null : cleaned;
}

/**
 * Cleans and validates number fields
 */
function cleanNumber(value: any): number | undefined {
  if (typeof value === 'number' && !isNaN(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return undefined;
}

/**
 * Parses date from various formats
 */
function parseDate(value: any): string | undefined {
  if (!value) return undefined;
  
  try {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    if (typeof value === 'object' && 'toDate' in value) {
      return (value as any).toDate().toISOString();
    }
  } catch {
    // Invalid date
  }
  
  return undefined;
}

// === MAPPERS FROM EXISTING SOURCES ===

/**
 * Maps from MetaLeadAdsModel to UnifiedLead
 */
export function mapMetaLeadToUnified(
  metaLead: MetaLeadAdsModel & { id: string; uid: string; organizationId: string; stage?: string; createdAt?: any; updatedAt?: any },
  leadId?: string
): CreateLeadInput {
  const businessType = determineBusinessType({
    vehicle: metaLead.vehicle,
    homeListing: metaLead.homeListing,
    campaignName: metaLead.campaignName
  });

  const sourceData: MetaAdsData = {
    type: 'meta_ads',
    campaignId: metaLead.campaignId,
    campaignName: metaLead.campaignName,
    adSetId: metaLead.adSetId,
    adSetName: metaLead.adSetName,
    adName: metaLead.adName,
    formId: metaLead.formId,
    platformId: metaLead.platformId,
    partnerName: cleanString(metaLead.partnerName) || undefined,
    isOrganic: metaLead.isOrganic === 'true' || metaLead.isOrganic === true,
    customResponses: cleanString(metaLead.customDisclaimerResponses) || undefined,
    retailerItemId: cleanString(metaLead.retailerItemId) || undefined,
    dateCreated: cleanString(metaLead.dateCreated) || undefined
  };

  const interests = {
    vehicle: metaLead.vehicle && metaLead.vehicle.trim() !== '' ? {
      type: metaLead.vehicle
    } : undefined,
    property: metaLead.homeListing && metaLead.homeListing.trim() !== '' ? {
      location: metaLead.homeListing
    } : undefined,
    visitRequested: metaLead.visitRequest === 'yes'
  };

  // Build notes from Meta data
  const notesParts: string[] = [];
  if (metaLead.vehicle) notesParts.push(`Vehículo de Interés: ${metaLead.vehicle}`);
  if (metaLead.homeListing) notesParts.push(`Propiedad de Interés: ${metaLead.homeListing}`);
  if (metaLead.visitRequest === 'yes') notesParts.push('🏠 Solicita visita');
  if (metaLead.customDisclaimerResponses) notesParts.push(`Respuestas: ${metaLead.customDisclaimerResponses}`);
  if (metaLead.partnerName) notesParts.push(`Partner: ${metaLead.partnerName}`);
  
  const notes = notesParts.length > 0 ? notesParts.join('\n') : undefined;

  return {
    leadId: leadId || metaLead.leadId || metaLead.id,
    sourceId: metaLead.id,
    fullName: metaLead.fullName || 'Sin nombre',
    email: cleanString(metaLead.email),
    phone: cleanString(metaLead.phoneNumber),
    company: cleanString(metaLead.companyName),
    businessType,
    interests,
    stage: mapLeadStage(metaLead.stage),
    source: LeadSource.META_ADS,
    status: LeadStatus.ACTIVE,
    sourceData,
    notes,
    sourceCreatedAt: parseDate(metaLead.dateCreated),
    uid: metaLead.uid,
    organizationId: metaLead.organizationId,
    metadata: {
      version: '1.0',
      stageHistory: metaLead.stage ? [{
        toStage: mapLeadStage(metaLead.stage),
        changedBy: metaLead.uid,
        changedAt: parseDate(metaLead.createdAt) || new Date().toISOString(),
        reason: 'Lead creation'
      }] : []
    }
  };
}

/**
 * Maps from ExtendedLead to UnifiedLead
 */
export function mapExtendedLeadToUnified(
  extendedLead: ExtendedLead
): CreateLeadInput {
  const businessType = determineBusinessType({
    businessType: extendedLead.businessType || undefined,
    campaignName: extendedLead.campaignName,
    vehicle: extendedLead.vehicle,
    homeListing: extendedLead.homeListing
  });

  // Determine source data based on source
  let sourceData: any;
  const sourceType = mapLeadSource(extendedLead.source);

  if (sourceType === LeadSource.META_ADS && extendedLead.campaignName) {
    sourceData = {
      type: 'meta_ads',
      campaignId: extendedLead.campaignId || '',
      campaignName: extendedLead.campaignName,
      adSetId: extendedLead.adSetId || '',
      adSetName: extendedLead.adSetName || '',
      adName: extendedLead.adName || '',
      formId: extendedLead.formId || '',
      platformId: extendedLead.platformId || '',
      partnerName: extendedLead.partnerName,
      isOrganic: extendedLead.isOrganic === 'true',
      customResponses: extendedLead.customDisclaimerResponses,
      retailerItemId: extendedLead.retailerItemId,
      dateCreated: extendedLead.dateCreated
    };
  } else if (sourceType === LeadSource.GOOGLE_PLACES && extendedLead.placeId) {
    sourceData = {
      type: 'google_places',
      placeId: extendedLead.placeId
    };
  } else if (sourceType === LeadSource.XML_IMPORT || sourceType === LeadSource.CSV_IMPORT) {
    sourceData = {
      type: 'import',
      importType: sourceType === LeadSource.XML_IMPORT ? 'xml' : 'csv',
      fileName: 'imported_lead',
      importedAt: parseDate(extendedLead.createdAt) || new Date().toISOString()
    };
  } else {
    sourceData = {
      type: 'manual',
      createdBy: extendedLead.uid,
      source: extendedLead.source
    };
  }

  const interests = {
    vehicle: extendedLead.vehicle && extendedLead.vehicle.trim() !== '' ? {
      type: extendedLead.vehicle
    } : undefined,
    property: extendedLead.homeListing && extendedLead.homeListing.trim() !== '' ? {
      location: extendedLead.homeListing
    } : undefined,
    visitRequested: extendedLead.visitRequest === 'yes'
  };

  return {
    leadId: extendedLead.leadId || extendedLead.id,
    sourceId: extendedLead.id,
    fullName: extendedLead.name || extendedLead.fullName || 'Sin nombre',
    email: cleanString(extendedLead.email),
    phone: cleanString(extendedLead.phone || extendedLead.phoneNumber),
    company: cleanString(extendedLead.company || extendedLead.companyName),
    address: extendedLead.address ? {
      formatted: extendedLead.address
    } : undefined,
    website: cleanString(extendedLead.website),
    businessType,
    interests,
    stage: mapLeadStage(extendedLead.stage),
    source: sourceType,
    status: LeadStatus.ACTIVE,
    sourceData,
    notes: cleanString(extendedLead.notes),
    sourceCreatedAt: parseDate(extendedLead.dateCreated),
    uid: extendedLead.uid,
    organizationId: extendedLead.organizationId,
    metadata: {
      version: '1.0',
      images: extendedLead.images || []
    }
  };
}

/**
 * Maps from LeadsFlowModel to UnifiedLead
 */
export function mapLeadsFlowToUnified(
  flowLead: LeadsFlowModel & { id: string; createdAt?: any; updatedAt?: any }
): CreateLeadInput {
  const businessType = determineBusinessType({
    businessType: flowLead.businessType || undefined,
    campaignName: flowLead.campaignName
  });

  // Create source data based on available information
  let sourceData: any;
  if (flowLead.campaignName) {
    sourceData = {
      type: 'meta_ads',
      campaignId: flowLead.campaignId || '',
      campaignName: flowLead.campaignName,
      adSetId: flowLead.adSetId || '',
      adSetName: flowLead.adSetName || '',
      adName: flowLead.adName || '',
      formId: flowLead.formId || '',
      platformId: flowLead.platformId || '',
      partnerName: flowLead.partnerName,
      isOrganic: flowLead.isOrganic === 'true' || flowLead.isOrganic === true
    };
  } else {
    sourceData = {
      type: 'manual',
      createdBy: flowLead.uid,
      source: flowLead.source || 'leads-flow'
    };
  }

  return {
    leadId: flowLead.sourceLeadId || flowLead.id,
    sourceId: flowLead.id,
    fullName: flowLead.fullName || flowLead.name || 'Sin nombre',
    email: cleanString(flowLead.email),
    phone: cleanString(flowLead.phoneNumber),
    company: cleanString(flowLead.companyName),
    address: flowLead.address ? {
      formatted: flowLead.address,
      city: flowLead.city,
      state: flowLead.state,
      zipCode: flowLead.zipCode,
      country: flowLead.country
    } : undefined,
    website: cleanString(flowLead.website),
    businessType,
    stage: mapLeadStage(flowLead.currentStage),
    source: mapLeadSource(flowLead.source),
    status: flowLead.flowStatus === 'active' ? LeadStatus.ACTIVE : LeadStatus.INACTIVE,
    estimatedValue: cleanNumber(flowLead.estimatedValue),
    closeProbability: cleanNumber(flowLead.closeProbability),
    expectedCloseDate: parseDate(flowLead.expectedCloseDate),
    leadScore: cleanNumber(flowLead.leadScore),
    engagementScore: cleanNumber(flowLead.engagementScore),
    responseRate: cleanNumber(flowLead.responseRate),
    lastContactDate: parseDate(flowLead.lastContactDate),
    nextFollowUpDate: parseDate(flowLead.nextFollowUpDate),
    communicationCount: cleanNumber(flowLead.communicationCount),
    assignedTo: cleanString(flowLead.assignedTo),
    assignedDate: parseDate(flowLead.assignedDate),
    sourceData,
    uid: flowLead.uid,
    organizationId: flowLead.organizationId,
    metadata: {
      version: '1.0',
      tags: flowLead.tags || [],
      customFields: flowLead.customFields || {},
      stageHistory: flowLead.stageHistory || [],
      communicationHistory: flowLead.communicationHistory || []
    }
  };
}

// === REVERSE MAPPERS (UnifiedLead to existing formats) ===

/**
 * Maps from UnifiedLead to ExtendedLead for UI compatibility
 */
export function mapUnifiedToExtended(unifiedLead: UnifiedLead): ExtendedLead {
  const metaData = unifiedLead.sourceData.type === 'meta_ads' ? unifiedLead.sourceData as MetaAdsData : null;

  return {
    id: unifiedLead.id,
    uid: unifiedLead.uid,
    organizationId: unifiedLead.organizationId,
    stage: unifiedLead.stage,
    source: unifiedLead.source,
    images: unifiedLead.metadata.images || [],
    featured_image_url: unifiedLead.metadata.images?.find(img => img.is_featured)?.secure_url,
    
    // Core fields
    name: unifiedLead.fullName,
    fullName: unifiedLead.fullName,
    email: unifiedLead.email || '',
    phone: unifiedLead.phone || '',
    phoneNumber: unifiedLead.phone || '',
    company: unifiedLead.company || '',
    companyName: unifiedLead.company || '',
    address: unifiedLead.address?.formatted || null,
    website: unifiedLead.website || null,
    businessType: unifiedLead.businessType || null,
    notes: unifiedLead.notes || null,
    placeId: unifiedLead.sourceData.type === 'google_places' ? unifiedLead.sourceData.placeId : null,
    
    // Meta Ads specific fields (if available)
    campaignName: metaData?.campaignName || '',
    campaignId: metaData?.campaignId || '',
    adSetName: metaData?.adSetName || '',
    adSetId: metaData?.adSetId || '',
    adName: metaData?.adName || '',
    formId: metaData?.formId || '',
    platformId: metaData?.platformId || '',
    partnerName: metaData?.partnerName || '',
    isOrganic: metaData?.isOrganic ? 'true' : 'false',
    customDisclaimerResponses: metaData?.customResponses || '',
    retailerItemId: metaData?.retailerItemId || '',
    leadId: unifiedLead.leadId,
    dateCreated: metaData?.dateCreated || unifiedLead.sourceCreatedAt || unifiedLead.createdAt,
    updatedAt: unifiedLead.updatedAt,
    vehicle: unifiedLead.interests?.vehicle?.type || '',
    homeListing: unifiedLead.interests?.property?.location || '',
    visitRequest: unifiedLead.interests?.visitRequested ? 'yes' : 'no',
    
    // Timestamps
    createdAt: unifiedLead.createdAt
  };
}

// === VALIDATION HELPERS ===

/**
 * Validates and creates a unified lead from any source
 */
export function createUnifiedLeadFromSource(
  sourceData: any,
  sourceType: 'meta' | 'extended' | 'flow'
): { success: boolean; data?: CreateLeadInput; error?: string } {
  try {
    let mapped: CreateLeadInput;

    switch (sourceType) {
      case 'meta':
        mapped = mapMetaLeadToUnified(sourceData);
        break;
      case 'extended':
        mapped = mapExtendedLeadToUnified(sourceData);
        break;
      case 'flow':
        mapped = mapLeadsFlowToUnified(sourceData);
        break;
      default:
        return { success: false, error: 'Tipo de fuente no soportado' };
    }

    const validation = validateCreateLeadInput(mapped);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    return { success: true, data: validation.data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error en el mapeo de datos' };
  }
}

// === BULK MAPPING FUNCTIONS ===

/**
 * Maps multiple Meta leads to unified format
 */
export function mapMultipleMetaLeadsToUnified(
  metaLeads: (MetaLeadAdsModel & { id: string; uid: string; organizationId: string })[]
): { success: CreateLeadInput[]; errors: Array<{ index: number; error: string }> } {
  const success: CreateLeadInput[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  metaLeads.forEach((lead, index) => {
    try {
      const mapped = mapMetaLeadToUnified(lead);
      const validation = validateCreateLeadInput(mapped);
      
      if (validation.success) {
        success.push(validation.data);
      } else {
        errors.push({ index, error: validation.error || 'Error de validación' });
      }
    } catch (error: any) {
      errors.push({ index, error: error.message || 'Error de mapeo' });
    }
  });

  return { success, errors };
}

export {
  determineBusinessType,
  mapLeadStage,
  mapLeadSource,
  cleanString,
  cleanNumber,
  parseDate
};