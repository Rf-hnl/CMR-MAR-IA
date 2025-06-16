// === UNIFIED LEAD SYSTEM ===
// Definición completa del sistema unificado de leads

import type { Timestamp } from 'firebase/firestore';

// === ENUMS ESTANDARIZADOS ===

export enum BusinessType {
  AUTOMOTIVE = 'automotive',
  REAL_ESTATE = 'real_estate', 
  RESTAURANT = 'restaurant',
  HEALTH = 'health',
  RETAIL = 'retail',
  SERVICES = 'services',
  TECHNOLOGY = 'technology',
  EDUCATION = 'education',
  FINANCE = 'finance',
  GENERAL = 'general'
}

export enum LeadSource {
  META_ADS = 'meta_ads',
  FACEBOOK_ADS = 'facebook_ads',
  INSTAGRAM_ADS = 'instagram_ads', 
  GOOGLE_ADS = 'google_ads',
  GOOGLE_PLACES = 'google_places',
  XML_IMPORT = 'xml_import',
  CSV_IMPORT = 'csv_import',
  MANUAL = 'manual',
  WEBSITE = 'website',
  REFERRAL = 'referral',
  LINKEDIN = 'linkedin',
  WHATSAPP = 'whatsapp'
}

export enum LeadStage {
  NEW = 'Nuevo',
  CONTACTED = 'Contactado',
  QUALIFIED = 'Calificado', 
  PROPOSAL_SENT = 'Propuesta Enviada',
  NEGOTIATION = 'Negociación',
  WON = 'Ganado',
  LOST = 'Perdido',
  PROSPECT = 'Prospecto',
  INTERESTED = 'Interesado',
  PROPOSAL = 'Propuesta',
  SOLD = 'Vendido'
}

export enum LeadStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum QualificationStatus {
  NOT_QUALIFIED = 'not_qualified',
  PARTIALLY_QUALIFIED = 'partially_qualified',
  QUALIFIED = 'qualified',
  HIGHLY_QUALIFIED = 'highly_qualified'
}

// === INTERFACES AUXILIARES ===

export interface ContactAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  formatted?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  whatsapp?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
}

export interface PriceRange {
  min?: number;
  max?: number;
  currency?: string;
}

export interface VehicleInterest {
  type?: string;
  brand?: string;
  model?: string;
  year?: number;
  priceRange?: PriceRange;
  condition?: 'new' | 'used' | 'any';
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'any';
}

export interface PropertyInterest {
  type?: 'house' | 'apartment' | 'commercial' | 'land' | 'office';
  location?: string;
  priceRange?: PriceRange;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  furnished?: boolean;
  parking?: boolean;
}

export interface ServiceInterest {
  category?: string;
  description?: string;
  urgency?: 'low' | 'medium' | 'high';
  budget?: PriceRange;
  timeline?: string;
}

export interface ProductInterest {
  category?: string;
  productName?: string;
  brand?: string;
  quantity?: number;
  budget?: PriceRange;
}

export interface LeadInterests {
  vehicle?: VehicleInterest;
  property?: PropertyInterest;
  service?: ServiceInterest;
  product?: ProductInterest;
  visitRequested?: boolean;
  consultationRequested?: boolean;
  demoRequested?: boolean;
  quoteRequested?: boolean;
}

// === SOURCE-SPECIFIC DATA ===

export interface MetaAdsData {
  type: 'meta_ads';
  campaignId: string;
  campaignName: string;
  adSetId: string;
  adSetName: string;
  adId?: string;
  adName: string;
  formId: string;
  platformId: string;
  partnerName?: string;
  isOrganic: boolean;
  customResponses?: string;
  retailerItemId?: string;
  dateCreated?: string; // Original Meta creation date
}

export interface GooglePlacesData {
  type: 'google_places';
  placeId: string;
  rating?: number;
  reviewCount?: number;
  categories?: string[];
  openingHours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: string[];
}

export interface ImportData {
  type: 'import';
  importType: 'csv' | 'xml';
  fileName: string;
  importedAt: Date | Timestamp | string;
  batchId?: string;
  originalRow?: number;
  mappingUsed?: Record<string, string>;
}

export interface ManualData {
  type: 'manual';
  createdBy: string;
  source?: string;
  notes?: string;
  referredBy?: string;
}

export interface WebsiteData {
  type: 'website';
  page?: string;
  formName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionId?: string;
}

export type SourceSpecificData = MetaAdsData | GooglePlacesData | ImportData | ManualData | WebsiteData;

// === COMMUNICATION & HISTORY ===

export interface CommunicationRecord {
  id: string;
  type: 'call' | 'email' | 'whatsapp' | 'sms' | 'meeting' | 'note';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  outcome?: string;
  duration?: number; // en minutos
  scheduledAt?: Date | Timestamp | string;
  completedAt?: Date | Timestamp | string;
  createdBy: string;
  createdAt: Date | Timestamp | string;
}

export interface StageHistoryRecord {
  fromStage?: LeadStage;
  toStage: LeadStage;
  changedBy: string;
  changedAt: Date | Timestamp | string;
  reason?: string;
  notes?: string;
}

// === AUTOMATION & RULES ===

export interface AutomationSettings {
  enabled: boolean;
  rules?: AutomationRule[];
  excludeFromMarketing?: boolean;
  excludeFromFollowUp?: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  conditions?: Record<string, any>;
  enabled: boolean;
}

// === ATTACHMENTS & MEDIA ===

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date | Timestamp | string;
}

export interface LeadImage {
  public_id: string;
  secure_url: string;
  is_featured: boolean;
  uploaded_at: Date | Timestamp | string;
  alt_text?: string;
  caption?: string;
}

// === LEAD METADATA ===

export interface LeadMetadata {
  version: string; // Schema version for migrations
  tags?: string[];
  customFields?: Record<string, any>;
  automation?: AutomationSettings;
  communicationHistory?: CommunicationRecord[];
  stageHistory?: StageHistoryRecord[];
  attachments?: Attachment[];
  images?: LeadImage[];
  analytics?: {
    viewCount?: number;
    lastViewed?: Date | Timestamp | string;
    viewedBy?: string[];
  };
}

// === LEAD PRINCIPAL UNIFICADO ===

export interface UnifiedLead {
  // === IDENTIFIERS ===
  id: string; // Document ID
  leadId: string; // External Lead ID (Meta, etc.)
  sourceId?: string; // Original source document ID
  
  // === CORE INFORMATION ===
  fullName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  
  // === CONTACT DETAILS ===
  address?: ContactAddress;
  website?: string;
  socialMedia?: SocialMediaLinks;
  
  // === BUSINESS INFORMATION ===
  businessType?: BusinessType;
  industry?: string;
  interests?: LeadInterests;
  
  // === LEAD MANAGEMENT ===
  stage: LeadStage;
  source: LeadSource;
  priority?: Priority;
  status: LeadStatus;
  qualificationStatus?: QualificationStatus;
  
  // === SALES PIPELINE ===
  estimatedValue?: number;
  closeProbability?: number; // 0-100
  expectedCloseDate?: Date | Timestamp | string;
  actualCloseDate?: Date | Timestamp | string;
  lostReason?: string;
  
  // === ENGAGEMENT ===
  leadScore?: number; // 0-100
  engagementScore?: number; // 0-100
  responseRate?: number; // 0-100
  lastContactDate?: Date | Timestamp | string;
  nextFollowUpDate?: Date | Timestamp | string;
  communicationCount?: number;
  
  // === ASSIGNMENT ===
  assignedTo?: string;
  assignedDate?: Date | Timestamp | string;
  teamId?: string;
  
  // === SOURCE-SPECIFIC DATA ===
  sourceData: SourceSpecificData;
  
  // === NOTES & DESCRIPTION ===
  notes?: string;
  description?: string;
  internalNotes?: string; // Solo para el equipo
  
  // === METADATA ===
  metadata: LeadMetadata;
  
  // === TIMESTAMPS ===
  createdAt: Date | Timestamp | string;
  updatedAt: Date | Timestamp | string;
  sourceCreatedAt?: Date | Timestamp | string; // Original creation date from source
  firstContactDate?: Date | Timestamp | string;
  
  // === ORGANIZATION ===
  uid: string;
  organizationId: string;
}

// === UTILITY TYPES ===

export type LeadSourceType = keyof typeof LeadSource;
export type LeadStageType = keyof typeof LeadStage;
export type BusinessTypeType = keyof typeof BusinessType;

// === PARTIAL TYPES FOR UPDATES ===

export type CreateLeadInput = Omit<UnifiedLead, 'id' | 'createdAt' | 'updatedAt' | 'metadata'> & {
  metadata?: Partial<LeadMetadata>;
};

export type UpdateLeadInput = Partial<Omit<UnifiedLead, 'id' | 'createdAt' | 'uid' | 'organizationId'>>;

// === SEARCH & FILTERING ===

export interface LeadFilters {
  sources?: LeadSource[];
  stages?: LeadStage[];
  businessTypes?: BusinessType[];
  priorities?: Priority[];
  statuses?: LeadStatus[];
  assignedTo?: string[];
  dateRange?: {
    start: Date | string;
    end: Date | string;
    field?: 'createdAt' | 'updatedAt' | 'lastContactDate' | 'expectedCloseDate';
  };
  valueRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  search?: string;
}

export interface LeadSearchResult {
  leads: UnifiedLead[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  aggregations?: {
    byStage: Record<LeadStage, number>;
    bySource: Record<LeadSource, number>;
    byBusinessType: Record<BusinessType, number>;
    totalValue: number;
    averageValue: number;
  };
}

// === API RESPONSE TYPES ===

export interface LeadApiResponse {
  success: boolean;
  data?: UnifiedLead | UnifiedLead[];
  error?: string;
  message?: string;
}

export interface LeadBulkOperation {
  operation: 'create' | 'update' | 'delete';
  leads: UnifiedLead[] | UpdateLeadInput[];
  options?: {
    skipValidation?: boolean;
    upsert?: boolean;
  };
}

export interface LeadBulkResult {
  success: boolean;
  processed: number;
  errors: Array<{
    leadId?: string;
    error: string;
    index: number;
  }>;
  created?: number;
  updated?: number;
  deleted?: number;
}