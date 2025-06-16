"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, X, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { OrganizationInvite } from '@/types/organization';

export default function PendingInvites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Load pending invites for current user
  useEffect(() => {
    const loadInvites = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        const invitesQuery = query(
          collection(db, 'organizationInvites'),
          where('email', '==', user.email.toLowerCase()),
          where('status', '==', 'pending')
        );

        const snapshot = await getDocs(invitesQuery);
        const pendingInvites = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || doc.data().expiresAt,
        })) as OrganizationInvite[];

        // Filter out expired invites
        const validInvites = pendingInvites.filter(invite => 
          new Date(invite.expiresAt) > new Date()
        );

        setInvites(validInvites);
      } catch (error) {
        console.error('Error loading invites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvites();
  }, [user?.email]);

  const handleInviteResponse = async (invite: OrganizationInvite, accept: boolean) => {
    if (!user?.uid) return;

    setProcessing(invite.id);
    try {
      // Update invite status
      const inviteRef = doc(db, 'organizationInvites', invite.id);
      await updateDoc(inviteRef, {
        status: accept ? 'accepted' : 'declined',
        respondedAt: new Date(),
        respondedBy: user.uid
      });

      if (accept) {
        // Add user to organization
        const orgRef = doc(db, 'organizations', invite.organizationId);
        await updateDoc(orgRef, {
          memberIds: arrayUnion(user.uid),
          updatedAt: new Date()
        });
      }

      // Remove from local state
      setInvites(prev => prev.filter(inv => inv.id !== invite.id));

      toast({
        title: accept ? "Invitación aceptada" : "Invitación rechazada",
        description: accept 
          ? "Te has unido a la organización exitosamente."
          : "Has rechazado la invitación.",
      });

      // Reload page to refresh organization data
      if (accept) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error responding to invite:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la respuesta. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Invitaciones Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invites.length === 0) {
    return null; // Don't show the card if no invites
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Invitaciones Pendientes
          <Badge variant="secondary" className="ml-2">
            {invites.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Tienes invitaciones para unirte a organizaciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invites.map((invite) => (
          <div key={invite.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">Invitación a organización</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Invitado por: {invite.invitedByEmail}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={invite.role === 'admin' ? 'default' : 'secondary'}>
                    {invite.role === 'admin' ? 'Administrador' : 'Miembro'}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="mr-1 h-3 w-3" />
                    Expira: {new Date(invite.expiresAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleInviteResponse(invite, true)}
                disabled={processing === invite.id}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleInviteResponse(invite, false)}
                disabled={processing === invite.id}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}