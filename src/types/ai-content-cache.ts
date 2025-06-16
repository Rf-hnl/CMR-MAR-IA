import { Timestamp } from 'firebase/firestore';
import type { WelcomeMessageInput } from '@/ai/flows/welcomeMessageFlow';
import type { EvaluateBusinessInput } from '@/ai/flows/evaluateBusinessFlow';
import type { SalesRecommendationsInput } from '@/ai/flows/salesRecommendationsFlow';

// Tipos para el cache de contenido de IA
export interface AIContentCacheEntry<T = any> {
  content: string;
  generatedAt: Timestamp | string;
  version: string; // Para versionado del contenido
  parameters: T; // Parámetros usados para generar el contenido
  isValid: boolean; // Para invalidación manual
  requestId?: string; // ID único de la solicitud
}

export interface AIContentCache {
  welcomeMessage?: AIContentCacheEntry<WelcomeMessageInput>;
  businessEvaluation?: AIContentCacheEntry<EvaluateBusinessInput>;
  salesRecommendations?: AIContentCacheEntry<SalesRecommendationsInput>;
  solutionEmail?: AIContentCacheEntry<any>;
  quotation?: AIContentCacheEntry<any>;
}

// Configuración de cache para diferentes tipos de contenido
export interface CacheConfig {
  maxAge: number; // Tiempo en milisegundos
  requiresParameterMatch: boolean; // Si debe coincidir exactamente los parámetros
  allowManualRefresh: boolean; // Si permite refrescar manualmente
}

export const AI_CACHE_CONFIGS: Record<keyof AIContentCache, CacheConfig> = {
  welcomeMessage: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    requiresParameterMatch: true,
    allowManualRefresh: true
  },
  businessEvaluation: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    requiresParameterMatch: false, // Las evaluaciones pueden reutilizarse aunque cambien algunos parámetros
    allowManualRefresh: true
  },
  salesRecommendations: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 días
    requiresParameterMatch: true,
    allowManualRefresh: true
  },
  solutionEmail: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    requiresParameterMatch: true,
    allowManualRefresh: true
  },
  quotation: {
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 días
    requiresParameterMatch: true,
    allowManualRefresh: true
  }
};

// Resultado de una operación de cache
export interface CacheResult<T> {
  content: T;
  fromCache: boolean;
  generatedAt: Date;
  requestId: string;
}

// Estadísticas de uso de cache
export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number; // Porcentaje
  lastUpdated: Date;
}