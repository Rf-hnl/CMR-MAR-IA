export enum LeadSource {
  META_ADS = 'meta_ads',
  GOOGLE_PLACES = 'google_places',
  XML_IMPORT = 'xml_import',
  CSV_IMPORT = 'csv_import',
  MANUAL = 'manual'
}

export const LEAD_SOURCE_COLORS = {
  [LeadSource.META_ADS]: 'bg-blue-900/20 text-blue-300 border-blue-600',
  [LeadSource.GOOGLE_PLACES]: 'bg-green-900/20 text-green-300 border-green-600',
  [LeadSource.XML_IMPORT]: 'bg-purple-900/20 text-purple-300 border-purple-600',
  [LeadSource.CSV_IMPORT]: 'bg-orange-900/20 text-orange-300 border-orange-600',
  [LeadSource.MANUAL]: 'bg-gray-800 text-gray-300 border-gray-600'
} as const;

export const LEAD_SOURCE_LABELS = {
  [LeadSource.META_ADS]: 'Meta Ads',
  [LeadSource.GOOGLE_PLACES]: 'Google Places',
  [LeadSource.XML_IMPORT]: 'XML Import',
  [LeadSource.CSV_IMPORT]: 'CSV Import',
  [LeadSource.MANUAL]: 'Manual'
} as const;

export function getLeadSourceFromString(source: string): LeadSource {
  switch (source) {
    case 'meta_ads':
    case 'meta_lead_ads':
    case 'facebook_ads':
    case 'instagram_ads':
      return LeadSource.META_ADS;
    case 'google_places':
    case 'google_places_search':
    case 'google_places_search_local_fallback':
      return LeadSource.GOOGLE_PLACES;
    case 'xml_import_ia':
      return LeadSource.XML_IMPORT;
    case 'csv_import_ia':
      return LeadSource.CSV_IMPORT;
    default:
      return LeadSource.MANUAL;
  }
}