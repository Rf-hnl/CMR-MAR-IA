// === LEAD UNIFIER SERVICE ===
// Servicio principal para manejar el sistema unificado de leads

import { firestoreDbAdmin } from '@/lib/firebaseAdmin';
import type { 
  UnifiedLead, 
  CreateLeadInput, 
  UpdateLeadInput,
  LeadFilters,
  LeadSearchResult,
  LeadBulkOperation,
  LeadBulkResult,
  LeadApiResponse
} from '@/types/unified-lead';
import { 
  validateUnifiedLead, 
  validateCreateLeadInput, 
  validateUpdateLeadInput 
} from '@/lib/lead-validators';
import { 
  mapMetaLeadToUnified,
  mapExtendedLeadToUnified,
  mapLeadsFlowToUnified,
  mapUnifiedToExtended,
  createUnifiedLeadFromSource
} from '@/lib/lead-mappers';
import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';
import type { ExtendedLead } from '@/types';
import type { LeadsFlowModel } from '@/types/leads-flow';
import { FieldValue } from 'firebase-admin/firestore';

export class LeadUnifierService {
  private static instance: LeadUnifierService;
  private readonly collectionName = 'leads-unified';

  private constructor() {}

  static getInstance(): LeadUnifierService {
    if (!LeadUnifierService.instance) {
      LeadUnifierService.instance = new LeadUnifierService();
    }
    return LeadUnifierService.instance;
  }

  // === CORE CRUD OPERATIONS ===

  /**
   * Creates a new unified lead
   */
  async createLead(input: CreateLeadInput): Promise<LeadApiResponse> {
    try {
      const validation = validateCreateLeadInput(input);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const leadData = {
        ...validation.data,
        id: '', // Will be set by Firestore
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        metadata: {
          version: '1.0',
          ...validation.data.metadata
        }
      };

      const docRef = await firestoreDbAdmin.collection(this.collectionName).add(leadData);
      
      // Get the created document
      const createdDoc = await docRef.get();
      const createdLead = { 
        id: createdDoc.id, 
        ...createdDoc.data(),
        createdAt: createdDoc.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: createdDoc.data()?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as UnifiedLead;

      return { success: true, data: createdLead };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error creating lead' };
    }
  }

  /**
   * Gets a unified lead by ID
   */
  async getLeadById(id: string): Promise<LeadApiResponse> {
    try {
      const doc = await firestoreDbAdmin.collection(this.collectionName).doc(id).get();
      
      if (!doc.exists) {
        return { success: false, error: 'Lead not found' };
      }

      const lead = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as UnifiedLead;

      return { success: true, data: lead };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error getting lead' };
    }
  }

  /**
   * Updates a unified lead
   */
  async updateLead(id: string, updates: UpdateLeadInput): Promise<LeadApiResponse> {
    try {
      const validation = validateUpdateLeadInput(updates);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const updateData = {
        ...validation.data,
        updatedAt: FieldValue.serverTimestamp()
      };

      await firestoreDbAdmin.collection(this.collectionName).doc(id).update(updateData);
      
      // Get updated document
      const updatedResult = await this.getLeadById(id);
      return updatedResult;
    } catch (error: any) {
      return { success: false, error: error.message || 'Error updating lead' };
    }
  }

  /**
   * Deletes a unified lead (soft delete)
   */
  async deleteLead(id: string): Promise<LeadApiResponse> {
    try {
      await firestoreDbAdmin.collection(this.collectionName).doc(id).update({
        status: 'deleted',
        updatedAt: FieldValue.serverTimestamp()
      });

      return { success: true, message: 'Lead deleted successfully' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error deleting lead' };
    }
  }

  // === SEARCH AND FILTERING ===

  /**
   * Searches leads with filters and pagination
   */
  async searchLeads(
    organizationId: string,
    filters?: LeadFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<LeadSearchResult> {
    try {
      let query = firestoreDbAdmin
        .collection(this.collectionName)
        .where('organizationId', '==', organizationId)
        .where('status', '!=', 'deleted');

      // Apply filters
      if (filters) {
        if (filters.sources?.length) {
          query = query.where('source', 'in', filters.sources);
        }
        if (filters.stages?.length) {
          query = query.where('stage', 'in', filters.stages);
        }
        if (filters.businessTypes?.length) {
          query = query.where('businessType', 'in', filters.businessTypes);
        }
        if (filters.assignedTo?.length) {
          query = query.where('assignedTo', 'in', filters.assignedTo);
        }
        if (filters.statuses?.length) {
          query = query.where('status', 'in', filters.statuses);
        }
      }

      // Order and paginate
      query = query.orderBy('updatedAt', 'desc');
      
      const offset = (page - 1) * limit;
      if (offset > 0) {
        query = query.offset(offset);
      }
      query = query.limit(limit);

      const snapshot = await query.get();
      
      const leads: UnifiedLead[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as UnifiedLead[];

      // Apply additional filters (client-side for complex filters)
      let filteredLeads = leads;
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredLeads = filteredLeads.filter(lead =>
          lead.fullName.toLowerCase().includes(searchTerm) ||
          lead.email?.toLowerCase().includes(searchTerm) ||
          lead.phone?.toLowerCase().includes(searchTerm) ||
          lead.company?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.valueRange) {
        filteredLeads = filteredLeads.filter(lead => {
          const value = lead.estimatedValue || 0;
          return (!filters.valueRange!.min || value >= filters.valueRange!.min) &&
                 (!filters.valueRange!.max || value <= filters.valueRange!.max);
        });
      }

      if (filters?.tags?.length) {
        filteredLeads = filteredLeads.filter(lead =>
          filters.tags!.some(tag => lead.metadata.tags?.includes(tag))
        );
      }

      // Get total count for pagination
      const totalSnapshot = await firestoreDbAdmin
        .collection(this.collectionName)
        .where('organizationId', '==', organizationId)
        .where('status', '!=', 'deleted')
        .count()
        .get();

      const total = totalSnapshot.data().count;

      return {
        leads: filteredLeads,
        total,
        pagination: {
          page,
          limit,
          hasMore: (page * limit) < total
        }
      };
    } catch (error: any) {
      throw new Error(`Error searching leads: ${error.message}`);
    }
  }

  // === MIGRATION FROM EXISTING SOURCES ===

  /**
   * Migrates leads from meta-lead-ads collection
   */
  async migrateFromMetaLeads(organizationId: string): Promise<LeadBulkResult> {
    try {
      const metaLeadsSnapshot = await firestoreDbAdmin
        .collection('meta-lead-ads')
        .where('organizationId', '==', organizationId)
        .get();

      if (metaLeadsSnapshot.empty) {
        return {
          success: true,
          processed: 0,
          errors: [],
          created: 0,
          updated: 0
        };
      }

      const metaLeads = metaLeadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (MetaLeadAdsModel & { id: string; uid: string; organizationId: string })[];

      // Check which leads already exist
      const existingSnapshot = await firestoreDbAdmin
        .collection(this.collectionName)
        .where('organizationId', '==', organizationId)
        .where('source', '==', 'meta_ads')
        .get();

      const existingSourceIds = new Set(
        existingSnapshot.docs.map(doc => doc.data().sourceId).filter(Boolean)
      );

      const leadsToMigrate = metaLeads.filter(lead => !existingSourceIds.has(lead.id));

      const results: LeadBulkResult = {
        success: true,
        processed: leadsToMigrate.length,
        errors: [],
        created: 0,
        updated: 0
      };

      // Batch create leads
      const batch = firestoreDbAdmin.batch();
      
      leadsToMigrate.forEach((metaLead, index) => {
        try {
          const mapped = mapMetaLeadToUnified(metaLead, metaLead.leadId);
          const validation = validateCreateLeadInput(mapped);
          
          if (validation.success) {
            const docRef = firestoreDbAdmin.collection(this.collectionName).doc();
            const leadData = {
              ...validation.data,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              metadata: {
                version: '1.0',
                ...validation.data.metadata
              }
            };
            
            batch.set(docRef, leadData);
            results.created!++;
          } else {
            results.errors.push({ index, error: validation.error || 'Validation failed' });
          }
        } catch (error: any) {
          results.errors.push({ index, error: error.message || 'Mapping failed' });
        }
      });

      if (results.created! > 0) {
        await batch.commit();
      }

      results.success = results.errors.length === 0;
      return results;
    } catch (error: any) {
      return {
        success: false,
        processed: 0,
        errors: [{ index: 0, error: error.message || 'Migration failed' }],
        created: 0,
        updated: 0
      };
    }
  }

  /**
   * Migrates leads from leads-flow collection
   */
  async migrateFromLeadsFlow(organizationId: string): Promise<LeadBulkResult> {
    try {
      const flowLeadsSnapshot = await firestoreDbAdmin
        .collection('leads-flow')
        .where('organizationId', '==', organizationId)
        .get();

      if (flowLeadsSnapshot.empty) {
        return {
          success: true,
          processed: 0,
          errors: [],
          created: 0,
          updated: 0
        };
      }

      const flowLeads = flowLeadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (LeadsFlowModel & { id: string })[];

      const results: LeadBulkResult = {
        success: true,
        processed: flowLeads.length,
        errors: [],
        created: 0,
        updated: 0
      };

      const batch = firestoreDbAdmin.batch();
      
      flowLeads.forEach((flowLead, index) => {
        try {
          const mapped = mapLeadsFlowToUnified(flowLead);
          const validation = validateCreateLeadInput(mapped);
          
          if (validation.success) {
            const docRef = firestoreDbAdmin.collection(this.collectionName).doc();
            const leadData = {
              ...validation.data,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              metadata: {
                version: '1.0',
                ...validation.data.metadata
              }
            };
            
            batch.set(docRef, leadData);
            results.created!++;
          } else {
            results.errors.push({ index, error: validation.error || 'Validation failed' });
          }
        } catch (error: any) {
          results.errors.push({ index, error: error.message || 'Mapping failed' });
        }
      });

      if (results.created! > 0) {
        await batch.commit();
      }

      results.success = results.errors.length === 0;
      return results;
    } catch (error: any) {
      return {
        success: false,
        processed: 0,
        errors: [{ index: 0, error: error.message || 'Migration failed' }],
        created: 0,
        updated: 0
      };
    }
  }

  // === COMPATIBILITY HELPERS ===

  /**
   * Gets leads in ExtendedLead format for UI compatibility
   */
  async getLeadsAsExtended(organizationId: string, filters?: LeadFilters): Promise<ExtendedLead[]> {
    try {
      const result = await this.searchLeads(organizationId, filters, 1, 1000);
      return result.leads.map(lead => mapUnifiedToExtended(lead));
    } catch (error: any) {
      console.error('Error getting leads as extended:', error);
      return [];
    }
  }

  /**
   * Creates a lead from any source format
   */
  async createLeadFromSource(
    sourceData: any,
    sourceType: 'meta' | 'extended' | 'flow'
  ): Promise<LeadApiResponse> {
    try {
      const mappingResult = createUnifiedLeadFromSource(sourceData, sourceType);
      if (!mappingResult.success) {
        return { success: false, error: mappingResult.error };
      }

      return await this.createLead(mappingResult.data!);
    } catch (error: any) {
      return { success: false, error: error.message || 'Error creating lead from source' };
    }
  }

  // === ANALYTICS AND REPORTING ===

  /**
   * Gets lead statistics by organization
   */
  async getLeadStatistics(organizationId: string): Promise<any> {
    try {
      const snapshot = await firestoreDbAdmin
        .collection(this.collectionName)
        .where('organizationId', '==', organizationId)
        .where('status', '!=', 'deleted')
        .get();

      const leads = snapshot.docs.map(doc => doc.data()) as UnifiedLead[];

      const stats = {
        total: leads.length,
        byStage: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
        byBusinessType: {} as Record<string, number>,
        totalValue: 0,
        averageValue: 0,
        averageScore: 0
      };

      leads.forEach(lead => {
        // Count by stage
        stats.byStage[lead.stage] = (stats.byStage[lead.stage] || 0) + 1;
        
        // Count by source
        stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1;
        
        // Count by business type
        if (lead.businessType) {
          stats.byBusinessType[lead.businessType] = (stats.byBusinessType[lead.businessType] || 0) + 1;
        }
        
        // Sum values and scores
        stats.totalValue += lead.estimatedValue || 0;
        stats.averageScore += lead.leadScore || 0;
      });

      stats.averageValue = leads.length > 0 ? stats.totalValue / leads.length : 0;
      stats.averageScore = leads.length > 0 ? stats.averageScore / leads.length : 0;

      return stats;
    } catch (error: any) {
      throw new Error(`Error getting lead statistics: ${error.message}`);
    }
  }
}

// Export singleton instance
export const leadUnifier = LeadUnifierService.getInstance();