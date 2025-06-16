import type { Lead } from '@/types';

// Factores de valoración basados en características del lead
const VALUE_FACTORS = {
  // Tipo de negocio (multiplicadores base)
  businessType: {
    'restaurant': 800,
    'retail': 600,
    'hotel': 1200,
    'clinic': 1000,
    'pharmacy': 700,
    'supermarket': 900,
    'gas_station': 500,
    'beauty_salon': 400,
    'gym': 500,
    'automotive': 600,
    'professional_services': 750,
    'default': 500
  },

  // Etapa del lead (multiplicadores de probabilidad)
  stage: {
    'Prospecto': 0.1,
    'Contactado': 0.25,
    'Interesado': 0.4,
    'Propuesta': 0.7,
    'Negociación': 0.85,
    'Vendido': 1.0,
    'Perdido': 0.0
  },

  // Bonificaciones por información disponible
  dataCompleteness: {
    hasPhone: 50,
    hasEmail: 30,
    hasWebsite: 100,
    hasAddress: 20,
    hasBusinessType: 80
  },

  // Bonificaciones por actividad de IA
  aiInteraction: {
    hasWelcomeMessage: 25,
    hasEvaluation: 50,
    hasRecommendations: 75,
    hasSolutionEmail: 100
  }
};

export interface LeadValue {
  baseValue: number;
  stageMultiplier: number;
  completenessBonus: number;
  aiBonus: number;
  totalValue: number;
  formattedValue: string;
}

export const calculateLeadValue = (lead: Lead): LeadValue => {
  // 1. Valor base según tipo de negocio
  const businessTypeKey = lead.businessType?.toLowerCase().replace(/\s+/g, '_') || 'default';
  const baseValue = VALUE_FACTORS.businessType[businessTypeKey as keyof typeof VALUE_FACTORS.businessType] 
    || VALUE_FACTORS.businessType.default;

  // 2. Multiplicador por etapa
  const stageMultiplier = VALUE_FACTORS.stage[lead.stage as keyof typeof VALUE_FACTORS.stage] || 0.1;

  // 3. Bonificaciones por completitud de datos
  let completenessBonus = 0;
  if (lead.phone && lead.phone.trim()) completenessBonus += VALUE_FACTORS.dataCompleteness.hasPhone;
  if (lead.email && lead.email.trim()) completenessBonus += VALUE_FACTORS.dataCompleteness.hasEmail;
  if (lead.website && lead.website.trim()) completenessBonus += VALUE_FACTORS.dataCompleteness.hasWebsite;
  if (lead.address && lead.address.trim()) completenessBonus += VALUE_FACTORS.dataCompleteness.hasAddress;
  if (lead.businessType && lead.businessType.trim()) completenessBonus += VALUE_FACTORS.dataCompleteness.hasBusinessType;

  // 4. Bonificaciones por interacciones de IA (simuladas basadas en campos existentes)
  let aiBonus = 0;
  // Aquí podrías agregar lógica para detectar si se han ejecutado acciones de IA
  // Por ahora, usaremos heurísticas basadas en datos existentes
  if (lead.phone || lead.email) aiBonus += VALUE_FACTORS.aiInteraction.hasWelcomeMessage;
  if (lead.businessType) aiBonus += VALUE_FACTORS.aiInteraction.hasEvaluation;
  
  // 5. Cálculo final
  const adjustedBaseValue = baseValue + completenessBonus + aiBonus;
  const totalValue = Math.round(adjustedBaseValue * stageMultiplier);

  return {
    baseValue,
    stageMultiplier,
    completenessBonus,
    aiBonus,
    totalValue,
    formattedValue: formatCurrency(totalValue)
  };
};

export const calculateStageTotal = (leads: Lead[], stage: string): number => {
  return leads
    .filter(lead => lead.stage === stage)
    .reduce((total, lead) => total + calculateLeadValue(lead).totalValue, 0);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Función para obtener el color del valor según la cantidad
export const getValueColor = (value: number): string => {
  if (value >= 1000) return 'text-green-600';
  if (value >= 500) return 'text-blue-600';
  if (value >= 200) return 'text-orange-600';
  return 'text-gray-600';
};

// Función para obtener indicador visual del valor
export const getValueIndicator = (value: number): string => {
  if (value >= 1000) return '🔥'; // Alta valor
  if (value >= 500) return '⭐'; // Buen valor
  if (value >= 200) return '📈'; // Valor moderado
  return '💡'; // Valor básico
};