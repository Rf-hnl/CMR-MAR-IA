import { useState, useEffect } from 'react';
import { GeneralConfig, DEFAULT_GENERAL_CONFIG } from '@/types/general-config';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface UseGeneralConfigReturn {
  config: GeneralConfig | null;
  loading: boolean;
  error: string | null;
  updateConfig: (configData: Partial<GeneralConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  refreshConfig: () => Promise<void>;
}

export const useGeneralConfig = (): UseGeneralConfigReturn => {
  const [config, setConfig] = useState<GeneralConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const getAuthHeaders = async () => {
    if (!user) {
      console.error('Error al verificar inicialización: Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error al obtener token de autenticación:', error);
      throw new Error('Error al verificar inicialización');
    }
  };

  const fetchConfig = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const headers = await getAuthHeaders();
      const response = await fetch('/api/general-config', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('API Response:', responseText);
        throw new Error(`Error al cargar configuración: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Respuesta vacía del servidor');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        console.error('Response text:', responseText.substring(0, 500));
        throw new Error('El servidor devolvió una respuesta inválida');
      }
      
      if (data.config) {
        setConfig(data.config);
      } else {
        // Si no hay configuración, crear una con valores por defecto
        await createDefaultConfig();
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error al cargar configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfig = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/general-config', {
        method: 'POST',
        headers,
        body: JSON.stringify(DEFAULT_GENERAL_CONFIG),
      });

      if (!response.ok) {
        throw new Error('Error al crear configuración por defecto');
      }

      const data = await response.json();
      setConfig(data.config);
    } catch (err: any) {
      setError(err.message);
      console.error('Error al crear configuración por defecto:', err);
    }
  };

  const updateConfig = async (configData: Partial<GeneralConfig>) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/general-config', {
        method: 'PUT',
        headers,
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar configuración');
      }

      const data = await response.json();
      setConfig(data.config);

      toast({
        title: "Configuración Actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetConfig = async () => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      
      // Eliminar configuración actual
      await fetch('/api/general-config', {
        method: 'DELETE',
        headers,
      });

      // Crear nueva configuración con valores por defecto
      await createDefaultConfig();

      toast({
        title: "Configuración Restablecida",
        description: "Se han restaurado los valores por defecto.",
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = async () => {
    await fetchConfig();
  };

  useEffect(() => {
    if (user) {
      fetchConfig();
    }
  }, [user]);

  return {
    config,
    loading,
    error,
    updateConfig,
    resetConfig,
    refreshConfig,
  };
};

// Hook para acceder a configuraciones específicas
export const useCurrencyConfig = () => {
  const { config } = useGeneralConfig();
  
  const formatCurrency = (amount: number): string => {
    if (!config) return `${amount}€`;
    
    const { currency } = config;
    const formatted = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.code,
    }).format(amount);
    
    return formatted;
  };

  return {
    currency: config?.currency || DEFAULT_GENERAL_CONFIG.currency,
    formatCurrency,
  };
};

export const useThemeConfig = () => {
  const { config } = useGeneralConfig();
  
  return {
    theme: config?.theme || DEFAULT_GENERAL_CONFIG.theme,
  };
};

export const useLocaleConfig = () => {
  const { config } = useGeneralConfig();
  
  const formatDate = (date: Date): string => {
    if (!config) return date.toLocaleDateString('es-ES');
    
    const { locale } = config;
    return new Intl.DateTimeFormat(locale.language, {
      timeZone: locale.timezone,
    }).format(date);
  };

  return {
    locale: config?.locale || DEFAULT_GENERAL_CONFIG.locale,
    formatDate,
  };
};