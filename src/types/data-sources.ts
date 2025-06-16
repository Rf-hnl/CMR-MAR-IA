// Unified data sources configuration
export enum DataSource {
  META_ADS = 'meta-ads',
  FILE_IMPORT = 'file-import',
  MANUAL = 'manual'
}

export const DATA_SOURCE_CONFIG = {
  [DataSource.META_ADS]: {
    name: 'Meta Ads',
    description: 'Leads de Facebook e Instagram Ads',
    collection: 'meta-lead-ads',
    color: 'bg-blue-900/20 text-blue-300 border-blue-600',
    icon: '📘',
    fields: ['fullName', 'email', 'phoneNumber', 'campaignName', 'adName', 'platform'],
    autoSync: true
  },
  [DataSource.FILE_IMPORT]: {
    name: 'CSV/JSON/XML',
    description: 'Leads importados desde archivos CSV/JSON/XML',
    collection: 'imported-leads',
    color: 'bg-purple-900/20 text-purple-300 border-purple-600', 
    icon: '📄',
    fields: ['name', 'email', 'phone', 'company', 'source', 'fileType'],
    autoSync: false
  },
  [DataSource.MANUAL]: {
    name: 'Manual',
    description: 'Leads creados manualmente',
    collection: 'manual-leads',
    color: 'bg-gray-800 text-gray-300 border-gray-600',
    icon: '✍️', 
    fields: ['name', 'email', 'phone', 'company', 'notes'],
    autoSync: false
  }
} as const;

// Lead flow stages
export const LEAD_FLOW_STAGES = [
  'Nuevo',
  'Contactado', 
  'Calificado',
  'Propuesta Enviada',
  'Negociación',
  'Ganado',
  'Perdido'
] as const;

export type LeadFlowStage = typeof LEAD_FLOW_STAGES[number];

export const LEAD_STAGE_CONFIG = {
  'Nuevo': {
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Lead recién ingresado, sin contacto inicial',
    icon: '🆕',
    isActive: true
  },
  'Contactado': {
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    description: 'Primer contacto realizado, esperando respuesta',
    icon: '📞',
    isActive: true
  },
  'Calificado': {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Lead calificado, muestra interés y potencial',
    icon: '✅',
    isActive: true
  },
  'Propuesta Enviada': {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Propuesta comercial enviada, en evaluación',
    icon: '📋',
    isActive: true
  },
  'Negociación': {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'En proceso de negociación activa',
    icon: '🤝',
    isActive: true
  },
  'Ganado': {
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Venta cerrada exitosamente',
    icon: '🎉',
    isActive: false
  },
  'Perdido': {
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Oportunidad perdida o lead descalificado',
    icon: '❌',
    isActive: false
  }
} as const;

// Unified lead interface for data unification
export interface UnifiedLead {
  id: string;
  source: DataSource;
  sourceId: string; // Original ID in source collection
  
  // Core fields (common across all sources)
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  
  // Source-specific data (preserved as JSON)
  sourceData: Record<string, any>;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  uid: string;
  
  // Transfer status
  transferredToFlow: boolean;
  flowLeadId?: string;
  transferredAt?: string;
}

// Stats interface for data source overview
export interface DataSourceStats {
  source: DataSource;
  total: number;
  transferred: number;
  pending: number;
  lastSync?: string;
  isActive: boolean;
}