"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  Edit,
  Save,
  X,
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Settings,
  Calendar,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const { 
    user, 
    userProfile, 
    updateUserProfile, 
    changePassword, 
    sendVerificationEmail,
    logout,
    loading,
    initialLoadDone
  } = useAuth();
  
  const { toast } = useToast();
  const router = useRouter();

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    displayName: '',
    email: '',
    photoURL: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Email verification state
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // Initialize edit form when user data is available
  React.useEffect(() => {
    if (user) {
      setEditedProfile({
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || ''
      });
    }
  }, [user]);

  // Show loading if auth is still loading
  if (loading || !initialLoadDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    router.push('/login');
    return null;
  }

  const handleUpdateProfile = async () => {
    console.log('Updating profile with:', editedProfile);
    if (!updateUserProfile) {
      toast({
        title: "Error",
        description: "Función de actualización no disponible.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateUserProfile({
        displayName: editedProfile.displayName.trim(),
        email: editedProfile.email.trim(),
        photoURL: editedProfile.photoURL.trim()
      });
      
      if (result.success) {
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido actualizada exitosamente."
        });
        setIsEditing(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo actualizar el perfil.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!changePassword) {
      toast({
        title: "Error",
        description: "Función de cambio de contraseña no disponible.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.new.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(passwordForm.current, passwordForm.new);
      
      if (result.success) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente."
        });
        setIsPasswordDialogOpen(false);
        setPasswordForm({ current: '', new: '', confirm: '' });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo cambiar la contraseña.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendVerification = async () => {
    if (!sendVerificationEmail) {
      toast({
        title: "Error",
        description: "Función de verificación no disponible.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingVerification(true);
    try {
      const result = await sendVerificationEmail();
      
      if (result.success) {
        toast({
          title: "Email enviado",
          description: "Se ha enviado un nuevo email de verificación."
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo enviar el email.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive"
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      displayName: user?.displayName || '',
      email: user?.email || '',
      photoURL: user?.photoURL || ''
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/config">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Configuración
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-black">Mi Perfil</h1>
                <p className="text-gray-700">Administra tu información personal y configuración de cuenta</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/config">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
              </Link>
              <Button onClick={logout} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Email Verification Alert */}
          {!user.emailVerified && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Tu email no está verificado. Verifica tu email para mayor seguridad.</span>
                <Button
                  onClick={handleSendVerification}
                  disabled={isSendingVerification}
                  size="sm"
                  variant="outline"
                >
                  {isSendingVerification ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Verificar Email
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
            </TabsList>

            {/* General Information Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="w-24 h-24">
                        <AvatarImage 
                          src={isEditing ? editedProfile.photoURL || undefined : user.photoURL || undefined} 
                          alt={user.displayName ?? user.email ?? undefined} 
                        />
                        <AvatarFallback className="text-lg">
                          {getInitials(user.displayName || user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 space-y-4">
                      {!isEditing ? (
                        // View Mode
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-2xl font-bold text-gray-100">
                                {user.displayName || 'Sin nombre'}
                              </h2>
                              <p className="text-gray-600">{user.email}</p>
                            </div>
                            <Button onClick={() => setIsEditing(true)} variant="outline">
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Perfil
                            </Button>
                          </div>

                          <div className="flex items-center space-x-4">
                            <Badge variant={user.emailVerified ? "default" : "secondary"}>
                              {user.emailVerified ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Email Verificado
                                </>
                              ) : (
                                'Email sin verificar'
                              )}
                            </Badge>
                            
                            {userProfile && (
                              <>
                                <Badge variant={userProfile.role === 'admin' ? "default" : "secondary"}>
                                  <Shield className="mr-1 h-3 w-3" />
                                  {userProfile.role === 'admin' ? 'Administrador' : 'Usuario'}
                                </Badge>

                                <Badge variant={userProfile.isActive ? "default" : "destructive"}>
                                  <Activity className="mr-1 h-3 w-3" />
                                  {userProfile.isActive ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </>
                            )}
                          </div>

                          {userProfile && (
                            <div className="grid grid-cols-2 gap-4 pt-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Miembro desde</Label>
                                <p className="text-sm text-gray-900">
                                  {new Date(userProfile.createdAt).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Última actualización</Label>
                                <p className="text-sm text-gray-900">
                                  {new Date(userProfile.updatedAt).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Editar Perfil</h2>
                            <div className="flex space-x-2">
                              <Button onClick={cancelEdit} variant="outline" size="sm">
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                              </Button>
                              <Button 
                                onClick={handleUpdateProfile} 
                                disabled={isUpdating}
                                size="sm"
                              >
                                {isUpdating ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="displayName">Nombre completo</Label>
                              <Input
                                id="displayName"
                                value={editedProfile.displayName}
                                onChange={(e) => setEditedProfile(prev => ({ ...prev, displayName: e.target.value }))}
                                placeholder="Tu nombre completo"
                              />
                            </div>

                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={editedProfile.email}
                                onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="tu@email.com"
                              />
                            </div>

                            <div>
                              <Label htmlFor="photoURL">URL de foto de perfil</Label>
                              <Input
                                id="photoURL"
                                value={editedProfile.photoURL}
                                onChange={(e) => setEditedProfile(prev => ({ ...prev, photoURL: e.target.value }))}
                                placeholder="https://ejemplo.com/foto.jpg"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Configuración de Seguridad
                  </CardTitle>
                  <CardDescription>
                    Administra tu contraseña y configuración de seguridad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Change Password */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Contraseña</h3>
                      <p className="text-sm text-gray-600">Actualiza tu contraseña</p>
                    </div>
                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Lock className="mr-2 h-4 w-4" />
                          Cambiar Contraseña
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cambiar Contraseña</DialogTitle>
                          <DialogDescription>
                            Introduce tu contraseña actual y la nueva contraseña.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleChangePassword}>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="currentPassword">Contraseña Actual</Label>
                              <div className="relative">
                                <Input
                                  id="currentPassword"
                                  type={showPasswords.current ? "text" : "password"}
                                  value={passwordForm.current}
                                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                                  className="pr-9"
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                >
                                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="newPassword">Nueva Contraseña</Label>
                              <div className="relative">
                                <Input
                                  id="newPassword"
                                  type={showPasswords.new ? "text" : "password"}
                                  value={passwordForm.new}
                                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                                  className="pr-9"
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                >
                                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type={showPasswords.confirm ? "text" : "password"}
                                  value={passwordForm.confirm}
                                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                                  className="pr-9"
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                >
                                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isChangingPassword || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                            >
                              {isChangingPassword ? <LoadingSpinner size="sm" /> : 'Cambiar Contraseña'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Email Verification */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Verificación de Email</h3>
                      <p className="text-sm text-gray-600">
                        Estado: {user.emailVerified ? 'Verificado' : 'Sin verificar'}
                      </p>
                    </div>
                    {!user.emailVerified && (
                      <Button 
                        onClick={handleSendVerification}
                        disabled={isSendingVerification}
                        variant="outline"
                      >
                        {isSendingVerification ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Enviar Verificación
                          </>
                        )}
                      </Button>
                    )}
                    {user.emailVerified && (
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    Actividad de la Cuenta
                  </CardTitle>
                  <CardDescription>
                    Información básica de tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-100">UID de Usuario</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">
                            {user.uid}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Proveedor</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email/Contraseña'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {userProfile && (
                      <div className="border-t pt-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Información de la cuenta</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {userProfile.role === 'admin' ? 'Admin' : 'User'}
                              </div>
                              <div className="text-sm text-gray-600">Rol actual</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {userProfile.isActive ? 'Activo' : 'Inactivo'}
                              </div>
                              <div className="text-sm text-gray-600">Estado</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">
                                {user.emailVerified ? 'Sí' : 'No'}
                              </div>
                              <div className="text-sm text-gray-600">Email Verificado</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}