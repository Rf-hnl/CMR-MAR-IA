import { BaseLeadFormatter, type FormatterResult, type BaseLeadData } from './base-formatter';
import { LeadSource } from './lead-sources';

export interface ImportLeadData {
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  contact?: string;
  company?: string;
  companyName?: string;
  address?: string;
  location?: string;
  website?: string;
  notes?: string;
  category?: string;
  businessType?: string;
  suggestedStage?: string;
  // Campos adicionales que pueden venir del AI processing
  [key: string]: any;
}

export class XmlImportFormatter extends BaseLeadFormatter {
  constructor(uid: string, organizationId: string) {
    super(uid, organizationId, LeadSource.XML_IMPORT);
  }

  format(data: ImportLeadData): FormatterResult {
    try {
      const baseData = this.extractBaseData(data);
      
      if (!baseData.name && !baseData.email && !baseData.phone) {
        return {
          success: false,
          error: 'Se requiere al menos nombre, email o teléfono para importar el lead'
        };
      }

      const metaLead = this.createBaseMetaLead(baseData);
      
      // Sobrescribir campos específicos para XML
      metaLead.customDisclaimerResponses = this.buildCustomResponses(data);
      metaLead.partnerName = 'XML Import System';
      metaLead.isOrganic = 'true';
      metaLead.formId = `xml_form_${Date.now()}`;

      return {
        success: true,
        data: metaLead
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error al formatear lead de XML: ${error.message}`
      };
    }
  }

  private extractBaseData(data: ImportLeadData): BaseLeadData {
    return {
      uid: this.uid,
      organizationId: this.organizationId,
      source: this.source,
      name: data.name || data.fullName || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || data.phoneNumber || data.contact || '',
      company: data.company || data.companyName || data.name || '',
      address: data.address || data.location || '',
      website: data.website || '',
      businessType: data.category || data.businessType || 'General',
      notes: this.buildImportNotes(data)
    };
  }

  private buildImportNotes(data: ImportLeadData): string {
    const notes: string[] = [];
    
    notes.push('Lead importado desde archivo XML');
    
    if (data.suggestedStage) {
      notes.push(`Etapa Sugerida por IA: ${data.suggestedStage}`);
    }
    
    // Agregar campos adicionales que no están en el modelo base
    Object.keys(data).forEach(key => {
      if (!['name', 'fullName', 'email', 'phone', 'phoneNumber', 'contact', 
            'company', 'companyName', 'address', 'location', 'website', 
            'category', 'businessType', 'notes', 'suggestedStage'].includes(key)) {
        if (data[key] && data[key] !== '') {
          notes.push(`${key}: ${data[key]}`);
        }
      }
    });
    
    notes.push(`Fecha de Importación: ${new Date().toLocaleDateString('es-ES')}`);
    
    return notes.join('\n');
  }

  private buildCustomResponses(data: ImportLeadData): string {
    const responses: string[] = [];
    
    if (data.category) {
      responses.push(`Categoría: ${data.category}`);
    }
    
    if (data.suggestedStage) {
      responses.push(`Etapa IA: ${data.suggestedStage}`);
    }
    
    if (data.notes) {
      responses.push(`Notas Originales: ${data.notes}`);
    }
    
    return responses.join(' | ');
  }
}

export class CsvImportFormatter extends BaseLeadFormatter {
  constructor(uid: string, organizationId: string) {
    super(uid, organizationId, LeadSource.CSV_IMPORT);
  }

  format(data: ImportLeadData): FormatterResult {
    try {
      const baseData = this.extractBaseData(data);
      
      if (!baseData.name && !baseData.email && !baseData.phone) {
        return {
          success: false,
          error: 'Se requiere al menos nombre, email o teléfono para importar el lead'
        };
      }

      const metaLead = this.createBaseMetaLead(baseData);
      
      // Sobrescribir campos específicos para CSV
      metaLead.customDisclaimerResponses = this.buildCustomResponses(data);
      metaLead.partnerName = 'CSV Import System';
      metaLead.isOrganic = 'true';
      metaLead.formId = `csv_form_${Date.now()}`;

      return {
        success: true,
        data: metaLead
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error al formatear lead de CSV: ${error.message}`
      };
    }
  }

  private extractBaseData(data: ImportLeadData): BaseLeadData {
    return {
      uid: this.uid,
      organizationId: this.organizationId,
      source: this.source,
      name: data.name || data.fullName || 'Sin nombre',
      email: data.email || '',
      phone: data.phone || data.phoneNumber || data.contact || '',
      company: data.company || data.companyName || data.name || '',
      address: data.address || data.location || '',
      website: data.website || '',
      businessType: data.category || data.businessType || 'General',
      notes: this.buildImportNotes(data)
    };
  }

  private buildImportNotes(data: ImportLeadData): string {
    const notes: string[] = [];
    
    notes.push('Lead importado desde archivo CSV');
    
    if (data.suggestedStage) {
      notes.push(`Etapa Sugerida por IA: ${data.suggestedStage}`);
    }
    
    // Agregar campos adicionales
    Object.keys(data).forEach(key => {
      if (!['name', 'fullName', 'email', 'phone', 'phoneNumber', 'contact', 
            'company', 'companyName', 'address', 'location', 'website', 
            'category', 'businessType', 'notes', 'suggestedStage'].includes(key)) {
        if (data[key] && data[key] !== '') {
          notes.push(`${key}: ${data[key]}`);
        }
      }
    });
    
    notes.push(`Fecha de Importación: ${new Date().toLocaleDateString('es-ES')}`);
    
    return notes.join('\n');
  }

  private buildCustomResponses(data: ImportLeadData): string {
    const responses: string[] = [];
    
    if (data.category) {
      responses.push(`Categoría: ${data.category}`);
    }
    
    if (data.suggestedStage) {
      responses.push(`Etapa IA: ${data.suggestedStage}`);
    }
    
    if (data.notes) {
      responses.push(`Notas Originales: ${data.notes}`);
    }
    
    return responses.join(' | ');
  }
}