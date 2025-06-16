import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

export const LOCAL_STORAGE_LEADS_KEY_PREFIX = 'leadsia_leads_';
export const LOCAL_FALLBACK_SOURCE = 'google_places_search_local_fallback';

export const LEAD_STAGES = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

export type LeadStage = typeof LEAD_STAGES[number];

export const stageColors: Record<LeadStage, string> = {
  Nuevo: 'from-gray-300 to-gray-400 text-gray-800',
  Contactado: 'from-blue-500 to-blue-600 text-white',
  Calificado: 'from-purple-500 to-purple-600 text-white',
  'Propuesta Enviada': 'from-orange-500 to-orange-600 text-white',
  Negociación: 'from-yellow-500 to-amber-600 text-black',
  Ganado: 'from-green-500 to-emerald-600 text-white',
  Perdido: 'from-red-500 to-red-600 text-white',
};

export const stageIndicatorColors: Record<LeadStage, string> = {
  Nuevo: 'bg-gray-400',
  Contactado: 'bg-blue-500',
  Calificado: 'bg-purple-500',
  'Propuesta Enviada': 'bg-orange-500',
  Negociación: 'bg-yellow-500',
  Ganado: 'bg-green-500',
  Perdido: 'bg-red-500',
};

export const stageColumnColors: Record<LeadStage, string> = {
  Nuevo: 'from-gray-50/50 to-gray-100/30 border-gray-200/50',
  Contactado: 'from-blue-50/50 to-blue-50/30 border-blue-200/50',
  Calificado: 'from-purple-50/50 to-purple-50/30 border-purple-200/50',
  'Propuesta Enviada': 'from-orange-50/50 to-orange-50/30 border-orange-200/50',
  Negociación: 'from-yellow-50/50 to-yellow-50/30 border-yellow-200/50',
  Ganado: 'from-green-50/50 to-green-50/30 border-green-200/50',
  Perdido: 'from-red-50/50 to-red-50/30 border-red-200/50',
};

export const stageBorderColors: Record<LeadStage, string> = {
  Nuevo: 'border-gray-300 shadow-gray-200/20',
  Contactado: 'border-blue-300 shadow-blue-200/20',
  Calificado: 'border-purple-300 shadow-purple-200/20',
  'Propuesta Enviada': 'border-orange-300 shadow-orange-200/20',
  Negociación: 'border-yellow-300 shadow-yellow-200/20',
  Ganado: 'border-green-300 shadow-green-200/20',
  Perdido: 'border-red-300 shadow-red-200/20',
};

export const stageCardBackgrounds: Record<LeadStage, string> = {
  Nuevo: 'from-gray-50/80 to-white',
  Contactado: 'from-blue-50/80 to-white',
  Calificado: 'from-purple-50/80 to-white',
  'Propuesta Enviada': 'from-orange-50/80 to-white',
  Negociación: 'from-yellow-50/80 to-white',
  Ganado: 'from-green-50/80 to-white',
  Perdido: 'from-red-50/80 to-white',
};

export function formatFirestoreTimestamp(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof FirestoreTimestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    // Check if it's already an ISO string (or close enough)
    if (timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return timestamp;
    }
    // Try to parse it as a date string
    const parsedDate = new Date(timestamp);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
    }
  }
  // Fallback for Firestore Timestamp-like objects that aren't instances
  try {
    if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toISOString();
    }
  } catch (e) {
    // Log error if specific parsing failed, before falling back to current date
    console.warn("Could not parse timestamp, using current date as fallback:", timestamp, e);
  }
  return new Date().toISOString();
}

export function isFieldMissing(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value.trim() === "") return true;
  const lowerValue = value.toLowerCase();
  return lowerValue === "sin direccion" || lowerValue === "n/a" || lowerValue === "no disponible" || lowerValue === "desconocido" || lowerValue === "null" || lowerValue === "undefined";
}

export function generateWhatsAppLink(lead: { phone?: string | null }): string | null {
  if (!lead.phone || isFieldMissing(lead.phone)) return null;
  const phoneNumber = lead.phone.replace(/\D/g, '');
  return `https://wa.me/${phoneNumber}`;
}