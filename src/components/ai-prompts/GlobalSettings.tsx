"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Info,
  Zap,
  Brain,
  Gauge,
  Hash,
  Target
} from 'lucide-react';
import { DEFAULT_GLOBAL_SETTINGS } from '@/types/ai-prompts';

interface GlobalSettingsProps {
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  onSave: (settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  }) => void;
}

const AVAILABLE_MODELS = [
  {
    id: 'googleai/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Rápido y eficiente para la mayoría de tareas',
    badge: 'Recomendado'
  },
  {
    id: 'googleai/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Mayor calidad para tareas complejas',
    badge: 'Pro'
  },
  {
    id: 'googleai/gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    description: 'Versión estable anterior',
    badge: 'Estable'
  }
];

const TEMPERATURE_PRESETS = [
  { value: 0.1, label: 'Muy Conservador', description: 'Respuestas muy consistentes y predecibles' },
  { value: 0.3, label: 'Conservador', description: 'Respuestas consistentes con poca variación' },
  { value: 0.7, label: 'Balanceado', description: 'Equilibrio entre creatividad y consistencia' },
  { value: 0.9, label: 'Creativo', description: 'Respuestas más variadas y creativas' },
  { value: 1.2, label: 'Muy Creativo', description: 'Máxima creatividad y variación' }
];

const TOKEN_PRESETS = [
  { value: 512, label: 'Corto', description: 'Para respuestas breves' },
  { value: 1024, label: 'Medio', description: 'Para respuestas de longitud media' },
  { value: 2048, label: 'Largo', description: 'Para respuestas detalladas' },
  { value: 4096, label: 'Muy Largo', description: 'Para respuestas muy extensas' }
];

export default function GlobalSettings({ settings, onSave }: GlobalSettingsProps) {
  const [editedSettings, setEditedSettings] = useState(settings);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    setEditedSettings(settings);
    setIsModified(false);
  }, [settings]);

  useEffect(() => {
    const hasChanges = 
      editedSettings.model !== settings.model ||
      editedSettings.temperature !== settings.temperature ||
      editedSettings.maxTokens !== settings.maxTokens ||
      editedSettings.topP !== settings.topP;
    
    setIsModified(hasChanges);
  }, [editedSettings, settings]);

  const handleSave = () => {
    onSave(editedSettings);
    setIsModified(false);
  };

  const handleReset = () => {
    setEditedSettings(DEFAULT_GLOBAL_SETTINGS);
  };

  const handleTemperatureChange = (value: number[]) => {
    setEditedSettings(prev => ({ ...prev, temperature: value[0] }));
  };

  const handleTopPChange = (value: number[]) => {
    setEditedSettings(prev => ({ ...prev, topP: value[0] }));
  };

  const handleMaxTokensChange = (value: string) => {
    const tokens = parseInt(value, 10);
    if (!isNaN(tokens) && tokens > 0) {
      setEditedSettings(prev => ({ ...prev, maxTokens: tokens }));
    }
  };

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === editedSettings.model);
  const selectedTempPreset = TEMPERATURE_PRESETS.find(p => Math.abs(p.value - editedSettings.temperature) < 0.05);
  const selectedTokenPreset = TOKEN_PRESETS.find(p => p.value === editedSettings.maxTokens);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configuración Global de IA
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Estos ajustes se aplicarán a todas las funciones de IA por defecto
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!isModified}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restaurar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isModified}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Modelo de IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modelo Activo</Label>
              <Select
                value={editedSettings.model}
                onValueChange={(value) => setEditedSettings(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {model.badge}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedModel && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedModel.name}:</strong> {selectedModel.description}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2">
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Flash:</strong> Respuestas rápidas, ideal para uso general</p>
                <p><strong>Pro:</strong> Mayor calidad, análisis más profundos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Max Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Longitud de Respuesta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tokens Máximos</Label>
              <Input
                type="number"
                value={editedSettings.maxTokens}
                onChange={(e) => handleMaxTokensChange(e.target.value)}
                min="100"
                max="8192"
                step="100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TOKEN_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedTokenPreset?.value === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditedSettings(prev => ({ ...prev, maxTokens: preset.value }))}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {selectedTokenPreset && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedTokenPreset.label}:</strong> {selectedTokenPreset.description}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground">
              <p>1 token ≈ 0.75 palabras en español</p>
              <p>Estimado: ~{Math.round(editedSettings.maxTokens * 0.75)} palabras máximo</p>
            </div>
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Creatividad (Temperature)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Nivel de Creatividad</Label>
                  <Badge variant="outline">
                    {editedSettings.temperature.toFixed(1)}
                  </Badge>
                </div>
                <Slider
                  value={[editedSettings.temperature]}
                  onValueChange={handleTemperatureChange}
                  max={1.5}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 gap-1">
                {TEMPERATURE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={selectedTempPreset?.value === preset.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setEditedSettings(prev => ({ ...prev, temperature: preset.value }))}
                    className="justify-start text-xs h-auto py-2"
                  >
                    <div className="text-left">
                      <div className="font-medium">{preset.label} ({preset.value})</div>
                      <div className="text-muted-foreground">{preset.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top-P */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Enfoque (Top-P)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Nucleus Sampling</Label>
                <Badge variant="outline">
                  {editedSettings.topP.toFixed(1)}
                </Badge>
              </div>
              <Slider
                value={[editedSettings.topP]}
                onValueChange={handleTopPChange}
                max={1.0}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Top-P controla la diversidad de respuestas:</strong><br />
                • <strong>0.1-0.3:</strong> Muy enfocado, respuestas similares<br />
                • <strong>0.5-0.7:</strong> Balanceado<br />
                • <strong>0.8-1.0:</strong> Más diversidad en las respuestas
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={editedSettings.topP <= 0.3 ? "default" : "outline"}
                size="sm"
                onClick={() => setEditedSettings(prev => ({ ...prev, topP: 0.3 }))}
                className="text-xs"
              >
                Enfocado
              </Button>
              <Button
                variant={editedSettings.topP > 0.3 && editedSettings.topP <= 0.7 ? "default" : "outline"}
                size="sm"
                onClick={() => setEditedSettings(prev => ({ ...prev, topP: 0.6 }))}
                className="text-xs"
              >
                Balanceado
              </Button>
              <Button
                variant={editedSettings.topP > 0.7 ? "default" : "outline"}
                size="sm"
                onClick={() => setEditedSettings(prev => ({ ...prev, topP: 0.9 }))}
                className="text-xs"
              >
                Diverso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Impacto en Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">Velocidad</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedModel?.name.includes('Flash') ? 'Muy Rápido' : 'Rápido'} - 
                {editedSettings.maxTokens < 1000 ? ' Respuesta corta' : editedSettings.maxTokens < 2000 ? ' Respuesta media' : ' Respuesta larga'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium">Calidad</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedModel?.name.includes('Pro') ? 'Alta' : 'Buena'} - 
                Temperature {editedSettings.temperature < 0.5 ? 'Consistente' : editedSettings.temperature < 1.0 ? 'Balanceada' : 'Creativa'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-sm font-medium">Costo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedModel?.name.includes('Flash') ? 'Bajo' : 'Medio'} - 
                {editedSettings.maxTokens}tokens por consulta
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}