"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfileTestPage() {
  const { user, userProfile, loading, initialLoadDone } = useAuth();

  console.log('Profile Test - Loading:', loading);
  console.log('Profile Test - InitialLoadDone:', initialLoadDone);
  console.log('Profile Test - User:', user?.email);
  console.log('Profile Test - UserProfile:', userProfile);

  if (loading || !initialLoadDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4">Cargando autenticación...</p>
          <p className="text-sm text-gray-500">Loading: {loading.toString()}</p>
          <p className="text-sm text-gray-500">InitialLoadDone: {initialLoadDone.toString()}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>No hay usuario autenticado</p>
          <Link href="/login">
            <Button>Ir a Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href="/config">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Test de Perfil - Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-green-600">✅ Funcionando:</h3>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Autenticación: {user ? '✅ OK' : '❌ Falla'}</li>
                  <li>• Email: {user.email}</li>
                  <li>• Nombre: {user.displayName || 'Sin nombre'}</li>
                  <li>• Email verificado: {user.emailVerified ? 'Sí' : 'No'}</li>
                  <li>• UID: {user.uid}</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">Perfil Firestore:</h3>
                <div className="text-sm bg-gray-100 p-2 rounded">
                  {userProfile ? (
                    <pre>{JSON.stringify(userProfile, null, 2)}</pre>
                  ) : (
                    <p className="text-gray-500">No hay perfil de Firestore (esto está ok)</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-blue-600">Estado del Hook:</h3>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Loading: {loading ? 'Sí' : 'No'}</li>
                  <li>• InitialLoadDone: {initialLoadDone ? 'Sí' : 'No'}</li>
                  <li>• User existe: {user ? 'Sí' : 'No'}</li>
                  <li>• UserProfile existe: {userProfile ? 'Sí' : 'No'}</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <Link href="/profile">
                  <Button className="w-full">
                    🚀 Ir a Perfil Completo
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}