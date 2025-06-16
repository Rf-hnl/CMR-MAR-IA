"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, CheckSquare, Square } from 'lucide-react';
import { LeadSource, LEAD_SOURCE_COLORS, LEAD_SOURCE_LABELS } from '@/types/formatters/lead-sources';

interface LeadSourceFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSources: LeadSource[];
  onSourcesChange: (sources: LeadSource[]) => void;
  availableSources: LeadSource[];
}

export default function LeadSourceFilterModal({
  open,
  onOpenChange,
  selectedSources,
  onSourcesChange,
  availableSources
}: LeadSourceFilterModalProps) {
  const [tempSelectedSources, setTempSelectedSources] = useState<LeadSource[]>(selectedSources);

  useEffect(() => {
    setTempSelectedSources(selectedSources);
  }, [selectedSources, open]);

  const handleSourceToggle = (source: LeadSource) => {
    setTempSelectedSources(prev => 
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleSelectAll = () => {
    setTempSelectedSources(availableSources);
  };

  const handleSelectNone = () => {
    setTempSelectedSources([]);
  };

  const handleApply = () => {
    onSourcesChange(tempSelectedSources);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelectedSources(selectedSources);
    onOpenChange(false);
  };

  const allSelected = tempSelectedSources.length === availableSources.length;
  const noneSelected = tempSelectedSources.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar por Fuente de Datos
          </DialogTitle>
          <DialogDescription>
            Selecciona las fuentes de leads que deseas visualizar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={allSelected}
              className="flex-1"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Seleccionar Todo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              disabled={noneSelected}
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Deseleccionar Todo
            </Button>
          </div>

          {/* Source Options */}
          <div className="space-y-3">
            {availableSources.map((source) => {
              const isSelected = tempSelectedSources.includes(source);
              const colorClass = LEAD_SOURCE_COLORS[source];
              
              return (
                <div key={source} className="flex items-center space-x-3">
                  <Checkbox
                    id={source}
                    checked={isSelected}
                    onCheckedChange={() => handleSourceToggle(source)}
                  />
                  <label
                    htmlFor={source}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Badge 
                      variant="outline" 
                      className={`${colorClass} text-xs font-medium`}
                    >
                      {LEAD_SOURCE_LABELS[source]}
                    </Badge>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Selected Count */}
          <div className="text-sm text-muted-foreground text-center py-2 border-t">
            {tempSelectedSources.length} de {availableSources.length} fuentes seleccionadas
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}