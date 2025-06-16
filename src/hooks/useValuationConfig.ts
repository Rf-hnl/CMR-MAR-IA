"use client";

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { ValuationConfig } from '@/types/valuation';
import { DEFAULT_VALUATION_CONFIG } from '@/config/defaultValuationConfig';

export const useValuationConfig = () => {
  const [configs, setConfigs] = useState<ValuationConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<ValuationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth();

  const fetchConfigs = async () => {
    try {
      if (!auth.currentUser) {
        setError('Usuario no autenticado');
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/valuation-config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener configuraciones');
      }

      const data = await response.json();
      setConfigs(data.configs);
      
      // Establecer configuración activa
      const active = data.configs.find((config: ValuationConfig) => config.isActive);
      setActiveConfig(active || data.configs[0] || { ...DEFAULT_VALUATION_CONFIG, id: 'default' });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Fallback a configuración por defecto
      setActiveConfig({ ...DEFAULT_VALUATION_CONFIG, id: 'default' });
    } finally {
      setLoading(false);
    }
  };

  const createConfig = async (configData: Omit<ValuationConfig, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/valuation-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        throw new Error('Error al crear configuración');
      }

      const newConfig = await response.json();
      setConfigs(prev => [newConfig, ...prev]);
      
      if (newConfig.isActive) {
        setActiveConfig(newConfig);
        // Actualizar otras configuraciones como inactivas
        setConfigs(prev => prev.map(config => 
          config.id !== newConfig.id ? { ...config, isActive: false } : config
        ));
      }

      return newConfig;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear configuración');
      throw err;
    }
  };

  const updateConfig = async (id: string, configData: Partial<ValuationConfig>) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/valuation-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, ...configData }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar configuración');
      }

      const updatedConfig = await response.json();
      setConfigs(prev => prev.map(config => 
        config.id === id ? updatedConfig : (updatedConfig.isActive ? { ...config, isActive: false } : config)
      ));

      if (updatedConfig.isActive) {
        setActiveConfig(updatedConfig);
      }

      return updatedConfig;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar configuración');
      throw err;
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/valuation-config?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar configuración');
      }

      setConfigs(prev => prev.filter(config => config.id !== id));
      
      // Si se eliminó la configuración activa, activar otra
      if (activeConfig?.id === id) {
        const remaining = configs.filter(config => config.id !== id);
        setActiveConfig(remaining[0] || { ...DEFAULT_VALUATION_CONFIG, id: 'default' });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar configuración');
      throw err;
    }
  };

  const setActiveConfiguration = async (id: string) => {
    const config = configs.find(c => c.id === id);
    if (config) {
      await updateConfig(id, { isActive: true });
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      fetchConfigs();
    }
  }, [auth.currentUser]);

  return {
    configs,
    activeConfig,
    loading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    setActiveConfiguration,
    refreshConfigs: fetchConfigs,
  };
};