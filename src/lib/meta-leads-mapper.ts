import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';

export interface MappedMetaLead {
  uid: string;
  organizationId: string;
  placeId: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  company: string | null;
  businessType: string | null;
  source: string;
  stage: string;
  notes: string | null;
  // Meta Ads specific fields
  metaAdData?: {
    leadId: string;
    adName: string;
    adSetId: string;
    adSetName: string;
    campaignId: string;
    campaignName: string;
    formId: string;
    platformId: string;
    isOrganic: string;
    partnerName: string;
    vehicle: string;
    homeListing: string;
    visitRequest: string;
    customDisclaimerResponses: string;
    retailerItemId: string;
  };
  createdAt: any;
  updatedAt: any;
}

/**
 * Maps Meta Lead Ads data to standard Lead format
 */
export function mapMetaLeadToStandardLead(
  metaLead: MetaLeadAdsModel,
  uid: string,
  organizationId: string,
  timestamp: any
): MappedMetaLead {
  return {
    uid,
    organizationId,
    placeId: null, // Meta leads don't have Google Place IDs
    name: metaLead.fullName || 'Sin nombre',
    address: null, // Meta leads typically don't include address
    phone: metaLead.phoneNumber || null,
    website: null,
    email: metaLead.email || null,
    company: metaLead.companyName || null,
    businessType: determineBusinessTypeFromMetaData(metaLead),
    source: 'meta_lead_ads',
    stage: 'Nuevo',
    notes: buildNotesFromMetaData(metaLead),
    metaAdData: {
      leadId: metaLead.leadId,
      adName: metaLead.adName,
      adSetId: metaLead.adSetId,
      adSetName: metaLead.adSetName,
      campaignId: metaLead.campaignId,
      campaignName: metaLead.campaignName,
      formId: metaLead.formId,
      platformId: metaLead.platformId,
      isOrganic: metaLead.isOrganic,
      partnerName: metaLead.partnerName,
      vehicle: metaLead.vehicle,
      homeListing: metaLead.homeListing,
      visitRequest: metaLead.visitRequest,
      customDisclaimerResponses: metaLead.customDisclaimerResponses,
      retailerItemId: metaLead.retailerItemId,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Determines business type based on Meta lead data
 */
function determineBusinessTypeFromMetaData(metaLead: MetaLeadAdsModel): string | null {
  // Logic to determine business type based on campaign, ad, or vehicle data
  if (metaLead.vehicle && metaLead.vehicle !== '') {
    return 'Automotriz';
  }
  if (metaLead.homeListing && metaLead.homeListing !== '') {
    return 'Inmobiliaria';
  }
  if (metaLead.campaignName) {
    const campaignLower = metaLead.campaignName.toLowerCase();
    if (campaignLower.includes('auto') || campaignLower.includes('car')) return 'Automotriz';
    if (campaignLower.includes('real estate') || campaignLower.includes('home')) return 'Inmobiliaria';
    if (campaignLower.includes('service')) return 'Servicios';
    if (campaignLower.includes('retail')) return 'Retail';
  }
  return 'General';
}

/**
 * Builds notes field from Meta lead data
 */
function buildNotesFromMetaData(metaLead: MetaLeadAdsModel): string {
  const notes: string[] = [];
  
  notes.push(`Lead de Meta Ads - ID: ${metaLead.leadId}`);
  notes.push(`Campaña: ${metaLead.campaignName} (${metaLead.campaignId})`);
  notes.push(`Conjunto de Anuncios: ${metaLead.adSetName} (${metaLead.adSetId})`);
  notes.push(`Anuncio: ${metaLead.adName}`);
  
  if (metaLead.vehicle) {
    notes.push(`Vehículo de Interés: ${metaLead.vehicle}`);
  }
  
  if (metaLead.homeListing) {
    notes.push(`Propiedad de Interés: ${metaLead.homeListing}`);
  }
  
  if (metaLead.visitRequest && metaLead.visitRequest.toLowerCase() === 'yes') {
    notes.push('🏠 Solicita visita');
  }
  
  if (metaLead.customDisclaimerResponses) {
    notes.push(`Respuestas Adicionales: ${metaLead.customDisclaimerResponses}`);
  }
  
  if (metaLead.partnerName) {
    notes.push(`Partner: ${metaLead.partnerName}`);
  }
  
  const isOrganicText = metaLead.isOrganic.toLowerCase() === 'true' ? 'Orgánico' : 'Pagado';
  notes.push(`Tipo: ${isOrganicText}`);
  
  notes.push(`Fecha Original: ${metaLead.dateCreated}`);
  
  return notes.join('\n');
}

/**
 * Validates Meta Lead data
 */
export function validateMetaLead(metaLead: any): metaLead is MetaLeadAdsModel {
  return (
    typeof metaLead === 'object' &&
    metaLead !== null &&
    typeof metaLead.leadId === 'string' &&
    typeof metaLead.fullName === 'string' &&
    typeof metaLead.email === 'string' &&
    typeof metaLead.campaignName === 'string' &&
    typeof metaLead.adName === 'string'
  );
}