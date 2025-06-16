import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import type { Organization } from '@/types/organization';

export function useOrganizationSimple() {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a simple default organization for the user
  const createSimpleOrganization = useCallback(() => {
    if (!user?.uid || !user?.email) return null;

    const displayName = user.displayName || user.email.split('@')[0];
    const simpleOrg: Organization = {
      id: `org_${user.uid}`, // Simple ID based on user UID
      name: `Organización de ${displayName}`,
      description: 'Organización predeterminada',
      ownerId: user.uid,
      memberIds: [user.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowMemberInvites: true,
        defaultLeadStage: 'Nuevo',
        timezone: 'America/Mexico_City'
      }
    };

    return simpleOrg;
  }, [user]);

  // Initialize organization
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For now, always create a simple organization based on user
      // This avoids Firestore permission issues
      const org = createSimpleOrganization();
      if (org) {
        setCurrentOrganization(org);
      } else {
        setError('No se pudo crear la organización');
      }
    } catch (err) {
      console.error('Error initializing organization:', err);
      setError('Error al inicializar organización');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, createSimpleOrganization]);

  return {
    currentOrganization,
    loading,
    error,
    organizations: currentOrganization ? [currentOrganization] : [],
    // Mock functions for compatibility
    createOrganization: async () => { throw new Error('Función no implementada aún'); },
    addMember: async () => { throw new Error('Función no implementada aún'); },
    switchOrganization: () => {},
    reload: () => {}
  };
}