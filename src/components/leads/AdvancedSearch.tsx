"use client";

import { useState, useCallback, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, X, Filter, Calendar, MapPin, Building2, Phone, Mail, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types';

export interface SearchFilter {
  field: string;
  operator: string;
  value: string;
  label: string;
}

interface AdvancedSearchProps {
  leads: Lead[];
  onSearch: (filteredLeads: Lead[]) => void;
  className?: string;
}

const SEARCH_FIELDS = [
  { value: 'name', label: 'Nombre', icon: Building2 },
  { value: 'company', label: 'Empresa', icon: Building2 },
  { value: 'address', label: 'Dirección', icon: MapPin },
  { value: 'phone', label: 'Teléfono', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'website', label: 'Sitio Web', icon: Globe },
  { value: 'stage', label: 'Etapa', icon: Filter },
  { value: 'source', label: 'Fuente', icon: Filter },
];

const OPERATORS = [
  { value: 'contains', label: 'Contiene' },
  { value: 'equals', label: 'Igual a' },
  { value: 'starts', label: 'Empieza con' },
  { value: 'ends', label: 'Termina con' },
];

export const AdvancedSearch = ({ leads, onSearch, className }: AdvancedSearchProps) => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Generate suggestions based on current input
  const suggestions = useMemo(() => {
    if (!searchText || searchText.length < 2) return [];
    
    const allValues = new Set<string>();
    leads.forEach(lead => {
      Object.entries(lead).forEach(([key, value]) => {
        if (typeof value === 'string' && value.toLowerCase().includes(searchText.toLowerCase())) {
          allValues.add(value);
        }
      });
    });
    
    return Array.from(allValues).slice(0, 8);
  }, [searchText, leads]);

  // Apply search and filters
  const filterLeads = useCallback((text: string, activeFilters: SearchFilter[]) => {
    let filtered = leads;

    // Apply text search
    if (text.trim()) {
      filtered = filtered.filter(lead => {
        const searchableFields = [
          lead.name,
          lead.company,
          lead.address,
          lead.phone,
          lead.email,
          lead.website,
          lead.businessType,
          lead.stage,
          lead.source
        ];
        
        return searchableFields.some(field => 
          field?.toLowerCase().includes(text.toLowerCase())
        );
      });
    }

    // Apply filters
    activeFilters.forEach(filter => {
      filtered = filtered.filter(lead => {
        const fieldValue = lead[filter.field as keyof Lead];
        if (!fieldValue) return false;
        
        const value = String(fieldValue).toLowerCase();
        const searchValue = filter.value.toLowerCase();
        
        switch (filter.operator) {
          case 'contains':
            return value.includes(searchValue);
          case 'equals':
            return value === searchValue;
          case 'starts':
            return value.startsWith(searchValue);
          case 'ends':
            return value.endsWith(searchValue);
          default:
            return value.includes(searchValue);
        }
      });
    });

    onSearch(filtered);
  }, [leads, onSearch]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    filterLeads(text, filters);
  }, [filters, filterLeads]);

  const addFilter = useCallback((field: string, value: string) => {
    const newFilter: SearchFilter = {
      field,
      operator: 'contains',
      value,
      label: `${SEARCH_FIELDS.find(f => f.value === field)?.label}: ${value}`
    };
    
    const newFilters = [...filters, newFilter];
    setFilters(newFilters);
    filterLeads(searchText, newFilters);
  }, [filters, searchText, filterLeads]);

  const removeFilter = useCallback((index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    filterLeads(searchText, newFilters);
  }, [filters, searchText, filterLeads]);

  const clearAll = useCallback(() => {
    setSearchText('');
    setFilters([]);
    onSearch(leads);
  }, [leads, onSearch]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar leads por nombre, empresa, teléfono..."
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-20"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-7 px-2",
              showFilters && "bg-primary text-primary-foreground"
            )}
          >
            <Filter className="h-3 w-3" />
          </Button>
          
          {(searchText || filters.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Search suggestions */}
        {suggestions.length > 0 && searchText && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-lg">
            <div className="max-h-48 overflow-y-auto p-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {filter.label}
              <button
                onClick={() => removeFilter(index)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <h4 className="font-medium text-sm">Filtros Avanzados</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SEARCH_FIELDS.map((field) => {
              const Icon = field.icon;
              return (
                <Popover key={field.value}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Icon className="h-3 w-3 mr-2" />
                      {field.label}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <Command>
                      <CommandInput placeholder={`Buscar ${field.label.toLowerCase()}...`} />
                      <CommandList>
                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                        <CommandGroup>
                          {Array.from(new Set(
                            leads
                              .map(lead => lead[field.value as keyof Lead])
                              .filter(Boolean)
                              .map(String)
                          )).slice(0, 10).map((value) => (
                            <CommandItem
                              key={value}
                              onSelect={() => addFilter(field.value, value)}
                            >
                              {value}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};