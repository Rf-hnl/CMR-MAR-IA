
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import LoadingComponent from '@/components/LoadingComponent';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { user, initialLoadDone, loading } = useAuth();

  useEffect(() => {
    if (initialLoadDone) {
      if (user) {
        router.replace('/business-finder');
      } else {
        router.replace('/login');
      }
    }
  }, [user, initialLoadDone, router]);

  if (loading || !initialLoadDone) {
    return (
      <LoadingComponent message="Iniciando aplicación..." />
    );
  }
  
  // This is a fallback, redirection should occur.
  // Or, you can return null if you want nothing to render briefly before redirect.
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}
