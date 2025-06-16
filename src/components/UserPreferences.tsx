"use client";

import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bell, 
  Eye, 
  Moon, 
  Sun, 
  Globe, 
  Download,
  Shield,
  Zap
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserPreferences {
  notifications: {
    email: boolean;
    browser: boolean;
    leadUpdates: boolean;
    organizationInvites: boolean;
    weeklyReport: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'organization';
    showEmail: boolean;
    showActivity: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    language: 'es' | 'en';
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  };
  workflow: {
    autoSaveInterval: number; // minutes
    defaultLeadStage: string;
    enableKeyboardShortcuts: boolean;
    showAdvancedFeatures: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  notifications: {
    email: true,
    browser: true,
    leadUpdates: true,
    organizationInvites: true,
    weeklyReport: false
  },
  privacy: {
    profileVisibility: 'organization',
    showEmail: false,
    showActivity: true
  },
  display: {
    theme: 'system',
    language: 'es',
    timezone: 'Europe/Madrid',
    dateFormat: 'DD/MM/YYYY'
  },
  workflow: {
    autoSaveInterval: 5,
    defaultLeadStage: 'Nuevo',
    enableKeyboardShortcuts: true,
    showAdvancedFeatures: false
  }
};

export default function UserPreferences() {
  const { updateUserPreferences, exportUserData } = useUserProfile();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleUpdatePreferences = async () => {
    setIsUpdating(true);
    try {
      const result = await updateUserPreferences(preferences);
      
      if (result.success) {
        toast({
          title: "Preferencias actualizadas",
          description: "Tus preferencias han sido guardadas exitosamente."
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron actualizar las preferencias.",
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

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await exportUserData();
      
      if (result?.success) {
        toast({
          title: "Datos exportados",
          description: "Tus datos han sido descargados exitosamente."
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudieron exportar los datos.",
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
      setIsExporting(false);
    }
  };

  const updateNestedPreference = (section: keyof UserPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Preferencias de Usuario
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Personaliza tu experiencia en la plataforma
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            variant="outline"
            size="sm"
          >
            {isExporting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar Datos
              </>
            )}
          </Button>
          
          <Button
            onClick={handleUpdatePreferences}
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Guardar Preferencias'
            )}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Notificaciones por email</Label>
              <p className="text-sm text-gray-600">Recibir notificaciones en tu email</p>
            </div>
            <Switch
              checked={preferences.notifications.email}
              onCheckedChange={(value) => updateNestedPreference('notifications', 'email', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Notificaciones del navegador</Label>
              <p className="text-sm text-gray-600">Mostrar notificaciones push</p>
            </div>
            <Switch
              checked={preferences.notifications.browser}
              onCheckedChange={(value) => updateNestedPreference('notifications', 'browser', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Actualizaciones de leads</Label>
              <p className="text-sm text-gray-600">Cuando cambie el estado de un lead</p>
            </div>
            <Switch
              checked={preferences.notifications.leadUpdates}
              onCheckedChange={(value) => updateNestedPreference('notifications', 'leadUpdates', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Invitaciones a organizaciones</Label>
              <p className="text-sm text-gray-600">Cuando te inviten a una organización</p>
            </div>
            <Switch
              checked={preferences.notifications.organizationInvites}
              onCheckedChange={(value) => updateNestedPreference('notifications', 'organizationInvites', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Reporte semanal</Label>
              <p className="text-sm text-gray-600">Resumen semanal de actividad</p>
            </div>
            <Switch
              checked={preferences.notifications.weeklyReport}
              onCheckedChange={(value) => updateNestedPreference('notifications', 'weeklyReport', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Privacidad
          </CardTitle>
          <CardDescription>
            Controla la visibilidad de tu información
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Visibilidad del perfil</Label>
            <Select
              value={preferences.privacy.profileVisibility}
              onValueChange={(value: 'public' | 'private' | 'organization') => 
                updateNestedPreference('privacy', 'profileVisibility', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4" />
                    Público - Visible para todos
                  </div>
                </SelectItem>
                <SelectItem value="organization">
                  <div className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    Organización - Solo miembros de tu organización
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Privado - Solo tú
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Mostrar email</Label>
              <p className="text-sm text-gray-600">Permitir que otros vean tu email</p>
            </div>
            <Switch
              checked={preferences.privacy.showEmail}
              onCheckedChange={(value) => updateNestedPreference('privacy', 'showEmail', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Mostrar actividad</Label>
              <p className="text-sm text-gray-600">Mostrar última actividad</p>
            </div>
            <Switch
              checked={preferences.privacy.showActivity}
              onCheckedChange={(value) => updateNestedPreference('privacy', 'showActivity', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza cómo se ve la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select
                value={preferences.display.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => 
                  updateNestedPreference('display', 'theme', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center">
                      <Sun className="mr-2 h-4 w-4" />
                      Claro
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center">
                      <Moon className="mr-2 h-4 w-4" />
                      Oscuro
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Seguir sistema
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select
                value={preferences.display.language}
                onValueChange={(value: 'es' | 'en') => 
                  updateNestedPreference('display', 'language', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Zona horaria</Label>
              <Select
                value={preferences.display.timezone}
                onValueChange={(value) => updateNestedPreference('display', 'timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Madrid">Madrid (UTC+1)</SelectItem>
                  <SelectItem value="America/New_York">Nueva York (UTC-5)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Los Ángeles (UTC-8)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokio (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Formato de fecha</Label>
              <Select
                value={preferences.display.dateFormat}
                onValueChange={(value: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') => 
                  updateNestedPreference('display', 'dateFormat', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">31/12/2024</SelectItem>
                  <SelectItem value="MM/DD/YYYY">12/31/2024</SelectItem>
                  <SelectItem value="YYYY-MM-DD">2024-12-31</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Flujo de Trabajo
          </CardTitle>
          <CardDescription>
            Optimiza tu productividad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Intervalo de autoguardado</Label>
              <Select
                value={preferences.workflow.autoSaveInterval.toString()}
                onValueChange={(value) => 
                  updateNestedPreference('workflow', 'autoSaveInterval', parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minuto</SelectItem>
                  <SelectItem value="5">5 minutos</SelectItem>
                  <SelectItem value="10">10 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Estado predeterminado de leads</Label>
              <Select
                value={preferences.workflow.defaultLeadStage}
                onValueChange={(value) => updateNestedPreference('workflow', 'defaultLeadStage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nuevo">Nuevo</SelectItem>
                  <SelectItem value="Contactado">Contactado</SelectItem>
                  <SelectItem value="Cualificado">Cualificado</SelectItem>
                  <SelectItem value="Propuesta">Propuesta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Atajos de teclado</Label>
              <p className="text-sm text-gray-600">Habilitar shortcuts para acciones rápidas</p>
            </div>
            <Switch
              checked={preferences.workflow.enableKeyboardShortcuts}
              onCheckedChange={(value) => updateNestedPreference('workflow', 'enableKeyboardShortcuts', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Funciones avanzadas</Label>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">Mostrar opciones para usuarios expertos</p>
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </div>
            </div>
            <Switch
              checked={preferences.workflow.showAdvancedFeatures}
              onCheckedChange={(value) => updateNestedPreference('workflow', 'showAdvancedFeatures', value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}