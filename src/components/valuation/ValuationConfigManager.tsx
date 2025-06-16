"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Settings, Trash2, Copy, DollarSign, Calculator, Target, Star, HelpCircle, Info } from 'lucide-react';
import { useValuationConfig } from '@/hooks/useValuationConfig';
import { ValuationConfig } from '@/types/valuation';
import { DEFAULT_VALUATION_CONFIG } from '@/config/defaultValuationConfig';

export const ValuationConfigManager = () => {
  const { configs, activeConfig, loading, createConfig, updateConfig, deleteConfig, setActiveConfiguration } = useValuationConfig();
  const [editingConfig, setEditingConfig] = useState<ValuationConfig | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateConfig = async (configData: Omit<ValuationConfig, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      await createConfig(configData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating config:', error);
    }
  };

  const handleUpdateConfig = async (id: string, configData: Partial<ValuationConfig>) => {
    try {
      await updateConfig(id, configData);
      setEditingConfig(null);
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await deleteConfig(id);
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  };

  const duplicateConfig = (config: ValuationConfig) => {
    const duplicated = {
      ...config,
      name: `${config.name} (Copia)`,
      isActive: false,
    };
    delete duplicated.id;
    delete duplicated.createdAt;
    delete duplicated.updatedAt;
    delete duplicated.userId;
    
    setEditingConfig(duplicated as ValuationConfig);
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configuración de Valoración</h2>
          <p className="text-muted-foreground">Ajusta los pesos y factores para el cálculo del valor de leads</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Configuración
            </Button>
          </DialogTrigger>
          <DialogContent className="min-w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Editar Configuración' : 'Nueva Configuración de Valoración'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <ValuationConfigForm 
                initialConfig={editingConfig || DEFAULT_VALUATION_CONFIG}
                onSubmit={editingConfig?.id 
                  ? (data) => handleUpdateConfig(editingConfig.id!, data)
                  : handleCreateConfig
                }
                onCancel={() => {
                  setIsCreateModalOpen(false);
                  setEditingConfig(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configuración Activa */}
      {activeConfig && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                {activeConfig.name}
                <Badge variant="default">Activa</Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingConfig(activeConfig);
                  setIsCreateModalOpen(true);
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{activeConfig.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {Object.keys(activeConfig.businessTypeWeights).length} tipos de negocio
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  {Object.keys(activeConfig.stageMultipliers).length} etapas configuradas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-purple-600" />
                <span className="text-sm">
                  {Object.keys(activeConfig.dataCompletenessWeights).length} factores de datos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-orange-600" />
                <span className="text-sm">
                  {Object.keys(activeConfig.aiInteractionWeights).length} factores de IA
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Configuraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <Card key={config.id} className={config.isActive ? 'opacity-50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{config.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateConfig(config)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingConfig(config);
                      setIsCreateModalOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  {!config.isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar configuración?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la configuración "{config.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteConfig(config.id!)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
              {!config.isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveConfiguration(config.id!)}
                >
                  Activar Configuración
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface ValuationConfigFormProps {
  initialConfig: Partial<ValuationConfig>;
  onSubmit: (config: Omit<ValuationConfig, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  onCancel: () => void;
}

const ValuationConfigForm = ({ initialConfig, onSubmit, onCancel }: ValuationConfigFormProps) => {
  const [config, setConfig] = useState<Partial<ValuationConfig>>(initialConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config as Omit<ValuationConfig, 'id' | 'createdAt' | 'updatedAt' | 'userId'>);
  };

  const updateBusinessType = (key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      businessTypeWeights: {
        ...prev.businessTypeWeights,
        [key]: value
      }
    }));
  };

  const updateStageMultiplier = (stage: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      stageMultipliers: {
        ...prev.stageMultipliers,
        [stage]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la Configuración</Label>
          <Input
            id="name"
            value={config.name || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ej: Configuración TPV Premium"
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="active" className="text-sm font-medium">
                Configuración Activa
              </Label>
              <p className="text-xs text-muted-foreground">
                Al activar, esta configuración se usará para calcular valores de leads
              </p>
            </div>
            <Switch
              id="active"
              checked={config.isActive || false}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: checked }))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={config.description || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe el propósito de esta configuración..."
          rows={2}
        />
      </div>

      <Tabs defaultValue="business-types" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business-types" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Tipos de Negocio
          </TabsTrigger>
          <TabsTrigger value="stages" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Etapas
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1">
            <Calculator className="h-3 w-3" />
            Completitud
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            Interacciones IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-types" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Valores Base por Tipo de Negocio</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  ¿Para qué sirve?
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Tipos de Negocio - Valores Base
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">¿Qué son los Valores Base?</h4>
                    <p className="text-blue-800 text-sm">
                      Los valores base determinan el valor inicial de un lead según el tipo de negocio. 
                      Un restaurante puede tener mayor valor potencial que una tienda de ropa debido a 
                      la frecuencia de compra y ticket promedio.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Cómo funciona:</h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Cada tipo de negocio tiene un valor en €</li>
                      <li>• Valores más altos = leads más valiosos</li>
                      <li>• Se recomienda basarse en el ticket promedio del sector</li>
                      <li>• El valor 'default' se aplica a tipos no especificados</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">Ejemplo:</h4>
                    <p className="text-amber-800 text-sm">
                      Restaurante: 500€ (alta frecuencia, tickets medios)<br/>
                      Concesionario: 2000€ (baja frecuencia, tickets altos)<br/>
                      Peluquería: 200€ (frecuencia media, tickets bajos)
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(config.businessTypeWeights || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Label className="min-w-0 flex-1 text-sm capitalize">
                  {key.replace(/_/g, ' ')}
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => updateBusinessType(key, Number(e.target.value))}
                  className="w-20"
                  min="0"
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Multiplicadores por Etapa</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  ¿Para qué sirve?
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Etapas - Multiplicadores
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">¿Qué son los Multiplicadores?</h4>
                    <p className="text-blue-800 text-sm">
                      Los multiplicadores ajustan el valor del lead según su probabilidad de conversión. 
                      Un lead 'Qualified' tiene mayor probabilidad que uno 'New', por lo que su valor es mayor.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Cómo funciona:</h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Valor entre 0 y 1 (0% a 100%)</li>
                      <li>• Se multiplica por el valor base</li>
                      <li>• Mayor valor = mayor probabilidad de conversión</li>
                      <li>• Refleja el embudo de ventas</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">Ejemplo:</h4>
                    <p className="text-amber-800 text-sm">
                      Nuevo: 0.1 (10% - lead muy inicial)<br/>
                      Calificado: 0.4 (40% - lead calificado)<br/>
                      Propuesta: 0.7 (70% - propuesta enviada)<br/>
                      Ganado: 1.0 (100% - venta cerrada)
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(config.stageMultipliers || {}).map(([stage, multiplier]) => (
              <div key={stage} className="flex items-center gap-2">
                <Label className="min-w-0 flex-1 text-sm">{stage}</Label>
                <Input
                  type="number"
                  value={multiplier}
                  onChange={(e) => updateStageMultiplier(stage, Number(e.target.value))}
                  className="w-24"
                  min="0"
                  max="1"
                  step="0.1"
                />
                <span className="text-xs text-muted-foreground">
                  ({Math.round(multiplier * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Bonificaciones por Completitud de Datos</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  ¿Para qué sirve?
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Completitud de Datos - Bonificaciones
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">¿Qué son las Bonificaciones?</h4>
                    <p className="text-blue-800 text-sm">
                      Las bonificaciones premian leads con información más completa. 
                      Un lead con teléfono, email y dirección es más valioso que uno con solo nombre.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Cómo funciona:</h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Valor en € que se suma al valor base</li>
                      <li>• Cada campo completado añade su bonificación</li>
                      <li>• Más datos = mayor facilidad de contacto</li>
                      <li>• Se acumulan todas las bonificaciones aplicables</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">Ejemplo:</h4>
                    <p className="text-amber-800 text-sm">
                      hasPhone: +50€ (contacto directo)<br/>
                      hasEmail: +30€ (marketing directo)<br/>
                      hasAddress: +20€ (visitas presenciales)<br/>
                      hasWebsite: +40€ (negocio establecido)
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(config.dataCompletenessWeights || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Label className="min-w-0 flex-1 text-sm capitalize">
                  {key.replace(/^has/, '').replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dataCompletenessWeights: {
                      ...prev.dataCompletenessWeights!,
                      [key]: Number(e.target.value)
                    }
                  }))}
                  className="w-20"
                  min="0"
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Bonificaciones por Interacciones IA</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  ¿Para qué sirve?
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Interacciones IA - Bonificaciones
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">¿Qué son las Interacciones IA?</h4>
                    <p className="text-blue-800 text-sm">
                      Las bonificaciones por IA premian leads que han sido procesados y enriquecidos 
                      con inteligencia artificial, aumentando su valor comercial.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Cómo funciona:</h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Valor en € que se suma al valor base</li>
                      <li>• Cada proceso de IA completado añade valor</li>
                      <li>• IA proporciona insights y recomendaciones</li>
                      <li>• Leads procesados son más fáciles de convertir</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-2">Ejemplo:</h4>
                    <p className="text-amber-800 text-sm">
                      hasWelcomeMessage: +25€ (mensaje personalizado)<br/>
                      hasBusinessEvaluation: +75€ (análisis de negocio)<br/>
                      hasSalesRecommendations: +50€ (estrategia de venta)<br/>
                      hasSolutionEmail: +60€ (propuesta generada)
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(config.aiInteractionWeights || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Label className="min-w-0 flex-1 text-sm capitalize">
                  {key.replace(/^has/, '').replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    aiInteractionWeights: {
                      ...prev.aiInteractionWeights!,
                      [key]: Number(e.target.value)
                    }
                  }))}
                  className="w-20"
                  min="0"
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Guardar Configuración
        </Button>
      </div>
    </form>
  );
};