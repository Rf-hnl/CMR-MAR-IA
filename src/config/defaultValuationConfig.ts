import { ValuationConfig } from '@/types/valuation';

export const DEFAULT_VALUATION_CONFIG: Omit<ValuationConfig, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
  name: 'Configuración Estándar TPV',
  description: 'Configuración predeterminada para valoración de leads de TPV y servicios de pago',
  isActive: true,
  businessTypeWeights: {
    restaurant: 800,
    retail: 600,
    hotel: 1200,
    clinic: 1000,
    pharmacy: 700,
    supermarket: 900,
    gas_station: 500,
    beauty_salon: 400,
    gym: 500,
    automotive: 600,
    professional_services: 750,
    bar: 600,
    bakery: 500,
    electronics: 700,
    clothing: 550,
    jewelry: 800,
    bookstore: 400,
    furniture: 650,
    default: 500
  },
  stageMultipliers: {
    'Prospecto': 0.1,
    'Contactado': 0.25,
    'Interesado': 0.4,
    'Propuesta': 0.7,
    'Negociación': 0.85,
    'Vendido': 1.0,
    'Perdido': 0.0
  },
  dataCompletenessWeights: {
    hasPhone: 50,
    hasEmail: 30,
    hasWebsite: 100,
    hasAddress: 20,
    hasBusinessType: 80
  },
  aiInteractionWeights: {
    hasWelcomeMessage: 25,
    hasEvaluation: 50,
    hasRecommendations: 75,
    hasSolutionEmail: 100
  }
};