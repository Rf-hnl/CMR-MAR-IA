import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { 
  AIContentCache, 
  AIContentCacheEntry, 
  CacheResult, 
  CacheStats,
  AI_CACHE_CONFIGS 
} from '@/types/ai-content-cache';
import { AI_CACHE_CONFIGS } from '@/types/ai-content-cache';

export class AICacheManager {
  
  /**
   * Verifica si existe contenido válido en cache
   */
  static isCacheValid<T>(
    cacheEntry: AIContentCacheEntry<T> | undefined,
    contentType: keyof AIContentCache,
    currentParameters?: T
  ): boolean {
    if (!cacheEntry || !cacheEntry.isValid) {
      return false;
    }

    const config = AI_CACHE_CONFIGS[contentType];
    const now = Date.now();
    const generatedAt = cacheEntry.generatedAt instanceof Date 
      ? cacheEntry.generatedAt.getTime()
      : new Date(cacheEntry.generatedAt).getTime();

    // Verificar si no ha expirado
    if (now - generatedAt > config.maxAge) {
      return false;
    }

    // Verificar parámetros si es requerido
    if (config.requiresParameterMatch && currentParameters) {
      const cachedParams = JSON.stringify(cacheEntry.parameters);
      const currentParams = JSON.stringify(currentParameters);
      return cachedParams === currentParams;
    }

    return true;
  }

  /**
   * Obtiene contenido del cache o lo genera si no existe/es inválido
   */
  static async getOrGenerateContent<T, R>(
    leadId: string,
    contentType: keyof AIContentCache,
    generator: () => Promise<R>,
    parameters: T,
    aiContent?: AIContentCache
  ): Promise<CacheResult<R>> {
    const requestId = `${contentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Verificar cache existente
    const cacheEntry = aiContent?.[contentType] as AIContentCacheEntry<T> | undefined;
    
    if (this.isCacheValid(cacheEntry, contentType, parameters)) {
      console.log(`🎯 Cache HIT para ${contentType} en lead ${leadId}`);
      
      // Actualizar estadísticas de cache hit
      await this.updateCacheStats(leadId, true);
      
      return {
        content: cacheEntry!.content as R,
        fromCache: true,
        generatedAt: new Date(cacheEntry!.generatedAt),
        requestId: cacheEntry!.requestId || requestId
      };
    }

    console.log(`🔄 Cache MISS para ${contentType} en lead ${leadId} - Generando nuevo contenido`);
    
    // Generar nuevo contenido
    const newContent = await generator();
    
    // Guardar en cache
    await this.saveToCache(leadId, contentType, newContent, parameters, requestId);
    
    // Actualizar estadísticas de cache miss
    await this.updateCacheStats(leadId, false);
    
    return {
      content: newContent,
      fromCache: false,
      generatedAt: new Date(),
      requestId
    };
  }

  /**
   * Guarda contenido en el cache del lead
   */
  static async saveToCache<T, R>(
    leadId: string,
    contentType: keyof AIContentCache,
    content: R,
    parameters: T,
    requestId: string
  ): Promise<void> {
    try {
      const leadRef = doc(db, 'leads-flow', leadId);
      
      const cacheEntry: AIContentCacheEntry<T> = {
        content: typeof content === 'string' ? content : JSON.stringify(content),
        generatedAt: serverTimestamp(),
        version: '1.0',
        parameters,
        isValid: true,
        requestId
      };

      const updateData = {
        [`aiContent.${contentType}`]: cacheEntry,
        updatedAt: serverTimestamp()
      };

      await updateDoc(leadRef, updateData);
      
      console.log(`💾 Contenido ${contentType} guardado en cache para lead ${leadId}`);
    } catch (error) {
      console.error(`❌ Error guardando cache ${contentType} para lead ${leadId}:`, error);
      // No fallar si no se puede guardar el cache
    }
  }

  /**
   * Invalida un tipo específico de contenido en cache
   */
  static async invalidateCache(
    leadId: string,
    contentType: keyof AIContentCache
  ): Promise<void> {
    try {
      const leadRef = doc(db, 'leads-flow', leadId);
      
      const updateData = {
        [`aiContent.${contentType}.isValid`]: false,
        updatedAt: serverTimestamp()
      };

      await updateDoc(leadRef, updateData);
      
      console.log(`🗑️ Cache ${contentType} invalidado para lead ${leadId}`);
    } catch (error) {
      console.error(`❌ Error invalidando cache ${contentType} para lead ${leadId}:`, error);
    }
  }

  /**
   * Invalida todo el cache de IA para un lead
   */
  static async invalidateAllCache(leadId: string): Promise<void> {
    try {
      const leadRef = doc(db, 'leads-flow', leadId);
      
      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp()
      };

      // Invalidar cada tipo de contenido
      Object.keys(AI_CACHE_CONFIGS).forEach(contentType => {
        updateData[`aiContent.${contentType}.isValid`] = false;
      });

      await updateDoc(leadRef, updateData);
      
      console.log(`🗑️ Todo el cache de IA invalidado para lead ${leadId}`);
    } catch (error) {
      console.error(`❌ Error invalidando todo el cache para lead ${leadId}:`, error);
    }
  }

  /**
   * Actualiza estadísticas de cache
   */
  static async updateCacheStats(
    leadId: string,
    wasHit: boolean
  ): Promise<void> {
    try {
      const leadRef = doc(db, 'leads-flow', leadId);
      
      // En un escenario ideal, esto se haría con una transacción
      // Por simplicidad, hacemos una actualización directa
      const updateData = {
        'aiCacheStats.totalRequests': serverTimestamp(), // Firestore increment
        'aiCacheStats.lastUpdated': serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (wasHit) {
        updateData['aiCacheStats.cacheHits'] = serverTimestamp(); // Firestore increment
      } else {
        updateData['aiCacheStats.cacheMisses'] = serverTimestamp(); // Firestore increment
      }

      await updateDoc(leadRef, updateData);
    } catch (error) {
      console.error(`❌ Error actualizando estadísticas de cache para lead ${leadId}:`, error);
    }
  }

  /**
   * Obtiene estadísticas de cache para un lead
   */
  static getCacheInfo(aiContent?: AIContentCache): {
    cachedItems: Array<{
      type: keyof AIContentCache;
      generatedAt: Date;
      isValid: boolean;
      fromCache: boolean;
    }>;
    totalCachedItems: number;
  } {
    const cachedItems: Array<{
      type: keyof AIContentCache;
      generatedAt: Date;
      isValid: boolean;
      fromCache: boolean;
    }> = [];

    if (aiContent) {
      Object.entries(aiContent).forEach(([type, entry]) => {
        if (entry) {
          cachedItems.push({
            type: type as keyof AIContentCache,
            generatedAt: new Date(entry.generatedAt),
            isValid: entry.isValid,
            fromCache: this.isCacheValid(entry, type as keyof AIContentCache)
          });
        }
      });
    }

    return {
      cachedItems,
      totalCachedItems: cachedItems.length
    };
  }

  /**
   * Verifica si el cache necesita limpieza
   */
  static needsCleanup(aiContent?: AIContentCache): boolean {
    if (!aiContent) return false;

    const now = Date.now();
    return Object.entries(aiContent).some(([type, entry]) => {
      if (!entry) return false;
      
      const config = AI_CACHE_CONFIGS[type as keyof AIContentCache];
      const generatedAt = new Date(entry.generatedAt).getTime();
      
      // Necesita limpieza si ha expirado hace más de 7 días
      return (now - generatedAt) > (config.maxAge + 7 * 24 * 60 * 60 * 1000);
    });
  }
}

// Helper para usar en las APIs
export async function withAICache<T, R>(
  leadId: string,
  contentType: keyof AIContentCache,
  generator: () => Promise<R>,
  parameters: T,
  aiContent?: AIContentCache
): Promise<CacheResult<R>> {
  return AICacheManager.getOrGenerateContent(
    leadId,
    contentType,
    generator,
    parameters,
    aiContent
  );
}