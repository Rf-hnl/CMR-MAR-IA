import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PromptConfig, PromptTemplate, DEFAULT_PROMPT_TEMPLATES, DEFAULT_GLOBAL_SETTINGS } from '@/types/ai-prompts';

interface UsePromptConfigReturn {
  promptConfig: PromptConfig | null;
  loading: boolean;
  error: string | null;
  saveConfig: (config: PromptConfig) => Promise<void>;
  loadConfig: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  updateTemplate: (templateId: string, updates: Partial<PromptTemplate>) => void;
  addTemplate: (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'version'>) => void;
  removeTemplate: (templateId: string) => void;
  getTemplateByName: (name: string) => PromptTemplate | null;
  isModified: boolean;
  saving: boolean;
  lastSaved: Date | null;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export function usePromptConfig(): UsePromptConfigReturn {
  const { user } = useAuth();
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<PromptConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Check if config has been modified
  const isModified = promptConfig && originalConfig ? 
    JSON.stringify(promptConfig) !== JSON.stringify(originalConfig) : false;

  const getAuthHeaders = useCallback(async () => {
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [user]);

  const createDefaultConfig = useCallback((): PromptConfig => {
    if (!user) throw new Error('Usuario no autenticado');
    
    return {
      userId: user.uid,
      templates: DEFAULT_PROMPT_TEMPLATES.map((template, index) => ({
        ...template,
        id: `template_${Date.now()}_${index}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
        version: 1
      })),
      globalSettings: DEFAULT_GLOBAL_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }, [user]);

  const loadConfig = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/ai-prompts', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          // Convert date strings back to Date objects
          const config: PromptConfig = {
            ...data.config,
            createdAt: new Date(data.config.createdAt),
            updatedAt: new Date(data.config.updatedAt),
            templates: data.config.templates.map((template: any) => ({
              ...template,
              createdAt: new Date(template.createdAt),
              updatedAt: new Date(template.updatedAt)
            }))
          };
          setPromptConfig(config);
          setOriginalConfig(JSON.parse(JSON.stringify(config)));
        } else {
          // No config found, create default
          const defaultConfig = createDefaultConfig();
          setPromptConfig(defaultConfig);
          setOriginalConfig(JSON.parse(JSON.stringify(defaultConfig)));
        }
      } else if (response.status === 404) {
        // Config doesn't exist, create default
        const defaultConfig = createDefaultConfig();
        setPromptConfig(defaultConfig);
        setOriginalConfig(JSON.parse(JSON.stringify(defaultConfig)));
      } else {
        throw new Error('Error al cargar la configuración');
      }
    } catch (err) {
      console.error('Error loading prompt config:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      
      // Fallback to default config
      try {
        const defaultConfig = createDefaultConfig();
        setPromptConfig(defaultConfig);
        setOriginalConfig(JSON.parse(JSON.stringify(defaultConfig)));
      } catch (defaultErr) {
        console.error('Error creating default config:', defaultErr);
      }
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, createDefaultConfig]);

  const saveConfig = useCallback(async (config: PromptConfig) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      setSaving(true);
      setSyncStatus('saving');
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/ai-prompts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la configuración');
      }

      // Update local state
      const updatedConfig = {
        ...config,
        updatedAt: new Date()
      };
      setPromptConfig(updatedConfig);
      setOriginalConfig(JSON.parse(JSON.stringify(updatedConfig)));
      setLastSaved(new Date());
      setSyncStatus('saved');
      
      // Reset to idle after showing "saved" for 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);
      
    } catch (err) {
      console.error('Error saving prompt config:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setSyncStatus('error');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [user, getAuthHeaders]);

  const resetToDefaults = useCallback(async () => {
    if (!user) return;

    try {
      const defaultConfig = createDefaultConfig();
      await saveConfig(defaultConfig);
    } catch (err) {
      console.error('Error resetting to defaults:', err);
      throw err;
    }
  }, [user, createDefaultConfig, saveConfig]);

  const updateTemplate = useCallback((templateId: string, updates: Partial<PromptTemplate>) => {
    if (!promptConfig) return;

    const updatedTemplates = promptConfig.templates.map(template =>
      template.id === templateId
        ? { ...template, ...updates, updatedAt: new Date() }
        : template
    );

    setPromptConfig({
      ...promptConfig,
      templates: updatedTemplates,
      updatedAt: new Date()
    });
  }, [promptConfig]);

  const addTemplate = useCallback((template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'version'>) => {
    if (!promptConfig || !user) return;

    const newTemplate: PromptTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.uid,
      version: 1
    };

    setPromptConfig({
      ...promptConfig,
      templates: [...promptConfig.templates, newTemplate],
      updatedAt: new Date()
    });
  }, [promptConfig, user]);

  const removeTemplate = useCallback((templateId: string) => {
    if (!promptConfig) return;

    const updatedTemplates = promptConfig.templates.filter(template => template.id !== templateId);

    setPromptConfig({
      ...promptConfig,
      templates: updatedTemplates,
      updatedAt: new Date()
    });
  }, [promptConfig]);

  const getTemplateByName = useCallback((name: string): PromptTemplate | null => {
    if (!promptConfig) return null;
    return promptConfig.templates.find(template => template.name === name) || null;
  }, [promptConfig]);

  // Load config when user changes
  useEffect(() => {
    if (user) {
      loadConfig();
    } else {
      setPromptConfig(null);
      setOriginalConfig(null);
      setLoading(false);
      setError(null);
    }
  }, [user, loadConfig]);

  return {
    promptConfig,
    loading,
    error,
    saveConfig,
    loadConfig,
    resetToDefaults,
    updateTemplate,
    addTemplate,
    removeTemplate,
    getTemplateByName,
    isModified,
    saving,
    lastSaved,
    syncStatus
  };
}