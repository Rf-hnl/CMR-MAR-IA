import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';
import { LeadSource } from './lead-sources';

export interface BaseLeadData {
  uid: string;
  organizationId: string;
  source: LeadSource;
  // Common fields that all lead sources should have
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  // Optional fields
  address?: string;
  website?: string;
  notes?: string;
  businessType?: string;
}

export interface FormatterResult {
  success: boolean;
  data?: MetaLeadAdsModel;
  error?: string;
}

export abstract class BaseLeadFormatter {
  protected uid: string;
  protected organizationId: string;
  protected source: LeadSource;

  constructor(uid: string, organizationId: string, source: LeadSource) {
    this.uid = uid;
    this.organizationId = organizationId;
    this.source = source;
  }

  abstract format(data: any): FormatterResult;

  protected generateLeadId(): string {
    return `${this.source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  protected createBaseMetaLead(baseData: BaseLeadData): MetaLeadAdsModel {
    const timestamp = this.getCurrentTimestamp();
    
    return {
      adName: this.generateAdName(baseData),
      adSetId: this.generateAdSetId(),
      adSetName: this.generateAdSetName(baseData),
      campaignId: this.generateCampaignId(),
      campaignName: this.generateCampaignName(baseData),
      companyName: baseData.company || baseData.name || 'Sin empresa',
      customDisclaimerResponses: baseData.notes || '',
      dateCreated: timestamp,
      email: baseData.email || '',
      formId: `form_${this.source}_${Date.now()}`,
      fullName: baseData.name || 'Sin nombre',
      homeListing: this.extractHomeListing(baseData),
      isOrganic: this.source === LeadSource.META_ADS ? 'false' : 'true',
      leadId: this.generateLeadId(),
      partnerName: this.getPartnerName(),
      phoneNumber: baseData.phone || '',
      platformId: this.getPlatformId(),
      retailerItemId: this.generateRetailerItemId(),
      updatedAt: timestamp,
      vehicle: this.extractVehicle(baseData),
      visitRequest: this.extractVisitRequest(baseData)
    };
  }

  private generateAdName(baseData: BaseLeadData): string {
    return `${this.source.toUpperCase()}_${baseData.businessType || 'General'}_Lead`;
  }

  private generateAdSetId(): string {
    return `adset_${this.source}_${Date.now()}`;
  }

  private generateAdSetName(baseData: BaseLeadData): string {
    return `${this.source.toUpperCase()} - ${baseData.businessType || 'General'}`;
  }

  private generateCampaignId(): string {
    return `campaign_${this.source}_${Date.now()}`;
  }

  private generateCampaignName(baseData: BaseLeadData): string {
    return `${this.source.toUpperCase()} Campaign - ${baseData.businessType || 'General'}`;
  }

  private extractHomeListing(baseData: BaseLeadData): string {
    if (baseData.businessType?.toLowerCase().includes('inmobilia')) {
      return baseData.address || baseData.company || '';
    }
    return '';
  }

  private extractVehicle(baseData: BaseLeadData): string {
    if (baseData.businessType?.toLowerCase().includes('auto')) {
      return baseData.businessType || 'Vehículo general';
    }
    return '';
  }

  private extractVisitRequest(baseData: BaseLeadData): string {
    if (baseData.notes?.toLowerCase().includes('visita') || 
        baseData.notes?.toLowerCase().includes('cita')) {
      return 'yes';
    }
    return 'no';
  }

  private getPartnerName(): string {
    switch (this.source) {
      case LeadSource.GOOGLE_PLACES:
        return 'Google Places API';
      case LeadSource.XML_IMPORT:
        return 'XML Import System';
      case LeadSource.CSV_IMPORT:
        return 'CSV Import System';
      case LeadSource.MANUAL:
        return 'Manual Entry';
      default:
        return 'Meta Ads';
    }
  }

  private getPlatformId(): string {
    switch (this.source) {
      case LeadSource.META_ADS:
        return 'facebook_instagram';
      case LeadSource.GOOGLE_PLACES:
        return 'google_places';
      case LeadSource.XML_IMPORT:
        return 'xml_system';
      case LeadSource.CSV_IMPORT:
        return 'csv_system';
      default:
        return 'manual_system';
    }
  }

  private generateRetailerItemId(): string {
    return `item_${this.source}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
}