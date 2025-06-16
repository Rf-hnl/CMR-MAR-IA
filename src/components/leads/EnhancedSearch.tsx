"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { LeadSource, LEAD_SOURCE_LABELS } from '@/types/formatters/formatter-factory';
import type { ExtendedLead } from '@/types';
import { getBusinessTypeFromMetaLead } from '@/lib/lead-converter';
import LeadSourceFilter from './LeadSourceFilter';

interface EnhancedSearchProps {
  leads: ExtendedLead[];
  onFilteredLeadsChange: (filteredLeads: ExtendedLead[]) => void;
  className?: string;
}

interface SearchFilters {
  searchTerm: string;
  sources: LeadSource[];
  stages: string[];
  businessTypes: string[];
  hasEmail: boolean | null;
  hasPhone: boolean | null;
  sortBy: 'name' | 'dateCreated' | 'updatedAt' | 'stage';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: SearchFilters = {
  searchTerm: '',
  sources: Object.values(LeadSource),
  stages: [],
  businessTypes: [],
  hasEmail: null,
  hasPhone: null,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
};

export default function EnhancedSearch({ 
  leads, 
  onFilteredLeadsChange, 
  className = '' 
}: EnhancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const stages = [...new Set(leads.map(lead => lead.stage))].filter(Boolean);
    const businessTypes = [...new Set(leads.map(lead => {
      // Extract business type from campaign analysis or direct field
      return lead.businessType || 
             (lead.vehicle ? 'Automotriz' : 
              lead.homeListing ? 'Inmobiliaria' : 'General');
    }))].filter(Boolean);
    const sources = [...new Set(leads.map(lead => lead.source))];

    return { stages, businessTypes, sources };
  }, [leads]);

  // Apply filters and search
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Text search - search across multiple fields
    if (filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.fullName?.toLowerCase().includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm) ||
        lead.phoneNumber?.toLowerCase().includes(searchTerm) ||
        lead.companyName?.toLowerCase().includes(searchTerm) ||
        lead.campaignName?.toLowerCase().includes(searchTerm) ||
        lead.adName?.toLowerCase().includes(searchTerm) ||
        lead.adSetName?.toLowerCase().includes(searchTerm) ||
        lead.customDisclaimerResponses?.toLowerCase().includes(searchTerm) ||
        lead.vehicle?.toLowerCase().includes(searchTerm) ||
        lead.homeListing?.toLowerCase().includes(searchTerm)
      );
    }

    // Source filter
    if (filters.sources.length > 0 && filters.sources.length < Object.values(LeadSource).length) {
      const sourceLabels = filters.sources.map(s => LEAD_SOURCE_LABELS[s]);
      filtered = filtered.filter(lead => 
        sourceLabels.some(label => lead.source?.includes(label))
      );
    }

    // Stage filter
    if (filters.stages.length > 0) {
      filtered = filtered.filter(lead => filters.stages.includes(lead.stage));
    }

    // Business type filter
    if (filters.businessTypes.length > 0) {
      filtered = filtered.filter(lead => {
        const businessType = lead.businessType || 
                           (lead.vehicle ? 'Automotriz' : 
                            lead.homeListing ? 'Inmobiliaria' : 'General');
        return filters.businessTypes.includes(businessType);
      });
    }

    // Email filter
    if (filters.hasEmail === true) {
      filtered = filtered.filter(lead => lead.email && lead.email.trim() !== '');
    } else if (filters.hasEmail === false) {
      filtered = filtered.filter(lead => !lead.email || lead.email.trim() === '');
    }

    // Phone filter
    if (filters.hasPhone === true) {
      filtered = filtered.filter(lead => lead.phoneNumber && lead.phoneNumber.trim() !== '');
    } else if (filters.hasPhone === false) {
      filtered = filtered.filter(lead => !lead.phoneNumber || lead.phoneNumber.trim() === '');
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.fullName || '';
          bValue = b.fullName || '';
          break;
        case 'dateCreated':
          aValue = new Date(a.dateCreated).getTime();
          bValue = new Date(b.dateCreated).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'stage':
          aValue = a.stage || '';
          bValue = b.stage || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue as string);
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      }
    });

    return filtered;
  }, [leads, filters]);

  // Update filtered leads when they change
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  // Pass filtered leads to parent
  React.useEffect(() => {
    onFilteredLeadsChange(filteredLeads);
  }, [filteredLeads, onFilteredLeadsChange]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    handleFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    handleFiltersChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters = filters.searchTerm !== '' || 
                          filters.sources.length < Object.values(LeadSource).length ||
                          filters.stages.length > 0 ||
                          filters.businessTypes.length > 0 ||
                          filters.hasEmail !== null ||
                          filters.hasPhone !== null;

  const activeFilterCount = [
    filters.searchTerm !== '',
    filters.sources.length < Object.values(LeadSource).length,
    filters.stages.length > 0,
    filters.businessTypes.length > 0,
    filters.hasEmail !== null,
    filters.hasPhone !== null
  ].filter(Boolean).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar leads por nombre, email, teléfono, campaña..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Source Filter */}
        <LeadSourceFilter
          selectedSources={filters.sources}
          onSourcesChange={(sources) => updateFilter('sources', sources)}
        />

        {/* Advanced Filters */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filtros Avanzados</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Stage Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Etapas</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filterOptions.stages.map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <Checkbox
                        id={`stage-${stage}`}
                        checked={filters.stages.includes(stage)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter('stages', [...filters.stages, stage]);
                          } else {
                            updateFilter('stages', filters.stages.filter(s => s !== stage));
                          }
                        }}
                      />
                      <label htmlFor={`stage-${stage}`} className="text-sm cursor-pointer">
                        {stage}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Negocio</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filterOptions.businessTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.businessTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter('businessTypes', [...filters.businessTypes, type]);
                          } else {
                            updateFilter('businessTypes', filters.businessTypes.filter(t => t !== type));
                          }
                        }}
                      />
                      <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Info Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium block">Información de Contacto</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-email"
                    checked={filters.hasEmail === true}
                    onCheckedChange={(checked) => 
                      updateFilter('hasEmail', checked ? true : null)
                    }
                  />
                  <label htmlFor="has-email" className="text-sm cursor-pointer">
                    Tiene Email
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-phone"
                    checked={filters.hasPhone === true}
                    onCheckedChange={(checked) => 
                      updateFilter('hasPhone', checked ? true : null)
                    }
                  />
                  <label htmlFor="has-phone" className="text-sm cursor-pointer">
                    Tiene Teléfono
                  </label>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                <div className="flex items-center gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="flex-1 text-sm border rounded px-2 py-1"
                  >
                    <option value="updatedAt">Última Actualización</option>
                    <option value="dateCreated">Fecha Creación</option>
                    <option value="name">Nombre</option>
                    <option value="stage">Etapa</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2"
                  >
                    {filters.sortOrder === 'asc' ? 
                      <SortAsc className="h-4 w-4" /> : 
                      <SortDesc className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Limpiar Todos los Filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {filteredLeads.length} de {leads.length} leads
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-xs"
          >
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}