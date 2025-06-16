// config/leadConstants.ts
import type { LeadStage } from '@/types';

export const LEAD_STAGES: readonly LeadStage[] = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

// Using Shadcn UI theme colors (HSL variables from globals.css will apply)
// The `dotColor` is an example if you want specific dot colors not tied to text/bg.
// Otherwise, the span background can directly use theme colors.
// For now, I'll use direct Tailwind classes for the dot for simplicity in KanbanView.
// This stageColors object might be more useful for text/background combinations of badges.

export const stageColors: Record<LeadStage, { badgeClass: string, dotColor: string }> = {
  Nuevo:              { badgeClass: 'bg-muted text-muted-foreground', dotColor: 'bg-slate-500' }, // Neutral dot
  Contactado:         { badgeClass: 'bg-primary/10 text-primary', dotColor: 'bg-blue-500' }, // Blue dot (example)
  Calificado:         { badgeClass: 'bg-amber-400/20 text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' }, // Yellow/Orange dot
  'Propuesta Enviada':{ badgeClass: 'bg-purple-400/20 text-purple-600 dark:text-purple-400', dotColor: 'bg-purple-500' }, // Purple dot
  Negociación:        { badgeClass: 'bg-cyan-400/20 text-cyan-600 dark:text-cyan-400', dotColor: 'bg-cyan-500' }, // Cyan/Turquoise dot
  Ganado:             { badgeClass: 'bg-green-500/20 text-green-700 dark:text-green-400', dotColor: 'bg-green-500' }, // Green dot
  Perdido:            { badgeClass: 'bg-destructive/20 text-destructive', dotColor: 'bg-red-500' }, // Red dot
};


export const LOCAL_STORAGE_LEADS_KEY_PREFIX = 'leadsia_leads_';
export const LOCAL_FALLBACK_SOURCE = 'google_places_search_local_fallback';
