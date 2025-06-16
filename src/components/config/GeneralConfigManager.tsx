"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Euro, Palette, Globe, Bell, Database, RotateCcw, Save, Building2, Users, User } from 'lucide-react';
import { useGeneralConfig } from '@/hooks/useGeneralConfig';
import { GeneralConfig, CURRENCY_OPTIONS, LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from '@/types/general-config';
import OrganizationManager from './OrganizationManager';
import UserProfileManager from '@/components/UserProfileManager';
import DatabaseResetSection from './DatabaseResetSection';

export const GeneralConfigManager = () => {
  const { config, loading, updateConfig, resetConfig } = useGeneralConfig();
  const [editedConfig, setEditedConfig] = useState<Partial<GeneralConfig> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentConfig = editedConfig || config;

  const handleSave = async () => {
    if (!editedConfig) return;
    
    try {
      setIsSaving(true);
      await updateConfig(editedConfig);
      setEditedConfig(null);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetConfig();
      setEditedConfig(null);
    } catch (error) {
      console.error('Error al restablecer configuración:', error);
    }
  };

  const updateField = (field: string, value: any) => {
    setEditedConfig(prev => {
      const current = prev || config || {};
      const keys = field.split('.');
      // Add index signature to allow dynamic property access
      const updated: { [key: string]: any } = { ...current };
      
      let target: { [key: string]: any } = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {};
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasChanges = editedConfig !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configuración General</h2>
          <p className="text-muted-foreground">Personaliza la aplicación según tus preferencias</p>
        </div>
        
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Restablecer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Restablecer configuración?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción restaurará todos los valores a su configuración por defecto. 
                  Los cambios no guardados se perderán.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Restablecer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Tienes cambios sin guardar</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="organization" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="organization" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Organización
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-1">
            <Euro className="h-3 w-3" />
            Moneda
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-1">
            <Palette className="h-3 w-3" />
            Tema
          </TabsTrigger>
          <TabsTrigger value="locale" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="app" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Aplicación
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            Datos
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-4">
          <OrganizationManager />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <UserProfileManager />
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Configuración de Moneda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select 
                    value={currentConfig?.currency?.code || 'EUR'}
                    onValueChange={(value) => {
                      const currency = CURRENCY_OPTIONS.find(c => c.code === value);
                      if (currency) {
                        updateField('currency.code', currency.code);
                        updateField('currency.symbol', currency.symbol);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Posición del Símbolo</Label>
                  <Select 
                    value={currentConfig?.currency?.position || 'after'}
                    onValueChange={(value) => updateField('currency.position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Antes del número (€100)</SelectItem>
                      <SelectItem value="after">Después del número (100€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Vista previa:</p>
                <p className="font-medium">
                  {currentConfig?.currency?.position === 'before' 
                    ? `${currentConfig?.currency?.symbol}1,234.56`
                    : `1,234.56${currentConfig?.currency?.symbol}`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Configuración de Tema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Modo de Tema</Label>
                <Select 
                  value={currentConfig?.theme?.mode || 'system'}
                  onValueChange={(value) => updateField('theme.mode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Seguir sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={currentConfig?.theme?.primaryColor || '#3b82f6'}
                      onChange={(e) => updateField('theme.primaryColor', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={currentConfig?.theme?.primaryColor || '#3b82f6'}
                      onChange={(e) => updateField('theme.primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Color de Acento</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={currentConfig?.theme?.accentColor || '#8b5cf6'}
                      onChange={(e) => updateField('theme.accentColor', e.target.value)}
                      className="w-16 h-10 p-1 rounded"
                    />
                    <Input
                      value={currentConfig?.theme?.accentColor || '#8b5cf6'}
                      onChange={(e) => updateField('theme.accentColor', e.target.value)}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración Regional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select 
                    value={currentConfig?.locale?.language || 'es'}
                    onValueChange={(value) => updateField('locale.language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Zona Horaria</Label>
                  <Select 
                    value={currentConfig?.locale?.timezone || 'Europe/Madrid'}
                    onValueChange={(value) => updateField('locale.timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Formato de Fecha</Label>
                  <Select 
                    value={currentConfig?.locale?.dateFormat || 'DD/MM/YYYY'}
                    onValueChange={(value) => updateField('locale.dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Formato de Hora</Label>
                  <Select 
                    value={currentConfig?.locale?.timeFormat || '24h'}
                    onValueChange={(value) => updateField('locale.timeFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 horas (2:30 PM)</SelectItem>
                      <SelectItem value="24h">24 horas (14:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuración de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Notificaciones por Email', description: 'Recibir emails sobre actualizaciones importantes' },
                  { key: 'browser', label: 'Notificaciones del Navegador', description: 'Mostrar notificaciones en el navegador' },
                  { key: 'sound', label: 'Sonidos', description: 'Reproducir sonidos para notificaciones' },
                  { key: 'leadUpdates', label: 'Actualizaciones de Leads', description: 'Notificar cambios en leads' },
                  { key: 'systemAlerts', label: 'Alertas del Sistema', description: 'Notificar problemas del sistema' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="font-medium">{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={currentConfig?.notifications?.[item.key as keyof typeof currentConfig.notifications] || false}
                      onCheckedChange={(checked) => updateField(`notifications.${item.key}`, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Configuración de la Aplicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Empresa</Label>
                  <Input
                    value={currentConfig?.app?.companyName || ''}
                    onChange={(e) => updateField('app.companyName', e.target.value)}
                    placeholder="Tu empresa"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Dashboard por Defecto</Label>
                  <Select 
                    value={currentConfig?.app?.defaultDashboard || '/business-finder'}
                    onValueChange={(value) => updateField('app.defaultDashboard', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/business-finder">Business Finder</SelectItem>
                      <SelectItem value="/leads">Mis Leads</SelectItem>
                      <SelectItem value="/products">Mi Catálogo</SelectItem>
                      <SelectItem value="/services">Mis Servicios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Elementos por Página</Label>
                  <Select 
                    value={String(currentConfig?.app?.itemsPerPage || 20)}
                    onValueChange={(value) => updateField('app.itemsPerPage', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 elementos</SelectItem>
                      <SelectItem value="20">20 elementos</SelectItem>
                      <SelectItem value="50">50 elementos</SelectItem>
                      <SelectItem value="100">100 elementos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="font-medium">Sidebar Colapsado</Label>
                    <p className="text-sm text-muted-foreground">Contraer sidebar por defecto</p>
                  </div>
                  <Switch
                    checked={currentConfig?.app?.sidebarCollapsed || false}
                    onCheckedChange={(checked) => updateField('app.sidebarCollapsed', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuración de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="font-medium">Guardado Automático</Label>
                  <p className="text-sm text-muted-foreground">Guardar cambios automáticamente</p>
                </div>
                <Switch
                  checked={currentConfig?.data?.autoSave || false}
                  onCheckedChange={(checked) => updateField('data.autoSave', checked)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frecuencia de Respaldo</Label>
                  <Select 
                    value={currentConfig?.data?.backupFrequency || 'daily'}
                    onValueChange={(value) => updateField('data.backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Retención de Datos (días)</Label>
                  <Select 
                    value={String(currentConfig?.data?.dataRetention || 365)}
                    onValueChange={(value) => updateField('data.dataRetention', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                      <SelectItem value="180">180 días</SelectItem>
                      <SelectItem value="365">1 año</SelectItem>
                      <SelectItem value="730">2 años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Database Reset Section - Always visible */}
      <DatabaseResetSection />
    </div>
  );
};