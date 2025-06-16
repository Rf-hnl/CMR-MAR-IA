"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { 
  doc, 
  updateDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

export interface UserActivity {
  id: string;
  type: 'login' | 'profile_update' | 'password_change' | 'email_verify' | 'organization_join';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserStats {
  totalLogins: number;
  lastLogin: string;
  profileUpdates: number;
  organizationsCount: number;
  leadsCount: number;
  accountAge: number; // days since creation
}

export function useUserProfile() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user activities
  const loadUserActivities = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      
      // In a real app, you'd have an activities collection
      // For now, we'll simulate some activities
      const mockActivities: UserActivity[] = [
        {
          id: '1',
          type: 'login',
          description: 'Inicio de sesión exitoso',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'profile_update',
          description: 'Perfil actualizado',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'organization_join',
          description: 'Se unió a una organización',
          timestamp: userProfile?.createdAt || new Date().toISOString(),
        }
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, userProfile?.createdAt]);

  // Load user statistics
  const loadUserStats = useCallback(async () => {
    if (!user?.uid || !userProfile) return;

    try {
      // Calculate account age
      const accountAge = Math.floor(
        (new Date().getTime() - new Date(userProfile.createdAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      // Load organizations count
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('memberIds', 'array-contains', user.uid)
      );
      const orgsSnapshot = await getDocs(orgsQuery);

      // Load leads count
      const leadsQuery = query(
        collection(db, 'leads'),
        where('uid', '==', user.uid)
      );
      const leadsSnapshot = await getDocs(leadsQuery);

      const userStats: UserStats = {
        totalLogins: 1, // Would track in real app
        lastLogin: new Date().toISOString(),
        profileUpdates: 1, // Would track in real app
        organizationsCount: orgsSnapshot.size,
        leadsCount: leadsSnapshot.size,
        accountAge
      };

      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user?.uid, userProfile]);

  // Update user preferences
  const updateUserPreferences = useCallback(async (preferences: Record<string, any>) => {
    if (!user?.uid) return { success: false, error: 'No user logged in' };

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        preferences,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user?.uid]);

  // Log user activity (in a real app)
  const logActivity = useCallback(async (
    type: UserActivity['type'], 
    description: string, 
    metadata?: Record<string, any>
  ) => {
    if (!user?.uid) return;

    try {
      const activity: UserActivity = {
        id: Date.now().toString(),
        type,
        description,
        timestamp: new Date().toISOString(),
        metadata
      };

      // In a real app, you'd save this to Firestore
      setActivities(prev => [activity, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, [user?.uid]);

  // Enhanced profile update with activity logging
  const updateProfileWithLogging = useCallback(async (updates: Parameters<typeof updateUserProfile>[0]) => {
    const result = await updateUserProfile(updates);
    
    if (result.success) {
      await logActivity('profile_update', 'Perfil actualizado', updates);
    }
    
    return result;
  }, [updateUserProfile, logActivity]);

  // Export user data (GDPR compliance)
  const exportUserData = useCallback(async () => {
    if (!user?.uid || !userProfile) return null;

    try {
      // Collect all user data
      const userData = {
        profile: userProfile,
        activities: activities,
        stats: stats,
        organizations: [], // Would load from organizations collection
        leads: [], // Would load from leads collection
        exportDate: new Date().toISOString()
      };

      // Convert to JSON blob
      const dataBlob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });

      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${user.uid}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await logActivity('data_export', 'Datos exportados');
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user?.uid, userProfile, activities, stats, logActivity]);

  // Check if profile is complete
  const isProfileComplete = useCallback(() => {
    if (!userProfile) return false;
    
    return !!(
      userProfile.displayName &&
      userProfile.email &&
      user?.emailVerified
    );
  }, [userProfile, user?.emailVerified]);

  // Get profile completion percentage
  const getProfileCompletionPercentage = useCallback(() => {
    if (!userProfile) return 0;
    
    let completedFields = 0;
    const totalFields = 5;
    
    if (userProfile.displayName) completedFields++;
    if (userProfile.email) completedFields++;
    if (user?.emailVerified) completedFields++;
    if (userProfile.photoURL) completedFields++;
    if (userProfile.phoneNumber) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  }, [userProfile, user?.emailVerified]);

  // Load data on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserActivities();
      loadUserStats();
    }
  }, [user?.uid, loadUserActivities, loadUserStats]);

  return {
    // Data
    activities,
    stats,
    loading,
    
    // Computed values
    isProfileComplete: isProfileComplete(),
    profileCompletionPercentage: getProfileCompletionPercentage(),
    
    // Actions
    updateProfileWithLogging,
    updateUserPreferences,
    logActivity,
    exportUserData,
    
    // Loaders
    loadUserActivities,
    loadUserStats
  };
}