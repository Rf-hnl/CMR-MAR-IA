import type { Lead } from '@/types';
import { ValuationConfig, LeadValuation } from '@/types/valuation';

export const calculateLeadValuation = (lead: Lead, config: ValuationConfig): LeadValuation => {
  // 1. Valor base según tipo de negocio (ganancia potencial real)
  const businessTypeKey = lead.businessType?.toLowerCase().replace(/\s+/g, '_') || 'default';
  const baseValue = config.businessTypeWeights[businessTypeKey] || config.businessTypeWeights.default;

  // 2. Lógica de valoración según etapa para proyección de ganancias
  let totalValue = 0;
  let stageMultiplier = 0;
  
  // Bonificaciones por completitud de datos
  let completenessBonus = 0;
  const dataCompletenessFacts: Array<{factor: string, value: number}> = [];
  
  if (lead.phone && lead.phone.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasPhone;
    dataCompletenessFacts.push({ factor: 'Teléfono', value: config.dataCompletenessWeights.hasPhone });
  }
  if (lead.email && lead.email.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasEmail;
    dataCompletenessFacts.push({ factor: 'Email', value: config.dataCompletenessWeights.hasEmail });
  }
  if (lead.website && lead.website.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasWebsite;
    dataCompletenessFacts.push({ factor: 'Sitio Web', value: config.dataCompletenessWeights.hasWebsite });
  }
  if (lead.address && lead.address.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasAddress;
    dataCompletenessFacts.push({ factor: 'Dirección', value: config.dataCompletenessWeights.hasAddress });
  }
  if (lead.businessType && lead.businessType.trim()) {
    completenessBonus += config.dataCompletenessWeights.hasBusinessType;
    dataCompletenessFacts.push({ factor: 'Tipo de Negocio', value: config.dataCompletenessWeights.hasBusinessType });
  }

  // Bonificaciones por interacciones de IA
  let aiBonus = 0;
  const aiInteractionFacts: Array<{factor: string, value: number}> = [];
  
  if (lead.phone || lead.email) {
    aiBonus += config.aiInteractionWeights.hasWelcomeMessage;
    aiInteractionFacts.push({ factor: 'Mensaje de Bienvenida', value: config.aiInteractionWeights.hasWelcomeMessage });
  }
  if (lead.businessType) {
    aiBonus += config.aiInteractionWeights.hasEvaluation;
    aiInteractionFacts.push({ factor: 'Evaluación de Negocio', value: config.aiInteractionWeights.hasEvaluation });
  }

  const adjustedBaseValue = baseValue + completenessBonus + aiBonus;

  // Lógica específica por etapa para proyección realista
  switch (lead.stage) {
    case 'Ganado':
      // Ganancia real confirmada (100%)
      totalValue = adjustedBaseValue;
      stageMultiplier = 1.0;
      break;
    case 'Perdido':
      // Pérdida: costo de oportunidad negativo
      totalValue = -(adjustedBaseValue * 0.1); // -10% como costo de oportunidad
      stageMultiplier = -0.1;
      break;
    case 'Negociación':
      // Alta probabilidad de ganancia (80%)
      totalValue = adjustedBaseValue * 0.8;
      stageMultiplier = 0.8;
      break;
    case 'Propuesta Enviada':
      // Probabilidad media-alta (60%)
      totalValue = adjustedBaseValue * 0.6;
      stageMultiplier = 0.6;
      break;
    case 'Calificado':
      // Probabilidad media (40%)
      totalValue = adjustedBaseValue * 0.4;
      stageMultiplier = 0.4;
      break;
    case 'Contactado':
      // Probabilidad baja-media (25%)
      totalValue = adjustedBaseValue * 0.25;
      stageMultiplier = 0.25;
      break;
    case 'Nuevo':
    default:
      // Probabilidad muy baja (10%)
      totalValue = adjustedBaseValue * 0.1;
      stageMultiplier = 0.1;
      break;
  }

  totalValue = Math.round(totalValue);

  return {
    baseValue,
    stageMultiplier,
    completenessBonus,
    aiBonus,
    totalValue,
    formattedValue: formatCurrency(totalValue),
    breakdown: {
      businessType: lead.businessType || 'Sin especificar',
      businessTypeValue: baseValue,
      stageValue: stageMultiplier,
      dataCompleteness: dataCompletenessFacts,
      aiInteractions: aiInteractionFacts
    }
  };
};

export const calculateStageTotal = (leads: Lead[], stage: string, config: ValuationConfig): number => {
  return leads
    .filter(lead => lead.stage === stage)
    .reduce((total, lead) => total + calculateLeadValuation(lead, config).totalValue, 0);
};

export const formatCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  // Para valores negativos, mostrar claramente el signo
  if (amount < 0) {
    return `-${formatter.format(Math.abs(amount))}`;
  }
  
  return formatter.format(amount);
};

// Función para obtener el color del valor según la cantidad y etapa
export const getValueColor = (value: number, stage?: string): string => {
  if (stage === 'Perdido') return 'text-red-600'; // Siempre rojo para perdidos
  if (stage === 'Ganado') return 'text-green-600'; // Siempre verde para ganados
  
  // Para etapas en proceso, colores según monto
  if (value >= 1000) return 'text-blue-600'; // Alto valor potencial
  if (value >= 500) return 'text-cyan-600'; // Buen valor potencial  
  if (value >= 200) return 'text-yellow-600'; // Valor moderado
  return 'text-gray-600'; // Valor bajo
};

// Función para obtener indicador visual del valor
export const getValueIndicator = (value: number): string => {
  if (value >= 1000) return '🔥'; // Alta valor
  if (value >= 500) return '⭐'; // Buen valor
  if (value >= 200) return '📈'; // Valor moderado
  return '💡'; // Valor básico
};