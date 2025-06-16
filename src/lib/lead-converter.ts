import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';
import type { ExtendedLead } from '@/types';
import { getLeadSourceFromString, LEAD_SOURCE_LABELS, LeadSource } from '@/types/formatters/formatter-factory';

export function convertMetaLeadToExtended(
  metaLead: MetaLeadAdsModel & { id: string },
  uid: string,
  organizationId: string,
  stage?: string
): ExtendedLead {
  // Analyze the lead to determine source and business type
  const source = determineLeadSource(metaLead);
  const businessType = determineBusinessType(metaLead);
  const address = determineAddress(metaLead);
  const website = extractWebsite(metaLead);
  const notes = buildNotes(metaLead);

  return {
    // Core MetaLeadAdsModel fields
    ...metaLead,
    
    // Extended fields
    id: metaLead.id,
    uid,
    organizationId,
    stage: (stage as any) || 'Nuevo',
    source: LEAD_SOURCE_LABELS[getLeadSourceFromString(source)],
    
    // Computed fields for backward compatibility
    name: metaLead.fullName || 'Sin nombre',
    email: metaLead.email || '',
    phone: metaLead.phoneNumber || '',
    company: metaLead.companyName || metaLead.fullName || '',
    address,
    website,
    businessType,
    notes,
    placeId: source === 'google-places' ? metaLead.platformId : null,
    
    // UI fields
    images: [],
    featured_image_url: undefined
  };
}

export function convertExtendedToMeta(extendedLead: ExtendedLead): MetaLeadAdsModel {
  // Extract only MetaLeadAdsModel fields
  const {
    id, uid, organizationId, stage, source, images, featured_image_url,
    name, phone, company, address, website, businessType, notes, placeId,
    ...metaFields
  } = extendedLead;

  return {
    ...metaFields,
    // Ensure required fields are present
    fullName: extendedLead.fullName || name || 'Sin nombre',
    email: extendedLead.email || '',
    phoneNumber: extendedLead.phoneNumber || phone || '',
    companyName: extendedLead.companyName || company || '',
    customDisclaimerResponses: extendedLead.customDisclaimerResponses || notes || '',
  };
}

function determineLeadSource(metaLead: MetaLeadAdsModel): string {
  // Analyze partner name and platform ID to determine original source
  if (metaLead.partnerName?.includes('Google')) {
    return 'google-places';
  }
  if (metaLead.partnerName?.includes('XML')) {
    return 'xml-import';
  }
  if (metaLead.partnerName?.includes('CSV')) {
    return 'csv-import';
  }
  
  // Check multiple indicators for Meta Ads
  if (metaLead.isOrganic === 'false' || 
      metaLead.campaignId ||
      metaLead.campaignName ||
      metaLead.adSetId ||
      metaLead.adSetName ||
      metaLead.adName ||
      metaLead.formId ||
      metaLead.partnerName?.toLowerCase().includes('meta') ||
      metaLead.partnerName?.toLowerCase().includes('facebook') ||
      metaLead.partnerName?.toLowerCase().includes('instagram')) {
    return 'meta-ads';
  }
  
  return 'manual';
}

function determineBusinessType(metaLead: MetaLeadAdsModel): string | null {
  // Extract business type from campaign name, vehicle, or home listing
  if (metaLead.vehicle && metaLead.vehicle !== '') {
    return 'Automotriz';
  }
  if (metaLead.homeListing && metaLead.homeListing !== '') {
    return 'Inmobiliaria';
  }
  
  if (metaLead.campaignName) {
    const campaign = metaLead.campaignName.toLowerCase();
    if (campaign.includes('auto') || campaign.includes('car') || campaign.includes('vehicle')) {
      return 'Automotriz';
    }
    if (campaign.includes('real estate') || campaign.includes('home') || campaign.includes('inmobili')) {
      return 'Inmobiliaria';
    }
    if (campaign.includes('restaurant') || campaign.includes('food')) {
      return 'Restaurante';
    }
    if (campaign.includes('health') || campaign.includes('medical') || campaign.includes('salud')) {
      return 'Salud';
    }
  }
  
  return 'General';
}

// Export this function so it can be used elsewhere
export function getBusinessTypeFromMetaLead(metaLead: MetaLeadAdsModel): string {
  return determineBusinessType(metaLead) || 'General';
}

function determineAddress(metaLead: MetaLeadAdsModel): string | null {
  // Try to extract address from home listing or custom responses
  if (metaLead.homeListing && metaLead.homeListing !== '') {
    return metaLead.homeListing;
  }
  
  // Check if custom disclaimer responses contain address-like information
  if (metaLead.customDisclaimerResponses) {
    const responses = metaLead.customDisclaimerResponses;
    if (responses.includes('Dirección:') || responses.includes('Address:')) {
      const addressMatch = responses.match(/(?:Dirección|Address):\s*([^|]+)/);
      if (addressMatch) {
        return addressMatch[1].trim();
      }
    }
  }
  
  return null;
}

function extractWebsite(metaLead: MetaLeadAdsModel): string | null {
  // Check custom disclaimer responses for website
  if (metaLead.customDisclaimerResponses) {
    const responses = metaLead.customDisclaimerResponses;
    if (responses.includes('Website:') || responses.includes('Sitio:')) {
      const websiteMatch = responses.match(/(?:Website|Sitio):\s*([^|\s]+)/);
      if (websiteMatch) {
        return websiteMatch[1].trim();
      }
    }
  }
  
  return null;
}

function buildNotes(metaLead: MetaLeadAdsModel): string | null {
  const notes: string[] = [];
  
  // Add campaign information
  if (metaLead.campaignName) {
    notes.push(`Campaña: ${metaLead.campaignName}`);
  }
  
  if (metaLead.adSetName) {
    notes.push(`Conjunto de Anuncios: ${metaLead.adSetName}`);
  }
  
  if (metaLead.adName) {
    notes.push(`Anuncio: ${metaLead.adName}`);
  }
  
  // Add specific interests
  if (metaLead.vehicle) {
    notes.push(`Vehículo de Interés: ${metaLead.vehicle}`);
  }
  
  if (metaLead.homeListing) {
    notes.push(`Propiedad de Interés: ${metaLead.homeListing}`);
  }
  
  if (metaLead.visitRequest === 'yes') {
    notes.push('🏠 Solicita visita');
  }
  
  // Add partner information
  if (metaLead.partnerName) {
    notes.push(`Fuente: ${metaLead.partnerName}`);
  }
  
  // Add organic/paid information
  const leadType = metaLead.isOrganic === 'true' ? 'Orgánico' : 'Pagado';
  notes.push(`Tipo: ${leadType}`);
  
  // Add custom disclaimer responses if they exist and are different from what we've already included
  if (metaLead.customDisclaimerResponses && 
      !notes.some(note => note.includes(metaLead.customDisclaimerResponses))) {
    notes.push(`Información Adicional: ${metaLead.customDisclaimerResponses}`);
  }
  
  notes.push(`Fecha de Creación: ${metaLead.dateCreated}`);
  
  return notes.length > 0 ? notes.join('\n') : null;
}

export function getLeadSourceColor(source: string): string {
  const leadSource = getLeadSourceFromString(source);
  
  switch (leadSource) {
    case LeadSource.META_ADS:
      return 'bg-blue-900/20 text-blue-300 border-blue-600';
    case LeadSource.GOOGLE_PLACES:
      return 'bg-green-900/20 text-green-300 border-green-600';
    case LeadSource.XML_IMPORT:
      return 'bg-purple-900/20 text-purple-300 border-purple-600';
    case LeadSource.CSV_IMPORT:
      return 'bg-orange-900/20 text-orange-300 border-orange-600';
    default:
      return 'bg-gray-800 text-gray-300 border-gray-600';
  }
}

export function getLeadSourceIcon(source: string): string {
  const leadSource = getLeadSourceFromString(source);
  
  switch (leadSource) {
    case LeadSource.META_ADS:
      return '📘'; // Facebook/Meta icon
    case LeadSource.GOOGLE_PLACES:
      return '🌍'; // Google/Places icon
    case LeadSource.XML_IMPORT:
      return '📄'; // XML file icon
    case LeadSource.CSV_IMPORT:
      return '📊'; // CSV file icon
    default:
      return '✍️'; // Manual entry icon
  }
}