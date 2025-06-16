import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface UseFirebaseInitReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  initializeCollections: () => Promise<void>;
}

export const useFirebaseInit = (): UseFirebaseInitReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getAuthHeaders = async () => {
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const checkInitialization = async () => {
    if (!user) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/initialize-user', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Error al verificar inicialización');
      }

      const data = await response.json();
      setIsInitialized(data.collectionsInitialized);
    } catch (err: any) {
      setError(err.message);
      console.error('Error al verificar inicialización:', err);
    }
  };

  const initializeCollections = async () => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setIsInitializing(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/initialize-user', {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al inicializar colecciones');
      }

      const data = await response.json();
      setIsInitialized(true);
      
      console.log('✅ Colecciones inicializadas:', data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error al inicializar colecciones:', err);
      throw err;
    } finally {
      setIsInitializing(false);
    }
  };

  // Auto-verificar y auto-inicializar al cargar
  useEffect(() => {
    if (user) {
      checkInitialization().then(() => {
        // Si no está inicializado, inicializar automáticamente
        if (!isInitialized) {
          initializeCollections().catch(err => {
            console.error('Error en auto-inicialización:', err);
          });
        }
      });
    }
  }, [user]);

  return {
    isInitialized,
    isInitializing,
    error,
    initializeCollections,
  };
};