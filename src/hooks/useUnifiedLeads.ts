// === UNIFIED LEADS HOOK ===
// Hook para manejar leads con el sistema unificado

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useOrganization } from './useOrganization';
import type { 
  UnifiedLead, 
  CreateLeadInput, 
  UpdateLeadInput, 
  LeadFilters, 
  LeadSearchResult,
  ExtendedLead 
} from '@/types';

interface UseUnifiedLeadsState {
  leads: UnifiedLead[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    total: number;
  };
}

interface UseUnifiedLeadsActions {
  searchLeads: (filters?: LeadFilters, page?: number, limit?: number) => Promise<void>;
  getLeadById: (id: string) => Promise<UnifiedLead | null>;
  createLead: (input: CreateLeadInput) => Promise<UnifiedLead | null>;
  updateLead: (id: string, updates: UpdateLeadInput) => Promise<UnifiedLead | null>;
  deleteLead: (id: string) => Promise<boolean>;
  refreshLeads: () => Promise<void>;
  clearError: () => void;
  
  // Compatibility methods for existing UI
  getLeadsAsExtended: () => ExtendedLead[];
  createLeadFromSource: (sourceData: any, sourceType: 'meta' | 'extended' | 'flow') => Promise<UnifiedLead | null>;
}

export function useUnifiedLeads(): UseUnifiedLeadsState & UseUnifiedLeadsActions {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  
  const [state, setState] = useState<UseUnifiedLeadsState>({
    leads: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 50,
      hasMore: false,
      total: 0
    }
  });

  // Helper to get auth token
  const getAuthToken = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
  }, [user]);

  // Search leads with filters
  const searchLeads = useCallback(async (
    filters?: LeadFilters, 
    page: number = 1, 
    limit: number = 50
  ) => {
    if (!organizationId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await getAuthToken();
      
      // Build query parameters
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: limit.toString()
      });

      if (filters) {
        if (filters.sources?.length) params.set('sources', filters.sources.join(','));
        if (filters.stages?.length) params.set('stages', filters.stages.join(','));
        if (filters.businessTypes?.length) params.set('businessTypes', filters.businessTypes.join(','));
        if (filters.assignedTo?.length) params.set('assignedTo', filters.assignedTo.join(','));
        if (filters.search) params.set('search', filters.search);
        if (filters.valueRange?.min !== undefined) params.set('minValue', filters.valueRange.min.toString());
        if (filters.valueRange?.max !== undefined) params.set('maxValue', filters.valueRange.max.toString());
        if (filters.tags?.length) params.set('tags', filters.tags.join(','));
      }

      const response = await fetch(`/api/leads/unified?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: { success: boolean } & LeadSearchResult = await response.json();
      
      if (!data.success) {
        throw new Error('Error searching leads');
      }

      setState(prev => ({
        ...prev,
        leads: data.leads,
        pagination: {
          page: data.pagination.page,
          limit: data.pagination.limit,
          hasMore: data.pagination.hasMore,
          total: data.total
        },
        loading: false
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error searching leads',
        loading: false
      }));
    }
  }, [organizationId, getAuthToken]);

  // Get single lead by ID
  const getLeadById = useCallback(async (id: string): Promise<UnifiedLead | null> => {
    if (!organizationId) return null;

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/leads/unified?leadId=${id}&organizationId=${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error getting lead');
      }

      return data.data;

    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || 'Error getting lead' }));
      return null;
    }
  }, [organizationId, getAuthToken]);

  // Create new lead
  const createLead = useCallback(async (input: CreateLeadInput): Promise<UnifiedLead | null> => {
    if (!organizationId || !user) return null;

    try {
      const token = await getAuthToken();
      
      const leadData = {
        ...input,
        uid: user.uid,
        organizationId
      };

      const response = await fetch('/api/leads/unified', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadData })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error creating lead');
      }

      // Refresh leads to include the new one
      await refreshLeads();

      return data.data;

    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || 'Error creating lead' }));
      return null;
    }
  }, [organizationId, user, getAuthToken]);

  // Update existing lead
  const updateLead = useCallback(async (id: string, updates: UpdateLeadInput): Promise<UnifiedLead | null> => {
    if (!organizationId) return null;

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/leads/unified?leadId=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error updating lead');
      }

      // Update local state
      setState(prev => ({
        ...prev,
        leads: prev.leads.map(lead => 
          lead.id === id ? data.data : lead
        )
      }));

      return data.data;

    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || 'Error updating lead' }));
      return null;
    }
  }, [organizationId, getAuthToken]);

  // Delete lead (soft delete)
  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    if (!organizationId) return false;

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/leads/unified?leadId=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error deleting lead');
      }

      // Remove from local state
      setState(prev => ({
        ...prev,
        leads: prev.leads.filter(lead => lead.id !== id)
      }));

      return true;

    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || 'Error deleting lead' }));
      return false;
    }
  }, [organizationId, getAuthToken]);

  // Refresh current leads
  const refreshLeads = useCallback(async () => {
    await searchLeads();
  }, [searchLeads]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // === COMPATIBILITY METHODS ===

  // Convert unified leads to ExtendedLead format for existing UI
  const getLeadsAsExtended = useCallback((): ExtendedLead[] => {
    return state.leads.map(lead => {
      const metaData = lead.sourceData.type === 'meta_ads' ? lead.sourceData : null;

      return {
        id: lead.id,
        uid: lead.uid,
        organizationId: lead.organizationId,
        stage: lead.stage,
        source: lead.source,
        images: lead.metadata.images || [],
        featured_image_url: lead.metadata.images?.find(img => img.is_featured)?.secure_url,
        
        // Core fields
        name: lead.fullName,
        fullName: lead.fullName,
        email: lead.email || '',
        phone: lead.phone || '',
        phoneNumber: lead.phone || '',
        company: lead.company || '',
        companyName: lead.company || '',
        address: lead.address?.formatted || null,
        website: lead.website || null,
        businessType: lead.businessType || null,
        notes: lead.notes || null,
        placeId: lead.sourceData.type === 'google_places' ? lead.sourceData.placeId : null,
        
        // Meta Ads specific fields
        campaignName: metaData?.campaignName || '',
        campaignId: metaData?.campaignId || '',
        adSetName: metaData?.adSetName || '',
        adSetId: metaData?.adSetId || '',
        adName: metaData?.adName || '',
        formId: metaData?.formId || '',
        platformId: metaData?.platformId || '',
        partnerName: metaData?.partnerName || '',
        isOrganic: metaData?.isOrganic ? 'true' : 'false',
        customDisclaimerResponses: metaData?.customResponses || '',
        retailerItemId: metaData?.retailerItemId || '',
        leadId: lead.leadId,
        dateCreated: metaData?.dateCreated || lead.sourceCreatedAt || lead.createdAt,
        updatedAt: lead.updatedAt,
        vehicle: lead.interests?.vehicle?.type || '',
        homeListing: lead.interests?.property?.location || '',
        visitRequest: lead.interests?.visitRequested ? 'yes' : 'no',
        
        // Timestamps
        createdAt: lead.createdAt
      } as ExtendedLead;
    });
  }, [state.leads]);

  // Create lead from source data
  const createLeadFromSource = useCallback(async (
    sourceData: any, 
    sourceType: 'meta' | 'extended' | 'flow'
  ): Promise<UnifiedLead | null> => {
    if (!organizationId || !user) return null;

    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/leads/unified', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sourceData, sourceType })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error creating lead from source');
      }

      // Refresh leads to include the new one
      await refreshLeads();

      return data.data;

    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || 'Error creating lead from source' }));
      return null;
    }
  }, [organizationId, user, getAuthToken, refreshLeads]);

  // Auto-load leads when organization changes
  useEffect(() => {
    if (organizationId) {
      searchLeads();
    }
  }, [organizationId]);

  return {
    ...state,
    searchLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead,
    refreshLeads,
    clearError,
    getLeadsAsExtended,
    createLeadFromSource
  };
}