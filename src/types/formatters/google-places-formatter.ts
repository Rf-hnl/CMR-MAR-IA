import { BaseLeadFormatter, type FormatterResult, type BaseLeadData } from './base-formatter';
import { LeadSource } from './lead-sources';

export interface GooglePlacesLeadData {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  international_phone_number?: string;
  website?: string;
  types?: string[];
  rating?: number;
  business_status?: string;
}

export class GooglePlacesFormatter extends BaseLeadFormatter {
  constructor(uid: string, organizationId: string) {
    super(uid, organizationId, LeadSource.GOOGLE_PLACES);
  }

  format(data: GooglePlacesLeadData): FormatterResult {
    try {
      if (!data.place_id || !data.name) {
        return {
          success: false,
          error: 'place_id y name son requeridos para Google Places leads'
        };
      }

      const businessType = this.extractBusinessType(data.types);
      const notes = this.buildNotes(data);

      const baseData: BaseLeadData = {
        uid: this.uid,
        organizationId: this.organizationId,
        source: this.source,
        name: data.name,
        company: data.name,
        address: data.formatted_address || data.vicinity || null,
        phone: data.international_phone_number || null,
        website: data.website || null,
        businessType,
        notes,
        email: '' // Google Places no proporciona email
      };

      const metaLead = this.createBaseMetaLead(baseData);
      
      // Sobrescribir campos específicos de Google Places
      metaLead.customDisclaimerResponses = this.buildCustomDisclaimerResponses(data);
      metaLead.partnerName = 'Google Places API';
      metaLead.platformId = data.place_id;

      return {
        success: true,
        data: metaLead
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error al formatear lead de Google Places: ${error.message}`
      };
    }
  }

  private extractBusinessType(types?: string[]): string {
    if (!types || types.length === 0) return 'General';

    // Mapeo de tipos de Google Places a categorías de negocio
    const typeMapping: { [key: string]: string } = {
      'car_dealer': 'Automotriz',
      'car_rental': 'Automotriz',
      'car_repair': 'Automotriz',
      'gas_station': 'Automotriz',
      'real_estate_agency': 'Inmobiliaria',
      'restaurant': 'Restaurante',
      'food': 'Restaurante',
      'store': 'Retail',
      'shopping_mall': 'Retail',
      'hospital': 'Salud',
      'doctor': 'Salud',
      'school': 'Educación',
      'university': 'Educación',
      'gym': 'Fitness',
      'beauty_salon': 'Belleza',
      'lawyer': 'Servicios Legales',
      'accountant': 'Servicios Financieros',
      'bank': 'Servicios Financieros'
    };

    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type];
      }
    }

    // Si no hay mapeo específico, usar el primer tipo formateado
    return types[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private buildNotes(data: GooglePlacesLeadData): string {
    const notes: string[] = [];
    
    notes.push(`Lead de Google Places - Place ID: ${data.place_id}`);
    
    if (data.types && data.types.length > 0) {
      notes.push(`Tipos: ${data.types.join(', ')}`);
    }
    
    if (data.rating) {
      notes.push(`Rating: ${data.rating} estrellas`);
    }
    
    if (data.business_status) {
      notes.push(`Estado: ${data.business_status}`);
    }
    
    notes.push(`Fuente: Búsqueda Google Places`);
    notes.push(`Fecha de Captura: ${new Date().toLocaleDateString('es-ES')}`);
    
    return notes.join('\n');
  }

  private buildCustomDisclaimerResponses(data: GooglePlacesLeadData): string {
    const responses: string[] = [];
    
    if (data.types) {
      responses.push(`Tipo de Negocio: ${data.types.join(', ')}`);
    }
    
    if (data.rating) {
      responses.push(`Rating Google: ${data.rating}`);
    }
    
    if (data.business_status) {
      responses.push(`Estado del Negocio: ${data.business_status}`);
    }
    
    return responses.join(' | ');
  }
}