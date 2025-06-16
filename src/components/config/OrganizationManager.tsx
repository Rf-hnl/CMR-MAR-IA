"use client";

import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Plus, Mail, Crown, Settings, UserPlus, Copy, Share, Link } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import PendingInvites from './PendingInvites';
import OrganizationDebug from './OrganizationDebug';

export default function OrganizationManager() {
  const { user } = useAuth();
  const { 
    organizations, 
    currentOrganization, 
    loading, 
    error, 
    createOrganization, 
    addMember, 
    switchOrganization 
  } = useOrganization();
  
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  // Create organization form
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  
  // Invite member form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  
  // Invitation link result
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreating(true);
    try {
      await createOrganization(newOrgName.trim(), newOrgDescription.trim());
      toast({
        title: "Organización creada",
        description: `La organización "${newOrgName}" ha sido creada exitosamente.`
      });
      setIsCreateDialogOpen(false);
      setNewOrgName('');
      setNewOrgDescription('');
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo crear la organización. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentOrganization) return;

    setInviting(true);
    try {
      const result = await addMember(currentOrganization.id, inviteEmail.trim(), inviteRole);
      if (result.inviteLink) {
        setInviteLink(result.inviteLink);
        setShowLinkDialog(true);
        setIsInviteDialogOpen(false);
        setInviteEmail('');
        setInviteRole('member');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo crear la invitación. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        toast({
          title: "Enlace copiado",
          description: "El enlace de invitación ha sido copiado al portapapeles."
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "No se pudo copiar el enlace.",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Invites */}
      <PendingInvites />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="mr-2 h-6 w-6" />
            Gestión de Organizaciones
          </h2>
          <p className="text-gray-600 mt-1">
            Administra tu organización y miembros del equipo
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Organización
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Organización</DialogTitle>
              <DialogDescription>
                Crea una nueva organización para gestionar leads en equipo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrganization}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="orgName">Nombre de la Organización</Label>
                  <Input
                    id="orgName"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Mi Empresa"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="orgDescription">Descripción (opcional)</Label>
                  <Textarea
                    id="orgDescription"
                    value={newOrgDescription}
                    onChange={(e) => setNewOrgDescription(e.target.value)}
                    placeholder="Describe tu organización..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating || !newOrgName.trim()}>
                  {creating ? <LoadingSpinner size="sm" /> : 'Crear Organización'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Organization */}
      {currentOrganization && (
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg mr-3">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">{currentOrganization.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      Organización Actual
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 font-mono text-xs">
                      ID: {currentOrganization.id}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-700 mt-2">
                  {currentOrganization.description || 'Sin descripción disponible'}
                </CardDescription>
              </div>
              
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar Miembro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                    <DialogDescription>
                      Invita a un nuevo miembro a tu organización.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInviteMember}>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="inviteEmail">Email del Usuario</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="usuario@ejemplo.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="inviteRole">Rol</Label>
                        <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Miembro</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                        {inviting ? <LoadingSpinner size="sm" /> : 'Enviar Invitación'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Miembros</p>
                    <p className="text-2xl font-bold text-gray-900">{currentOrganization.memberIds.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-indigo-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tu Rol</p>
                    <p className="text-lg font-semibold text-yellow-600 flex items-center">
                      <Crown className="h-4 w-4 mr-1" />
                      {currentOrganization.ownerId === user?.uid ? 'Propietario' : 'Miembro'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estado</p>
                    <p className="text-lg font-semibold text-emerald-600 flex items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                      Activa
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Invitaciones</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {currentOrganization.settings.allowMemberInvites ? 'Habilitadas' : 'Deshabilitadas'}
                    </p>
                  </div>
                  <Mail className="h-8 w-8 text-gray-500" />
                </div>
              </div>
            </div>
            
            {/* Organization ID Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">ID de Organización</h4>
                  <p className="text-xs text-gray-600 mt-1">Usa este ID para referencias técnicas</p>
                </div>
                <code className="text-sm bg-white px-3 py-2 rounded border font-mono text-gray-700 select-all">
                  {currentOrganization.id}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Organizations */}
      {organizations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Organización</CardTitle>
            <CardDescription>
              Selecciona una organización para trabajar con sus datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className={`group relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                    currentOrganization?.id === org.id
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 shadow-lg shadow-indigo-500/20 backdrop-blur-sm'
                      : 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10'
                  }`}
                  onClick={() => switchOrganization(org)}
                >
                  {/* Background pattern for selected */}
                  {currentOrganization?.id === org.id && (
                    <div className="absolute inset-0 bg-indigo-500/10">
                      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 rotate-45 bg-indigo-500/20"></div>
                    </div>
                  )}
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Organization Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                          currentOrganization?.id === org.id 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30' 
                            : 'bg-gray-700 text-gray-300 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white'
                        } transition-all duration-200`}>
                          <Building2 className="w-6 h-6" />
                        </div>
                        
                        {/* Organization Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className={`font-semibold text-lg truncate ${
                              currentOrganization?.id === org.id ? 'text-indigo-100' : 'text-gray-100'
                            }`}>
                              {org.name}
                            </h4>
                            {currentOrganization?.id === org.id && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-500/30">
                                  ACTIVA
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <p className={`text-sm leading-relaxed ${
                            currentOrganization?.id === org.id ? 'text-indigo-200' : 'text-gray-400'
                          }`}>
                            {org.description || 'Sin descripción'}
                          </p>
                          
                          {/* Organization Metadata */}
                          <div className="flex items-center space-x-4 mt-3 flex-wrap gap-y-1">
                            <div className="flex items-center space-x-1">
                              <Users className={`w-4 h-4 ${currentOrganization?.id === org.id ? 'text-indigo-300' : 'text-gray-500'}`} />
                              <span className={`text-xs font-medium ${currentOrganization?.id === org.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {org.memberIds.length} {org.memberIds.length === 1 ? 'miembro' : 'miembros'}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Crown className="w-4 h-4 text-yellow-400" />
                              <span className={`text-xs font-medium ${currentOrganization?.id === org.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {org.ownerId === user?.uid ? 'Propietario' : 'Miembro'}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Settings className={`w-4 h-4 ${currentOrganization?.id === org.id ? 'text-indigo-300' : 'text-gray-500'}`} />
                              <span className={`text-xs font-medium ${currentOrganization?.id === org.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {org.settings.allowMemberInvites ? 'Invitaciones habilitadas' : 'Invitaciones deshabilitadas'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Indicator */}
                      <div className="flex-shrink-0 ml-4">
                        {currentOrganization?.id === org.id ? (
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 border-2 border-gray-600 rounded-full flex items-center justify-center group-hover:border-indigo-400 group-hover:bg-indigo-500/10 transition-all duration-200">
                            <svg className="w-5 h-5 text-gray-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom border accent */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                      currentOrganization?.id === org.id 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                        : 'bg-gray-700 group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400'
                    } transition-all duration-300`}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funcionan las organizaciones?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>• <strong>Colaboración:</strong> Todos los miembros pueden ver y gestionar los leads de la organización.</p>
          <p>• <strong>Roles:</strong> Los propietarios pueden invitar miembros y cambiar configuraciones.</p>
          <p>• <strong>Datos compartidos:</strong> Los leads, productos y configuraciones se comparten entre miembros.</p>
          <p>• <strong>Cambio de organización:</strong> Puedes cambiar entre organizaciones desde esta configuración.</p>
          <p>• <strong>Invitaciones:</strong> Se genera un enlace único que puedes compartir manualmente.</p>
        </CardContent>
      </Card>

      {/* Debug Component */}
      <OrganizationDebug />

      {/* Invitation Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Share className="mr-2 h-5 w-5" />
              Enlace de Invitación Creado
            </DialogTitle>
            <DialogDescription>
              Comparte este enlace con la persona que quieres invitar. El enlace expira en 7 días.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Link Display */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Link className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <code className="text-sm text-gray-700 break-all flex-1">
                  {inviteLink}
                </code>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Cómo funciona:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Copia y comparte este enlace con la persona invitada</li>
                <li>• Al hacer clic, podrá unirse directamente a la organización</li>
                <li>• Si no tiene cuenta, se le guiará para crear una</li>
                <li>• El enlace expira automáticamente en 7 días</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={copyInviteLink} className="flex-1">
              <Copy className="mr-2 h-4 w-4" />
              Copiar Enlace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}