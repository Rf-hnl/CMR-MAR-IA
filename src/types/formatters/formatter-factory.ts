import { GooglePlacesFormatter, type GooglePlacesLeadData } from './google-places-formatter';
import { XmlImportFormatter, CsvImportFormatter, type ImportLeadData } from './import-formatter';
import { LeadSource, getLeadSourceFromString } from './lead-sources';
import type { FormatterResult } from './base-formatter';

export class LeadFormatterFactory {
  static createFormatter(source: LeadSource | string, uid: string, organizationId: string) {
    const normalizedSource = typeof source === 'string' ? getLeadSourceFromString(source) : source;
    
    switch (normalizedSource) {
      case LeadSource.GOOGLE_PLACES:
        return new GooglePlacesFormatter(uid, organizationId);
      case LeadSource.XML_IMPORT:
        return new XmlImportFormatter(uid, organizationId);
      case LeadSource.CSV_IMPORT:
        return new CsvImportFormatter(uid, organizationId);
      default:
        throw new Error(`Formatter no soportado para fuente: ${normalizedSource}`);
    }
  }

  static formatLead(
    source: LeadSource | string, 
    data: GooglePlacesLeadData | ImportLeadData, 
    uid: string, 
    organizationId: string
  ): FormatterResult {
    try {
      const formatter = this.createFormatter(source, uid, organizationId);
      return formatter.format(data);
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static formatGooglePlacesLead(
    data: GooglePlacesLeadData, 
    uid: string, 
    organizationId: string
  ): FormatterResult {
    return this.formatLead(LeadSource.GOOGLE_PLACES, data, uid, organizationId);
  }

  static formatXmlImportLead(
    data: ImportLeadData, 
    uid: string, 
    organizationId: string
  ): FormatterResult {
    return this.formatLead(LeadSource.XML_IMPORT, data, uid, organizationId);
  }

  static formatCsvImportLead(
    data: ImportLeadData, 
    uid: string, 
    organizationId: string
  ): FormatterResult {
    return this.formatLead(LeadSource.CSV_IMPORT, data, uid, organizationId);
  }
}

export * from './lead-sources';
export * from './base-formatter';
export * from './google-places-formatter';
export * from './import-formatter';