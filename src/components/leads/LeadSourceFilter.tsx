"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FilterIcon, X } from 'lucide-react';
import { LeadSource, LEAD_SOURCE_LABELS, LEAD_SOURCE_COLORS } from '@/types/formatters/formatter-factory';
import { getLeadSourceIcon } from '@/lib/lead-converter';

interface LeadSourceFilterProps {
  selectedSources: LeadSource[];
  onSourcesChange: (sources: LeadSource[]) => void;
  availableSources?: LeadSource[];
}

const ALL_SOURCES = Object.values(LeadSource);

export default function LeadSourceFilter({ 
  selectedSources, 
  onSourcesChange, 
  availableSources = ALL_SOURCES 
}: LeadSourceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSourceToggle = (source: LeadSource) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter(s => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
    }
  };

  const handleSelectAll = () => {
    onSourcesChange(availableSources);
  };

  const handleClearAll = () => {
    onSourcesChange([]);
  };

  const isAllSelected = selectedSources.length === availableSources.length;
  const activeCount = selectedSources.length;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <FilterIcon className="h-4 w-4" />
            Fuente
            {activeCount > 0 && activeCount < availableSources.length && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtrar por Fuente</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={isAllSelected}
                className="h-7 text-xs"
              >
                Seleccionar Todo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={activeCount === 0}
                className="h-7 text-xs"
              >
                Limpiar Todo
              </Button>
            </div>

            <div className="space-y-3">
              {availableSources.map((source) => {
                const isSelected = selectedSources.includes(source);
                const colors = LEAD_SOURCE_COLORS[source];
                const label = LEAD_SOURCE_LABELS[source];
                const icon = getLeadSourceIcon(source);

                return (
                  <div key={source} className="flex items-center space-x-3">
                    <Checkbox
                      id={source}
                      checked={isSelected}
                      onCheckedChange={() => handleSourceToggle(source)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={source}
                      className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1"
                    >
                      <span className="text-base">{icon}</span>
                      <span>{label}</span>
                    </label>
                    <Badge 
                      variant="outline" 
                      className={`${colors} text-xs px-2 py-0 h-6`}
                    >
                      {label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Show active filters */}
      {activeCount > 0 && activeCount < availableSources.length && (
        <div className="flex items-center gap-1 flex-wrap">
          {selectedSources.map((source) => {
            const colors = LEAD_SOURCE_COLORS[source];
            const label = LEAD_SOURCE_LABELS[source];
            const icon = getLeadSourceIcon(source);

            return (
              <Badge
                key={source}
                variant="outline"
                className={`${colors} text-xs px-2 py-1 cursor-pointer hover:opacity-80`}
                onClick={() => handleSourceToggle(source)}
              >
                <span className="mr-1">{icon}</span>
                {label}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}