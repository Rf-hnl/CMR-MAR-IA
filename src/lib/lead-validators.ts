// === LEAD VALIDATORS ===
// Validadores Zod para el sistema unificado de leads

import { z } from 'zod';
import { 
  BusinessType, 
  LeadSource, 
  LeadStage, 
  LeadStatus, 
  Priority, 
  QualificationStatus 
} from '@/types/unified-lead';

// === BASIC VALIDATORS ===

const emailValidator = z.string().email().optional().or(z.literal(''));
const phoneValidator = z.string().min(10).max(20).optional().or(z.literal(''));
const urlValidator = z.string().url().optional().or(z.literal(''));
const positiveNumberValidator = z.number().positive().optional();
const percentageValidator = z.number().min(0).max(100).optional();

// === ENUM VALIDATORS ===

const BusinessTypeValidator = z.nativeEnum(BusinessType);
const LeadSourceValidator = z.nativeEnum(LeadSource);
const LeadStageValidator = z.nativeEnum(LeadStage);
const LeadStatusValidator = z.nativeEnum(LeadStatus);
const PriorityValidator = z.nativeEnum(Priority);
const QualificationStatusValidator = z.nativeEnum(QualificationStatus);

// === NESTED OBJECT VALIDATORS ===

const ContactAddressValidator = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  formatted: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
}).optional();

const SocialMediaLinksValidator = z.object({
  facebook: urlValidator,
  instagram: urlValidator,
  linkedin: urlValidator,
  twitter: urlValidator,
  whatsapp: z.string().optional(),
  tiktok: urlValidator,
  youtube: urlValidator,
  website: urlValidator
}).optional();

const PriceRangeValidator = z.object({
  min: positiveNumberValidator,
  max: positiveNumberValidator,
  currency: z.string().default('USD')
}).optional();

const VehicleInterestValidator = z.object({
  type: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 2).optional(),
  priceRange: PriceRangeValidator,
  condition: z.enum(['new', 'used', 'any']).optional(),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'any']).optional()
}).optional();

const PropertyInterestValidator = z.object({
  type: z.enum(['house', 'apartment', 'commercial', 'land', 'office']).optional(),
  location: z.string().optional(),
  priceRange: PriceRangeValidator,
  bedrooms: z.number().positive().optional(),
  bathrooms: z.number().positive().optional(),
  area: z.number().positive().optional(),
  furnished: z.boolean().optional(),
  parking: z.boolean().optional()
}).optional();

const ServiceInterestValidator = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  budget: PriceRangeValidator,
  timeline: z.string().optional()
}).optional();

const ProductInterestValidator = z.object({
  category: z.string().optional(),
  productName: z.string().optional(),
  brand: z.string().optional(),
  quantity: z.number().positive().optional(),
  budget: PriceRangeValidator
}).optional();

const LeadInterestsValidator = z.object({
  vehicle: VehicleInterestValidator,
  property: PropertyInterestValidator,
  service: ServiceInterestValidator,
  product: ProductInterestValidator,
  visitRequested: z.boolean().optional(),
  consultationRequested: z.boolean().optional(),
  demoRequested: z.boolean().optional(),
  quoteRequested: z.boolean().optional()
}).optional();

// === SOURCE-SPECIFIC DATA VALIDATORS ===

const MetaAdsDataValidator = z.object({
  type: z.literal('meta_ads'),
  campaignId: z.string().min(1),
  campaignName: z.string().min(1),
  adSetId: z.string().min(1),
  adSetName: z.string().min(1),
  adId: z.string().optional(),
  adName: z.string().min(1),
  formId: z.string().min(1),
  platformId: z.string().min(1),
  partnerName: z.string().optional(),
  isOrganic: z.boolean(),
  customResponses: z.string().optional(),
  retailerItemId: z.string().optional(),
  dateCreated: z.string().optional()
});

const GooglePlacesDataValidator = z.object({
  type: z.literal('google_places'),
  placeId: z.string().min(1),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
  openingHours: z.object({
    open_now: z.boolean().optional(),
    weekday_text: z.array(z.string()).optional()
  }).optional(),
  photos: z.array(z.string()).optional()
});

const ImportDataValidator = z.object({
  type: z.literal('import'),
  importType: z.enum(['csv', 'xml']),
  fileName: z.string().min(1),
  importedAt: z.union([z.date(), z.string()]),
  batchId: z.string().optional(),
  originalRow: z.number().positive().optional(),
  mappingUsed: z.record(z.string()).optional()
});

const ManualDataValidator = z.object({
  type: z.literal('manual'),
  createdBy: z.string().min(1),
  source: z.string().optional(),
  notes: z.string().optional(),
  referredBy: z.string().optional()
});

const WebsiteDataValidator = z.object({
  type: z.literal('website'),
  page: z.string().optional(),
  formName: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  sessionId: z.string().optional()
});

const SourceSpecificDataValidator = z.discriminatedUnion('type', [
  MetaAdsDataValidator,
  GooglePlacesDataValidator,
  ImportDataValidator,
  ManualDataValidator,
  WebsiteDataValidator
]);

// === COMMUNICATION & HISTORY VALIDATORS ===

const CommunicationRecordValidator = z.object({
  id: z.string().min(1),
  type: z.enum(['call', 'email', 'whatsapp', 'sms', 'meeting', 'note']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().optional(),
  content: z.string().optional(),
  outcome: z.string().optional(),
  duration: z.number().positive().optional(),
  scheduledAt: z.union([z.date(), z.string()]).optional(),
  completedAt: z.union([z.date(), z.string()]).optional(),
  createdBy: z.string().min(1),
  createdAt: z.union([z.date(), z.string()])
});

const StageHistoryRecordValidator = z.object({
  fromStage: LeadStageValidator.optional(),
  toStage: LeadStageValidator,
  changedBy: z.string().min(1),
  changedAt: z.union([z.date(), z.string()]),
  reason: z.string().optional(),
  notes: z.string().optional()
});

const AutomationRuleValidator = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  trigger: z.string().min(1),
  action: z.string().min(1),
  conditions: z.record(z.any()).optional(),
  enabled: z.boolean()
});

const AutomationSettingsValidator = z.object({
  enabled: z.boolean(),
  rules: z.array(AutomationRuleValidator).optional(),
  excludeFromMarketing: z.boolean().optional(),
  excludeFromFollowUp: z.boolean().optional()
});

const AttachmentValidator = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  size: z.number().positive(),
  url: z.string().url(),
  uploadedBy: z.string().min(1),
  uploadedAt: z.union([z.date(), z.string()])
});

const LeadImageValidator = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  is_featured: z.boolean(),
  uploaded_at: z.union([z.date(), z.string()]),
  alt_text: z.string().optional(),
  caption: z.string().optional()
});

const LeadMetadataValidator = z.object({
  version: z.string().min(1),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  automation: AutomationSettingsValidator.optional(),
  communicationHistory: z.array(CommunicationRecordValidator).optional(),
  stageHistory: z.array(StageHistoryRecordValidator).optional(),
  attachments: z.array(AttachmentValidator).optional(),
  images: z.array(LeadImageValidator).optional(),
  analytics: z.object({
    viewCount: z.number().min(0).optional(),
    lastViewed: z.union([z.date(), z.string()]).optional(),
    viewedBy: z.array(z.string()).optional()
  }).optional()
});

// === MAIN UNIFIED LEAD VALIDATOR ===

export const UnifiedLeadValidator = z.object({
  // === IDENTIFIERS ===
  id: z.string().min(1),
  leadId: z.string().min(1),
  sourceId: z.string().optional(),
  
  // === CORE INFORMATION ===
  fullName: z.string().min(1, 'El nombre completo es requerido'),
  email: emailValidator,
  phone: phoneValidator,
  company: z.string().optional(),
  
  // === CONTACT DETAILS ===
  address: ContactAddressValidator,
  website: urlValidator,
  socialMedia: SocialMediaLinksValidator,
  
  // === BUSINESS INFORMATION ===
  businessType: BusinessTypeValidator.optional(),
  industry: z.string().optional(),
  interests: LeadInterestsValidator,
  
  // === LEAD MANAGEMENT ===
  stage: LeadStageValidator,
  source: LeadSourceValidator,
  priority: PriorityValidator.optional(),
  status: LeadStatusValidator,
  qualificationStatus: QualificationStatusValidator.optional(),
  
  // === SALES PIPELINE ===
  estimatedValue: positiveNumberValidator,
  closeProbability: percentageValidator,
  expectedCloseDate: z.union([z.date(), z.string()]).optional(),
  actualCloseDate: z.union([z.date(), z.string()]).optional(),
  lostReason: z.string().optional(),
  
  // === ENGAGEMENT ===
  leadScore: percentageValidator,
  engagementScore: percentageValidator,
  responseRate: percentageValidator,
  lastContactDate: z.union([z.date(), z.string()]).optional(),
  nextFollowUpDate: z.union([z.date(), z.string()]).optional(),
  communicationCount: z.number().min(0).optional(),
  
  // === ASSIGNMENT ===
  assignedTo: z.string().optional(),
  assignedDate: z.union([z.date(), z.string()]).optional(),
  teamId: z.string().optional(),
  
  // === SOURCE-SPECIFIC DATA ===
  sourceData: SourceSpecificDataValidator,
  
  // === NOTES & DESCRIPTION ===
  notes: z.string().optional(),
  description: z.string().optional(),
  internalNotes: z.string().optional(),
  
  // === METADATA ===
  metadata: LeadMetadataValidator,
  
  // === TIMESTAMPS ===
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  sourceCreatedAt: z.union([z.date(), z.string()]).optional(),
  firstContactDate: z.union([z.date(), z.string()]).optional(),
  
  // === ORGANIZATION ===
  uid: z.string().min(1),
  organizationId: z.string().min(1)
});

// === CREATE/UPDATE VALIDATORS ===

export const CreateLeadInputValidator = UnifiedLeadValidator.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  metadata: LeadMetadataValidator.partial().optional()
});

export const UpdateLeadInputValidator = UnifiedLeadValidator.partial().omit({
  id: true,
  createdAt: true,
  uid: true,
  organizationId: true
});

// === SEARCH & FILTERING VALIDATORS ===

export const LeadFiltersValidator = z.object({
  sources: z.array(LeadSourceValidator).optional(),
  stages: z.array(LeadStageValidator).optional(),
  businessTypes: z.array(BusinessTypeValidator).optional(),
  priorities: z.array(PriorityValidator).optional(),
  statuses: z.array(LeadStatusValidator).optional(),
  assignedTo: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.union([z.date(), z.string()]),
    end: z.union([z.date(), z.string()]),
    field: z.enum(['createdAt', 'updatedAt', 'lastContactDate', 'expectedCloseDate']).optional()
  }).optional(),
  valueRange: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional()
});

// === BULK OPERATION VALIDATORS ===

export const LeadBulkOperationValidator = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  leads: z.array(z.union([UnifiedLeadValidator, UpdateLeadInputValidator])),
  options: z.object({
    skipValidation: z.boolean().optional(),
    upsert: z.boolean().optional()
  }).optional()
});

// === UTILITY VALIDATION FUNCTIONS ===

/**
 * Validates a unified lead object
 */
export function validateUnifiedLead(lead: any): { success: boolean; error?: string; data?: any } {
  try {
    const result = UnifiedLeadValidator.parse(lead);
    return { success: true, data: result };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.issues?.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ') || error.message 
    };
  }
}

/**
 * Validates create lead input
 */
export function validateCreateLeadInput(input: any): { success: boolean; error?: string; data?: any } {
  try {
    const result = CreateLeadInputValidator.parse(input);
    return { success: true, data: result };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.issues?.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ') || error.message 
    };
  }
}

/**
 * Validates update lead input
 */
export function validateUpdateLeadInput(input: any): { success: boolean; error?: string; data?: any } {
  try {
    const result = UpdateLeadInputValidator.parse(input);
    return { success: true, data: result };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.issues?.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ') || error.message 
    };
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  try {
    z.string().email().parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates phone format (basic)
 */
export function validatePhone(phone: string): boolean {
  try {
    z.string().min(10).max(20).parse(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
  try {
    z.string().url().parse(url);
    return true;
  } catch {
    return false;
  }
}

// === EXPORT ALL VALIDATORS ===

export {
  BusinessTypeValidator,
  LeadSourceValidator,
  LeadStageValidator,
  LeadStatusValidator,
  PriorityValidator,
  QualificationStatusValidator,
  ContactAddressValidator,
  SocialMediaLinksValidator,
  LeadInterestsValidator,
  SourceSpecificDataValidator,
  LeadMetadataValidator,
  MetaAdsDataValidator,
  GooglePlacesDataValidator,
  ImportDataValidator,
  ManualDataValidator,
  WebsiteDataValidator
};