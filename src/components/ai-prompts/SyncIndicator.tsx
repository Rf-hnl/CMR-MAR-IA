"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle, Cloud } from "lucide-react";

interface SyncIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  className?: string;
}

export default function SyncIndicator({ status, lastSaved, className = "" }: SyncIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Guardando...',
          variant: 'secondary' as const,
          className: 'border-blue-200 bg-blue-50 text-blue-700',
          iconClassName: 'animate-spin'
        };
      case 'saved':
        return {
          icon: Check,
          text: 'Guardado',
          variant: 'secondary' as const,
          className: 'border-green-200 bg-green-50 text-green-700',
          iconClassName: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Error al guardar',
          variant: 'destructive' as const,
          className: 'border-red-200 bg-red-50 text-red-700',
          iconClassName: ''
        };
      default:
        if (lastSaved) {
          return {
            icon: Cloud,
            text: formatLastSaved(lastSaved),
            variant: 'outline' as const,
            className: 'border-gray-200 bg-gray-50 text-gray-600',
            iconClassName: ''
          };
        }
        return null;
    }
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Guardado hace unos segundos';
    if (diffMinutes < 60) return `Guardado hace ${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Guardado hace ${diffHours}h`;
    
    return `Guardado ${date.toLocaleDateString()}`;
  };

  const config = getStatusConfig();
  
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1.5 text-xs font-medium px-2.5 py-1`}
    >
      <Icon className={`h-3 w-3 ${config.iconClassName}`} />
      {config.text}
    </Badge>
  );
}