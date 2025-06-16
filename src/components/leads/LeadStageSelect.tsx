"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_STAGES, type LeadStage } from '@/lib/leads-utils';

interface LeadStageSelectProps {
  value: string;
  onChange: (value: LeadStage) => void;
  disabled?: boolean;
  className?: string;
}

export default function LeadStageSelect({ 
  value, 
  onChange, 
  disabled = false,
  className = ""
}: LeadStageSelectProps) {
  return (
    <Select 
      value={value} 
      onValueChange={(newValue) => onChange(newValue as LeadStage)}
      disabled={disabled}
    >
      <SelectTrigger className={`w-full h-8 text-xs bg-input text-foreground focus:ring-primary rounded-[var(--radius)] ${className}`}>
        <SelectValue placeholder="Cambiar etapa" />
      </SelectTrigger>
      <SelectContent className="bg-popover text-popover-foreground">
        {LEAD_STAGES.map(stage => (
          <SelectItem key={stage} value={stage} className="text-xs">
            {stage}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}