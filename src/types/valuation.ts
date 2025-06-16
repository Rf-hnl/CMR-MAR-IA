export interface BusinessTypeWeights {
  [key: string]: number;
}

export interface StageMultipliers {
  [stage: string]: number;
}

export interface DataCompletenessWeights {
  hasPhone: number;
  hasEmail: number;
  hasWebsite: number;
  hasAddress: number;
  hasBusinessType: number;
}

export interface AIInteractionWeights {
  hasWelcomeMessage: number;
  hasEvaluation: number;
  hasRecommendations: number;
  hasSolutionEmail: number;
}

export interface ValuationConfig {
  id?: string;
  name: string;
  description: string;
  businessTypeWeights: BusinessTypeWeights;
  stageMultipliers: StageMultipliers;
  dataCompletenessWeights: DataCompletenessWeights;
  aiInteractionWeights: AIInteractionWeights;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export interface LeadValuation {
  baseValue: number;
  stageMultiplier: number;
  completenessBonus: number;
  aiBonus: number;
  totalValue: number;
  formattedValue: string;
  breakdown: {
    businessType: string;
    businessTypeValue: number;
    stageValue: number;
    dataCompleteness: Array<{
      factor: string;
      value: number;
    }>;
    aiInteractions: Array<{
      factor: string;
      value: number;
    }>;
  };
}