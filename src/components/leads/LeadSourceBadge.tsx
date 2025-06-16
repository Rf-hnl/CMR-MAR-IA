"use client";

import { Badge } from '@/components/ui/badge';
import { getLeadSourceFromString, LEAD_SOURCE_COLORS, LEAD_SOURCE_LABELS } from '@/types/formatters/formatter-factory';
import { getLeadSourceIcon } from '@/lib/lead-converter';

interface LeadSourceBadgeProps {
  source: string;
  className?: string;
  showIcon?: boolean;
}

export default function LeadSourceBadge({ source, className = '', showIcon = true }: LeadSourceBadgeProps) {
  const leadSource = getLeadSourceFromString(source);
  const colors = LEAD_SOURCE_COLORS[leadSource];
  const label = LEAD_SOURCE_LABELS[leadSource];
  const icon = getLeadSourceIcon(source);

  return (
    <Badge 
      variant="outline" 
      className={`${colors} ${className} font-medium border`}
    >
      {showIcon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
}