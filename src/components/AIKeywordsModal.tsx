"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Package, Target, CheckCircle, Circle, Search, AlertCircle, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/useOrganization";

interface AIKeywordsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeywordsSelected: (keywords: string[]) => void;
  businessType?: string;
  location?: string;
  country?: string;
}

interface KeywordSuggestion {
  keyword: string;
  reason: string;
  category: 'product' | 'service' | 'target' | 'location' | 'business';
  confidence: number;
}

interface CatalogData {
  products: string[];
  services: string[];
  targetAudience: string[];
  isEmpty?: boolean;
  message?: string;
  stats?: {
    productsCount: number;
    servicesCount: number;
    audienceCount: number;
  };
}

export default function AIKeywordsModal({
  open,
  onOpenChange,
  onKeywordsSelected,
  businessType,
  location,
  country
}: AIKeywordsModalProps) {
  const [loading, setLoading] = useState(false);
  const [catalogData, setCatalogData] = useState<CatalogData | null>(null);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'catalog' | 'generating' | 'selecting'>('catalog');
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  // Cargar datos del catálogo cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadCatalogData();
    }
  }, [open]);

  const loadCatalogData = async () => {
    if (!user || !currentOrganization) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo verificar tu identidad. Por favor, inicia sesión nuevamente.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/catalog?organizationId=${currentOrganization.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el catálogo');
      }

      const data: CatalogData = await response.json();
      setCatalogData(data);
      setStep('catalog');

      if (data.isEmpty) {
        toast({
          title: "Catálogo vacío",
          description: data.message || "No se encontraron productos o servicios en tu catálogo.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error loading catalog:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el catálogo de productos y servicios",
        variant: "destructive"
      });
      
      // Fallback: usar datos básicos para que el modal no falle
      setCatalogData({
        products: [],
        services: [],
        targetAudience: ["Pequeñas empresas", "Empresarios", "Profesionales"],
        isEmpty: true,
        message: "No se pudieron cargar tus productos y servicios. Puedes seguir usando el generador con datos básicos."
      });
      setStep('catalog');
    } finally {
      setLoading(false);
    }
  };

  const generateKeywordSuggestions = async () => {
    if (!catalogData) return;
    
    setStep('generating');
    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/keyword-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_from_catalog',
          businessType,
          location,
          country,
          catalog: catalogData
        })
      });

      if (!response.ok) throw new Error('Error al generar sugerencias');

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setStep('selecting');

      // Mostrar mensaje si se usó IA real o fallback
      if (data.aiGenerated) {
        toast({
          title: "✨ IA Activada",
          description: `Se generaron ${data.suggestions?.length || 0} keywords usando OpenAI Assistant`,
        });
      } else if (data.fallbackUsed) {
        toast({
          title: "⚠️ Fallback Usado",
          description: "Se usó generación local debido a un error con OpenAI",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar sugerencias. Intenta de nuevo.",
        variant: "destructive"
      });
      
      // Fallback local en caso de error completo
      const simulatedSuggestions: KeywordSuggestion[] = [
        { keyword: "software", reason: "Relacionado con tus productos principales", category: 'product', confidence: 0.95 },
        { keyword: "gestión", reason: "Palabra clave de tu catálogo de servicios", category: 'service', confidence: 0.90 },
        { keyword: "pequeñas empresas", reason: "Audiencia objetivo identificada", category: 'target', confidence: 0.85 },
        { keyword: "automatización", reason: "Servicio principal en tu catálogo", category: 'service', confidence: 0.88 },
        { keyword: "punto de venta", reason: "Producto específico de tu oferta", category: 'product', confidence: 0.92 },
        { keyword: "restaurante", reason: "Tipo de negocio objetivo", category: 'business', confidence: 0.87 },
        { keyword: location?.toLowerCase() || "local", reason: "Enfoque geográfico", category: 'location', confidence: 0.83 }
      ];
      
      setSuggestions(simulatedSuggestions);
      setStep('selecting');
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const handleApplyKeywords = () => {
    onKeywordsSelected(Array.from(selectedKeywords));
    onOpenChange(false);
    toast({
      title: "Keywords aplicadas",
      description: `Se han agregado ${selectedKeywords.size} palabras clave a tu búsqueda`,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product': return <Package className="h-3 w-3" />;
      case 'service': return <Sparkles className="h-3 w-3" />;
      case 'target': return <Target className="h-3 w-3" />;
      default: return <Search className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'product': return 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
      case 'service': return 'bg-green-100 text-green-800 border-green-300 font-medium';
      case 'target': return 'bg-purple-100 text-purple-800 border-purple-300 font-medium';
      case 'location': return 'bg-orange-100 text-orange-800 border-orange-300 font-medium';
      case 'business': return 'bg-cyan-100 text-cyan-800 border-cyan-300 font-medium';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 font-medium';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generador de Palabras Clave con IA
          </DialogTitle>
          <DialogDescription>
            Utiliza tu catálogo de productos y servicios para generar palabras clave inteligentes 
            que atraigan a los clientes ideales para tu negocio.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {/* Paso 1: Mostrar Catálogo */}
          {step === 'catalog' && catalogData && (
            <div className="space-y-6">
              {catalogData.isEmpty ? (
                <div className="text-center py-8 space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Catálogo Vacío</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {catalogData.message || "No se encontraron productos o servicios en tu catálogo."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Productos/Servicios
                      </Button>
                      <Button onClick={generateKeywordSuggestions} size="sm">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Continuar con IA Básica
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {catalogData.products.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Productos en tu Catálogo ({catalogData.products.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {catalogData.products.map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800 font-medium">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {catalogData.products.length > 0 && catalogData.services.length > 0 && <Separator />}

                  {catalogData.services.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        Servicios que Ofreces ({catalogData.services.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {catalogData.services.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-green-50 border-green-200 text-green-800 font-medium">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(catalogData.products.length > 0 || catalogData.services.length > 0) && catalogData.targetAudience.length > 0 && <Separator />}

                  {catalogData.targetAudience.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-foreground mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        Audiencia Objetivo ({catalogData.targetAudience.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {catalogData.targetAudience.map((audience, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-800 font-medium">
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      La IA analizará tu catálogo 
                      {(catalogData.products.length > 0 || catalogData.services.length > 0) && 
                        ` (${catalogData.products.length + catalogData.services.length} elementos)`
                      } junto con el tipo de negocio <strong>"{businessType}"</strong>
                      {location && <> en <strong>"{location}"</strong></>} para generar palabras clave 
                      que ayuden a encontrar clientes potenciales que necesiten exactamente lo que ofreces.
                    </p>
                    <Button onClick={generateKeywordSuggestions} className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analizando catálogo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generar Palabras Clave con IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Generando */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <Sparkles className="h-4 w-4 text-blue-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h3 className="font-medium">🤖 OpenAI Assistant Analizando...</h3>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enviando tu catálogo al Assistant de OpenAI para generar keywords inteligentes
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Procesando productos y servicios</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-300"></div>
                  <span>Analizando mercado objetivo</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-600"></div>
                  <span>Generando keywords estratégicas</span>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Seleccionar Keywords */}
          {step === 'selecting' && suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">
                  Palabras Clave Sugeridas ({suggestions.length})
                </h4>
                <Badge variant="outline" className="text-xs">
                  {selectedKeywords.size} seleccionadas
                </Badge>
              </div>

              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${
                      selectedKeywords.has(suggestion.keyword)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleKeyword(suggestion.keyword)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedKeywords.has(suggestion.keyword)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{suggestion.keyword}</span>
                          <Badge className={`text-xs ${getCategoryColor(suggestion.category)}`}>
                            {getCategoryIcon(suggestion.category)}
                            <span className="ml-1 capitalize">{suggestion.category}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex-1 bg-muted rounded-full h-1">
                            <div
                              className="bg-primary h-1 rounded-full transition-all"
                              style={{ width: `${suggestion.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer con acciones */}
        {step === 'selecting' && suggestions.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep('catalog')}
              disabled={loading}
            >
              Volver al Catálogo
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApplyKeywords}
                disabled={selectedKeywords.size === 0 || loading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aplicar ({selectedKeywords.size})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}