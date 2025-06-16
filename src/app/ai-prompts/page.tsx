"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Brain, 
  MessageSquare, 
  Lightbulb, 
  PackageSearch, 
  Mail, 
  Search,
  Plus,
  Edit3,
  Save,
  RotateCcw,
  Copy,
  Eye,
  Zap,
  Globe,
  Sliders
} from 'lucide-react';
import { PromptTemplate, PromptConfig, DEFAULT_PROMPT_TEMPLATES, DEFAULT_GLOBAL_SETTINGS } from '@/types/ai-prompts';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { usePromptConfig } from '@/hooks/usePromptConfig';
import PromptEditor from '@/components/ai-prompts/PromptEditor';
import PromptPreview from '@/components/ai-prompts/PromptPreview';
import GlobalSettings from '@/components/ai-prompts/GlobalSettings';
import SyncIndicator from '@/components/ai-prompts/SyncIndicator';

const ACTION_ICONS = {
  'Mensaje de Bienvenida': MessageSquare,
  'Evaluación de Negocio': Lightbulb,
  'Recomendaciones de Ventas': PackageSearch,
  'Email de Configuración TPV': Mail
};

const ACTION_COLORS = {
  'Mensaje de Bienvenida': 'bg-blue-500/10 text-blue-600 border-blue-200',
  'Evaluación de Negocio': 'bg-amber-500/10 text-amber-600 border-amber-200',
  'Recomendaciones de Ventas': 'bg-green-500/10 text-green-600 border-green-200',
  'Email de Configuración TPV': 'bg-purple-500/10 text-purple-600 border-purple-200'
};

export default function AIPromptsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { 
    promptConfig, 
    loading, 
    error: configError, 
    saveConfig, 
    loadConfig,
    updateTemplate,
    isModified,
    saving,
    lastSaved,
    syncStatus
  } = usePromptConfig();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Show error toast if config loading fails
  useEffect(() => {
    if (configError) {
      toast({
        title: "Error",
        description: configError,
        variant: "destructive"
      });
    }
  }, [configError, toast]);

  const handleSaveTemplate = async (template: PromptTemplate) => {
    try {
      if (!promptConfig) return;

      const updatedConfig = {
        ...promptConfig,
        templates: promptConfig.templates.map(t => 
          t.id === template.id ? { ...template, updatedAt: new Date() } : t
        ),
        updatedAt: new Date()
      };

      await saveConfig(updatedConfig);
      
      toast({
        title: "Éxito",
        description: "Prompt guardado correctamente.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el prompt.",
        variant: "destructive"
      });
    }
  };

  const handleResetTemplate = (template: PromptTemplate) => {
    const defaultTemplate = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === template.name);
    if (defaultTemplate && selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        customPrompt: undefined,
        defaultPrompt: defaultTemplate.defaultPrompt
      });
    }
  };

  const handleDuplicateTemplate = async (template: PromptTemplate) => {
    try {
      if (!promptConfig) return;

      const newTemplate: PromptTemplate = {
        ...template,
        id: `template_${Date.now()}`,
        name: `${template.name} (Copia)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      const updatedConfig = {
        ...promptConfig,
        templates: [...promptConfig.templates, newTemplate],
        updatedAt: new Date()
      };

      await saveConfig(updatedConfig);

      toast({
        title: "Éxito",
        description: "Prompt duplicado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo duplicar el prompt.",
        variant: "destructive"
      });
    }
  };

  const filteredTemplates = promptConfig?.templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!promptConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error al cargar configuración</h2>
          <p className="text-muted-foreground mb-4">No se pudo cargar la configuración de prompts de IA.</p>
          <Button onClick={loadConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Configuración de IA</h1>
            </div>
            <SyncIndicator status={syncStatus} lastSaved={lastSaved} />
          </div>
          <p className="text-muted-foreground">
            Personaliza los prompts de las funciones de inteligencia artificial para optimizar los resultados.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Configuración Global
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vista Previa
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Templates List */}
              <div className="lg:w-1/3 space-y-4">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Plantillas de IA
                      </CardTitle>
                      <Badge variant="secondary">
                        {filteredTemplates.length} de {promptConfig.templates.length}
                      </Badge>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar prompts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredTemplates.map((template) => {
                      const Icon = ACTION_ICONS[template.name as keyof typeof ACTION_ICONS] || Brain;
                      const isSelected = selectedTemplate?.id === template.id;
                      const hasCustomPrompt = !!template.customPrompt;

                      return (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${ACTION_COLORS[template.name as keyof typeof ACTION_COLORS] || 'bg-muted'}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-sm truncate">{template.name}</h3>
                                  {hasCustomPrompt && (
                                    <Badge variant="outline" className="text-xs">
                                      Personalizado
                                    </Badge>
                                  )}
                                  {!template.isActive && (
                                    <Badge variant="secondary" className="text-xs">
                                      Inactivo
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {template.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {template.variables.length} variables
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    v{template.version}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Template Editor */}
              <div className="lg:w-2/3">
                {selectedTemplate ? (
                  <PromptEditor
                    template={selectedTemplate}
                    isEditing={isEditing}
                    onEdit={() => setIsEditing(true)}
                    onSave={handleSaveTemplate}
                    onCancel={() => setIsEditing(false)}
                    onReset={() => handleResetTemplate(selectedTemplate)}
                    onDuplicate={() => handleDuplicateTemplate(selectedTemplate)}
                    onPreview={() => setShowPreview(true)}
                  />
                ) : (
                  <Card className="h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Selecciona un Prompt</h3>
                      <p className="text-muted-foreground">
                        Elige una plantilla de la lista para comenzar a editarla.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Global Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <GlobalSettings
              settings={promptConfig.globalSettings}
              onSave={async (newSettings) => {
                try {
                  const updatedConfig = {
                    ...promptConfig,
                    globalSettings: newSettings,
                    updatedAt: new Date()
                  };
                  
                  await saveConfig(updatedConfig);
                  
                  toast({
                    title: "Éxito",
                    description: "Configuración global guardada correctamente.",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "No se pudo guardar la configuración global.",
                    variant: "destructive"
                  });
                }
              }}
            />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            {selectedTemplate ? (
              <PromptPreview
                template={selectedTemplate}
                globalSettings={promptConfig.globalSettings}
              />
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Vista Previa</h3>
                  <p className="text-muted-foreground">
                    Selecciona un prompt para ver la vista previa.
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-border">
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>Nota:</strong> Los cambios en los prompts afectarán todas las futuras generaciones de IA. 
              Se recomienda probar en la vista previa antes de guardar cambios importantes.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}