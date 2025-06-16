import type { MetaLeadAdsModel } from './meta-lead-ads';

export interface LeadsFlowModel extends MetaLeadAdsModel {
  // Flow properties
  flowStatus: 'active' | 'paused' | 'completed' | 'archived';
  currentStage: string;
  stageHistory: StageHistoryEntry[];
  
  // Lead scoring and qualification
  leadScore: number; // 0-100
  qualificationStatus: 'unqualified' | 'marketing_qualified' | 'sales_qualified' | 'opportunity';
  
  // Communication tracking
  lastContactDate?: string;
  nextFollowUpDate?: string;
  communicationCount: number;
  communicationHistory: CommunicationEntry[];
  
  // Engagement metrics
  engagementScore: number; // 0-100
  responseRate: number; // 0-100
  averageResponseTime?: number; // in minutes
  
  // Sales pipeline
  estimatedValue?: number;
  closeProbability: number; // 0-100
  expectedCloseDate?: string;
  
  // Assignment and ownership
  assignedTo?: string; // userId
  assignedDate?: string;
  
  // Tags and categorization
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Integration metadata
  sourceLeadId: string; // ID from meta-lead-ads
  sourceCollection: 'meta-lead-ads' | 'google-places' | 'manual' | 'import';
  syncedAt: string;
  lastSyncedAt: string;
  
  // Flow automation
  automationRules: string[]; // IDs of applied automation rules
  excludeFromAutomation: boolean;
  
  // Custom fields for flexibility
  customFields: Record<string, any>;
}

export interface StageHistoryEntry {
  stage: string;
  enteredAt: string;
  exitedAt?: string;
  duration?: number; // in minutes
  triggeredBy: 'user' | 'automation' | 'system';
  userId?: string;
  notes?: string;
}

export interface CommunicationEntry {
  id: string;
  type: 'email' | 'phone' | 'whatsapp' | 'meeting' | 'note' | 'sms';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  timestamp: string;
  userId: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface LeadsFlowStats {
  total: number;
  byStage: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byQualification: Record<string, number>;
  averageScore: number;
  conversionRate: number;
  averageTimeInStage: Record<string, number>;
}

// Default flow configuration
export const DEFAULT_FLOW_CONFIG = {
  flowStatus: 'active' as const,
  currentStage: 'Nuevo',
  stageHistory: [],
  leadScore: 0,
  qualificationStatus: 'unqualified' as const,
  communicationCount: 0,
  communicationHistory: [],
  engagementScore: 0,
  responseRate: 0,
  closeProbability: 0,
  tags: [],
  priority: 'medium' as const,
  automationRules: [],
  excludeFromAutomation: false,
  customFields: {}
};