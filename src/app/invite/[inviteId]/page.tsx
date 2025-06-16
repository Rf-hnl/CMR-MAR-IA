"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Building2, Users, Mail, Check, X, UserPlus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { OrganizationInvite } from '@/types/organization';

interface InvitePageProps {
  params: {
    inviteId: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [invite, setInvite] = useState<OrganizationInvite | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load invitation data
  useEffect(() => {
    const loadInvite = async () => {
      try {
        setLoading(true);
        
        const inviteRef = doc(db, 'organizationInvites', params.inviteId);
        const inviteDoc = await getDoc(inviteRef);
        
        if (!inviteDoc.exists()) {
          setError('Invitación no encontrada o ya no es válida.');
          return;
        }
        
        const inviteData = {
          id: inviteDoc.id,
          ...inviteDoc.data(),
          createdAt: inviteDoc.data().createdAt?.toDate?.()?.toISOString() || inviteDoc.data().createdAt,
          expiresAt: inviteDoc.data().expiresAt?.toDate?.()?.toISOString() || inviteDoc.data().expiresAt,
        } as OrganizationInvite;
        
        // Check if invite is expired
        if (new Date(inviteData.expiresAt) < new Date()) {
          setError('Esta invitación ha expirado.');
          return;
        }
        
        // Check if invite is already used
        if (inviteData.status !== 'pending') {
          setError('Esta invitación ya ha sido utilizada.');
          return;
        }
        
        setInvite(inviteData);
        
        // Load organization name
        const orgRef = doc(db, 'organizations', inviteData.organizationId);
        const orgDoc = await getDoc(orgRef);
        if (orgDoc.exists()) {
          setOrganizationName(orgDoc.data().name);
        }
        
      } catch (err) {
        console.error('Error loading invite:', err);
        setError('Error al cargar la invitación.');
      } finally {
        setLoading(false);
      }
    };

    if (params.inviteId) {
      loadInvite();
    }
  }, [params.inviteId]);

  // Handle accepting invitation
  const handleAcceptInvite = async () => {
    if (!user || !invite) return;

    // Check if user email matches invited email
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      toast({
        title: "Email no coincide",
        description: `Esta invitación es para ${invite.email}. Debes iniciar sesión con esa cuenta.`,
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      // Update invite status
      const inviteRef = doc(db, 'organizationInvites', invite.id);
      await updateDoc(inviteRef, {
        status: 'accepted',
        respondedAt: new Date(),
        respondedBy: user.uid
      });

      // Add user to organization
      const orgRef = doc(db, 'organizations', invite.organizationId);
      await updateDoc(orgRef, {
        memberIds: arrayUnion(user.uid),
        updatedAt: new Date()
      });

      toast({
        title: "¡Bienvenido al equipo!",
        description: `Te has unido a ${organizationName} exitosamente.`
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar la invitación. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!invite) return;

    setProcessing(true);
    try {
      const inviteRef = doc(db, 'organizationInvites', invite.id);
      await updateDoc(inviteRef, {
        status: 'declined',
        respondedAt: new Date(),
        respondedBy: user?.uid || 'anonymous'
      });

      toast({
        title: "Invitación rechazada",
        description: "Has rechazado la invitación."
      });

      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error('Error declining invite:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la invitación.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Invitación No Válida</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Ir al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Invitación a Organización</CardTitle>
          <CardDescription>
            Has sido invitado a unirte a una organización
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{organizationName}</h3>
              <Badge variant={invite.role === 'admin' ? 'default' : 'secondary'}>
                {invite.role === 'admin' ? 'Administrador' : 'Miembro'}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Invitado por: {invite.invitedByEmail}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Rol: {invite.role === 'admin' ? 'Administrador' : 'Miembro'}</span>
              </div>
            </div>
          </div>

          {/* User Status */}
          {!user ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <UserPlus className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Inicia sesión para continuar</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Necesitas iniciar sesión con {invite.email} para aceptar esta invitación.
                  </p>
                  <Button 
                    onClick={() => router.push('/login')} 
                    className="mt-3 w-full"
                  >
                    Iniciar Sesión
                  </Button>
                </div>
              </div>
            </div>
          ) : user.email?.toLowerCase() !== invite.email.toLowerCase() ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Email incorrecto</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esta invitación es para {invite.email}. Actualmente estás conectado como {user.email}.
                  </p>
                  <Button 
                    onClick={() => router.push('/login')} 
                    variant="outline"
                    className="mt-3 w-full"
                  >
                    Cambiar Cuenta
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Action Buttons */
            <div className="space-y-3">
              <Button 
                onClick={handleAcceptInvite} 
                disabled={processing}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                {processing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Aceptar Invitación
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleDeclineInvite}
                disabled={processing}
                variant="outline"
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            </div>
          )}

          {/* Expiry Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Esta invitación expira el {new Date(invite.expiresAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}