import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import type { Organization, OrganizationMember, OrganizationInvite } from '@/types/organization';

export function useOrganization() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create default organization for new users
  const createDefaultOrganization = useCallback(async () => {
    if (!user?.uid || !user?.email) {
      console.error('No user data available for creating organization');
      return null;
    }

    try {
      const displayName = user.displayName || user.email.split('@')[0];
      const defaultOrg = {
        name: `Organización de ${displayName}`,
        description: 'Organización predeterminada',
        ownerId: user.uid,
        memberIds: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          allowMemberInvites: true,
          defaultLeadStage: 'Nuevo',
          timezone: 'America/Mexico_City'
        }
      };

      console.log('Creating default organization:', defaultOrg);
      const docRef = await addDoc(collection(db, 'organizations'), defaultOrg);
      console.log('Organization created with ID:', docRef.id);
      
      const newOrg: Organization = {
        id: docRef.id,
        name: defaultOrg.name,
        description: defaultOrg.description,
        ownerId: defaultOrg.ownerId,
        memberIds: defaultOrg.memberIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: defaultOrg.settings
      };

      setOrganizations([newOrg]);
      setCurrentOrganization(newOrg);
      setError(null);
      return newOrg;
    } catch (err) {
      console.error('Error creating default organization:', err);
      setError('Error al crear organización predeterminada');
      return null;
    }
  }, [user]);

  // Load user's organizations
  const loadUserOrganizations = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading organizations for user:', user.uid);
      
      // Query organizations where user is owner or member
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('memberIds', 'array-contains', user.uid)
      );

      const snapshot = await getDocs(orgsQuery);
      console.log('📊 Found', snapshot.size, 'organizations');
      
      const orgs = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Organization data:', doc.id, data);
        return {
          id: doc.id,
          name: data.name || 'Organización Sin Nombre',
          description: data.description || '',
          ownerId: data.ownerId || user.uid,
          memberIds: data.memberIds || [user.uid],
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          settings: data.settings || {
            allowMemberInvites: true,
            defaultLeadStage: 'Nuevo',
            timezone: 'America/Mexico_City'
          }
        };
      }) as Organization[];

      // Sort manually by creation date (newest first)
      orgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrganizations(orgs);
      
      // Set current organization (first one or create default)
      if (orgs.length > 0) {
        console.log('✅ Setting current organization:', orgs[0].name);
        setCurrentOrganization(orgs[0]);
      } else {
        console.log('🏗️ No organizations found, creating default...');
        // Create default organization for user
        await createDefaultOrganization();
      }
    } catch (err) {
      console.error('💥 Error loading organizations:', err);
      // If query fails due to missing collection, try to create default organization
      try {
        console.log('🔄 Attempting to create default organization after error...');
        await createDefaultOrganization();
      } catch (createErr) {
        console.error('💥 Error creating default organization:', createErr);
        setError('Error al cargar organizaciones. Creando organización local...');
        // Fallback to local organization
        createLocalFallbackOrganization();
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid, createDefaultOrganization]);

  // Create local fallback organization if Firestore fails
  const createLocalFallbackOrganization = useCallback(() => {
    if (!user?.uid || !user?.email) return;

    const displayName = user.displayName || user.email.split('@')[0];
    const localOrg: Organization = {
      id: `local_${user.uid}`,
      name: `Organización Local de ${displayName}`,
      description: 'Organización temporal (solo local)',
      ownerId: user.uid,
      memberIds: [user.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowMemberInvites: false, // Disabled for local org
        defaultLeadStage: 'Nuevo',
        timezone: 'America/Mexico_City'
      }
    };

    setOrganizations([localOrg]);
    setCurrentOrganization(localOrg);
    setError(null);
    console.log('🏠 Created local fallback organization');
  }, [user]);

  // Create new organization
  const createOrganization = useCallback(async (name: string, description?: string) => {
    if (!user?.uid) throw new Error('Usuario no autenticado');

    try {
      console.log('🏗️ Creating new organization:', { name, description });
      
      const orgData = {
        name: name.trim(),
        description: description?.trim() || '',
        ownerId: user.uid,
        memberIds: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          allowMemberInvites: true,
          defaultLeadStage: 'Nuevo',
          timezone: 'America/Mexico_City'
        }
      };

      const docRef = await addDoc(collection(db, 'organizations'), orgData);
      console.log('✅ Organization created with ID:', docRef.id);
      
      const newOrg: Organization = {
        id: docRef.id,
        name: orgData.name,
        description: orgData.description,
        ownerId: orgData.ownerId,
        memberIds: orgData.memberIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: orgData.settings
      };

      setOrganizations(prev => [newOrg, ...prev]);
      setCurrentOrganization(newOrg);
      
      // Store in localStorage for persistence
      localStorage.setItem('currentOrganizationId', newOrg.id);
      
      return newOrg;
    } catch (err) {
      console.error('💥 Error creating organization:', err);
      throw new Error('Error al crear organización');
    }
  }, [user]);

  // Add member to organization
  const addMember = useCallback(async (orgId: string, email: string, role: 'admin' | 'member' = 'member') => {
    if (!user?.uid) throw new Error('Usuario no autenticado');

    try {
      console.log('👥 Adding member to organization:', { orgId, email, role });
      
      // Create invite with unique ID for link generation
      const inviteData = {
        organizationId: orgId,
        email: email.trim().toLowerCase(),
        role,
        invitedBy: user.uid,
        invitedByEmail: user.email,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending' as const
      };

      const inviteRef = await addDoc(collection(db, 'organizationInvites'), inviteData);
      console.log('✅ Invite created with ID:', inviteRef.id);
      
      // Generate invitation link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const inviteLink = `${baseUrl}/invite/${inviteRef.id}`;
      
      console.log('🔗 Invitation link generated:', inviteLink);
      
      return { 
        inviteId: inviteRef.id, 
        inviteLink,
        success: true 
      };
    } catch (err) {
      console.error('💥 Error adding member:', err);
      throw new Error('Error al invitar miembro');
    }
  }, [user]);

  // Switch current organization
  const switchOrganization = useCallback((org: Organization) => {
    setCurrentOrganization(org);
    localStorage.setItem('currentOrganizationId', org.id);
  }, []);

  useEffect(() => {
    loadUserOrganizations();
  }, [loadUserOrganizations]);

  // Load saved organization from localStorage
  useEffect(() => {
    const savedOrgId = localStorage.getItem('currentOrganizationId');
    if (savedOrgId && organizations.length > 0) {
      const savedOrg = organizations.find(org => org.id === savedOrgId);
      if (savedOrg) {
        setCurrentOrganization(savedOrg);
      }
    }
  }, [organizations]);

  return {
    organizations,
    currentOrganization,
    members,
    loading,
    error,
    createOrganization,
    addMember,
    switchOrganization,
    reload: loadUserOrganizations
  };
}