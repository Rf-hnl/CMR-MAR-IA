"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Sparkles, 
  Building2,
  Brain,
  FileText,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Eye,
  Zap
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/useOrganization";
import type { QuoteData } from '@/components/QuoteGeneratorModal';

interface HybridQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLead?: {
    name: string;
    email?: string | null;
    businessType?: string | null;
  } | null;
}

interface HybridQuoteResult {
  success: boolean;
  quoteId: string;
  aiQuote: QuoteData;
  aiAnalysis: any;
  pandaDocId?: string;
  pandaDocUrl?: string;
  mappingCoverage: {
    totalItems: number;
    mappedItems: number;
    unmappedItems: string[];
    coveragePercentage: number;
  };
  savedToDatabase: boolean;
  warnings?: string[];
  error?: string;
}

export default function HybridQuoteModal({
  open,
  onOpenChange,
  currentLead
}: HybridQuoteModalProps) {
  const [step, setStep] = useState<'setup' | 'ai-generating' | 'mapping' | 'pandadoc' | 'results'>('setup');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HybridQuoteResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    businessType: '',
    necesidades: '',
    presupuesto_estimado: '',
    tamaño_empresa: 'mediana' as 'pequeña' | 'mediana' | 'grande' | 'enterprise',
    requerimientos_especiales: '',
    contexto_adicional: '',
    templateType: 'standard' as 'standard' | 'monthly',
    sendToPandaDoc: true,
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('setup');
      setResult(null);
      setFormData({
        clientName: '',
        clientEmail: '',
        businessType: '',
        necesidades: '',
        presupuesto_estimado: '',
        tamaño_empresa: 'mediana',
        requerimientos_especiales: '',
        contexto_adicional: '',
        templateType: 'standard',
        sendToPandaDoc: true,
        priority: 'medium',
        notes: ''
      });
    }
  }, [open]);

  // Pre-fill lead data
  useEffect(() => {
    if (currentLead) {
      setFormData(prev => ({
        ...prev,
        clientName: currentLead.name,
        clientEmail: currentLead.email || '',
        businessType: currentLead.businessType || ''
      }));
    }
  }, [currentLead]);

  const generateHybridQuote = async () => {
    if (!user || !currentOrganization) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado y tener una organización seleccionada",
        variant: "destructive"
      });
      return;
    }

    if (!formData.clientName || !formData.businessType) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa el nombre del lead y tipo de negocio",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setStep('ai-generating');

    try {
      const token = await user.getIdToken();

      const requestBody = {
        leadName: formData.clientName,
        businessType: formData.businessType,
        organizationId: currentOrganization.id,
        clientEmail: formData.clientEmail || undefined,
        leadInfo: {
          necesidades: formData.necesidades ? formData.necesidades.split(',').map(n => n.trim()) : [],
          presupuesto_estimado: formData.presupuesto_estimado || undefined,
          tamaño_empresa: formData.tamaño_empresa
        },
        requerimientos_especiales: formData.requerimientos_especiales ? 
          formData.requerimientos_especiales.split(',').map(r => r.trim()) : [],
        contexto_adicional: formData.contexto_adicional || undefined,
        templateType: formData.templateType,
        sendToPandaDoc: formData.sendToPandaDoc,
        priority: formData.priority,
        notes: formData.notes || undefined
      };

      // Simulate step progression
      setTimeout(() => setStep('mapping'), 2000);
      setTimeout(() => setStep('pandadoc'), 4000);

      const response = await fetch('/api/hybrid-quotes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data: HybridQuoteResult = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        setStep('results');
        
        // Auto-open PandaDoc if available
        if (data.pandaDocUrl) {
          setTimeout(() => {
            window.open(data.pandaDocUrl, '_blank', 'noopener,noreferrer');
            toast({
              title: "📄 PandaDoc Abierto",
              description: "El documento se ha abierto en una nueva pestaña",
            });
          }, 1500); // Small delay to let user see the success message
        }
        
        toast({
          title: "🎉 Cotización Híbrida Creada",
          description: `IA + PandaDoc integrados exitosamente para ${formData.clientName}`,
        });
      } else {
        setResult(data);
        setStep('results');
        
        toast({
          title: "⚠️ Cotización Parcial",
          description: data.error || "Se completó parcialmente con advertencias",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setStep('results');
      setResult({
        success: false,
        quoteId: '',
        aiQuote: {} as QuoteData,
        aiAnalysis: {},
        mappingCoverage: {
          totalItems: 0,
          mappedItems: 0,
          unmappedItems: [],
          coveragePercentage: 0
        },
        savedToDatabase: false,
        error: 'Error de conexión'
      });
      
      toast({
        title: "❌ Error",
        description: "No se pudo generar la cotización híbrida",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResultSummary = async () => {
    if (!result) return;

    const summary = `
🤖+📄 COTIZACIÓN HÍBRIDA GENERADA

Cliente: ${formData.clientName}
Tipo de Negocio: ${formData.businessType}
ID: ${result.quoteId}

📊 ANÁLISIS IA:
${result.aiQuote.titulo || 'Cotización Personalizada'}

🔄 MAPEO DE PRODUCTOS:
• Total productos IA: ${result.mappingCoverage.totalItems}
• Mapeados a PandaDoc: ${result.mappingCoverage.mappedItems}
• Cobertura: ${result.mappingCoverage.coveragePercentage.toFixed(1)}%

${result.mappingCoverage.unmappedItems.length > 0 ? 
`⚠️ Sin mapear: ${result.mappingCoverage.unmappedItems.join(', ')}` : ''}

📄 PANDADOC:
${result.pandaDocUrl ? `✅ Documento creado: ${result.pandaDocUrl}` : '❌ No enviado a PandaDoc'}

💾 BASE DE DATOS:
${result.savedToDatabase ? '✅ Guardado exitosamente' : '❌ Error al guardar'}

${result.warnings?.length ? `⚠️ Advertencias:\n${result.warnings.join('\n')}` : ''}
`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Resumen copiado",
        description: "El resumen de la cotización híbrida se ha copiado al portapapeles",
      });
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };

  const canProceed = formData.clientName && formData.businessType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="flex items-center gap-1">
              <Brain className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-300">+</span>
              <Building2 className="h-5 w-5 text-orange-400" />
            </div>
            Cotización Híbrida: IA + PandaDoc
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Genera cotizaciones inteligentes combinando el poder de la IA con documentos profesionales de PandaDoc
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-gray-600">
              <div className="text-center">
                <Brain className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="font-medium text-sm text-white">1. Análisis IA</h3>
                <p className="text-xs text-gray-300">Genera recomendaciones inteligentes</p>
              </div>
              <div className="text-center">
                <Zap className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="font-medium text-sm text-white">2. Mapeo Automático</h3>
                <p className="text-xs text-gray-300">Convierte productos IA → PandaDoc</p>
              </div>
              <div className="text-center">
                <Building2 className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <h3 className="font-medium text-sm text-white">3. Documento Profesional</h3>
                <p className="text-xs text-gray-300">Crea cotización firmable</p>
              </div>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName" className="text-gray-300">Nombre del Cliente *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                      placeholder="ej: Restaurante La Pasta"
                      disabled={!!currentLead}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail" className="text-gray-300">Email del Cliente</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                      placeholder="contacto@cliente.com"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessType" className="text-gray-300">Tipo de Negocio *</Label>
                    <Input
                      id="businessType"
                      value={formData.businessType}
                      onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                      placeholder="ej: restaurante, retail, servicios..."
                      disabled={!!currentLead}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tamaño" className="text-gray-300">Tamaño de Empresa</Label>
                    <Select 
                      value={formData.tamaño_empresa} 
                      onValueChange={(value: any) => setFormData({...formData, tamaño_empresa: value})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="pequeña" className="text-white hover:bg-gray-600">Pequeña (1-10 empleados)</SelectItem>
                        <SelectItem value="mediana" className="text-white hover:bg-gray-600">Mediana (11-50 empleados)</SelectItem>
                        <SelectItem value="grande" className="text-white hover:bg-gray-600">Grande (51-200 empleados)</SelectItem>
                        <SelectItem value="enterprise" className="text-white hover:bg-gray-600">Enterprise (200+ empleados)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="necesidades" className="text-gray-300">Necesidades Identificadas</Label>
                  <Textarea
                    id="necesidades"
                    placeholder="ej: Automatización de procesos, Control de inventario, Reportes de ventas"
                    value={formData.necesidades}
                    onChange={(e) => setFormData({...formData, necesidades: e.target.value})}
                    className="min-h-[60px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="presupuesto" className="text-gray-300">Presupuesto Estimado</Label>
                    <Input
                      id="presupuesto"
                      placeholder="ej: $5,000 - $10,000"
                      value={formData.presupuesto_estimado}
                      onChange={(e) => setFormData({...formData, presupuesto_estimado: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-gray-300">Prioridad</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value: any) => setFormData({...formData, priority: value})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="low" className="text-white hover:bg-gray-600">Baja</SelectItem>
                        <SelectItem value="medium" className="text-white hover:bg-gray-600">Media</SelectItem>
                        <SelectItem value="high" className="text-white hover:bg-gray-600">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateType" className="text-gray-300">Tipo de Template PandaDoc</Label>
                    <Select 
                      value={formData.templateType} 
                      onValueChange={(value: any) => setFormData({...formData, templateType: value})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="standard" className="text-white hover:bg-gray-600">Estándar</SelectItem>
                        <SelectItem value="monthly" className="text-white hover:bg-gray-600">Mensual (con pagos divididos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-7">
                    <input
                      type="checkbox"
                      id="sendToPandaDoc"
                      checked={formData.sendToPandaDoc}
                      onChange={(e) => setFormData({...formData, sendToPandaDoc: e.target.checked})}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    <Label htmlFor="sendToPandaDoc" className="text-sm text-gray-300">
                      Enviar automáticamente a PandaDoc
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={generateHybridQuote} 
                disabled={!canProceed}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Cotización Híbrida
              </Button>
            </div>
          </div>
        )}

        {/* AI Generation Step */}
        {step === 'ai-generating' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <Brain className="h-4 w-4 text-blue-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="font-medium text-white">🤖 IA Analizando el Negocio...</h3>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-300">
                Generando recomendaciones inteligentes para {formData.clientName}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Analizando tipo de negocio: {formData.businessType}</span>
              </div>
            </div>
          </div>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <Zap className="h-4 w-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="font-medium text-white">🔄 Mapeando Productos IA → PandaDoc...</h3>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-300">
                Convirtiendo recomendaciones IA a catálogo PandaDoc
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-300"></div>
                <span>Aplicando lógica de negocio específica</span>
              </div>
            </div>
          </div>
        )}

        {/* PandaDoc Step */}
        {step === 'pandadoc' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
              <Building2 className="h-4 w-4 text-orange-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="font-medium text-white">📄 Creando Documento PandaDoc...</h3>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-300">
                Generando cotización profesional y guardando en base de datos
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse animation-delay-600"></div>
                <span>Enviando a {formData.clientEmail || 'PandaDoc'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && result && (
          <div className="space-y-6">
            <Card className={`${result.success ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'} bg-gray-800`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {result.success ? (
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {result.success ? 'Cotización Híbrida Completada' : 'Error en Cotización Híbrida'}
                    </h3>
                    <p className="text-sm text-gray-300">
                      ID: {result.quoteId || 'No generado'}
                    </p>
                  </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <Brain className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                    <div className="text-sm font-medium text-white">IA</div>
                    <div className="text-xs text-gray-300">
                      {result.aiQuote?.titulo ? 'Completado' : 'Error'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <Zap className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                    <div className="text-sm font-medium text-white">Mapeo</div>
                    <div className="text-xs text-gray-300">
                      {result.mappingCoverage.coveragePercentage.toFixed(0)}% cobertura
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <Building2 className="h-6 w-6 text-orange-400 mx-auto mb-1" />
                    <div className="text-sm font-medium text-white">PandaDoc</div>
                    <div className="text-xs text-gray-300">
                      {result.pandaDocUrl ? 'Enviado' : 'No enviado'}
                    </div>
                  </div>
                </div>

                {/* Mapping Coverage */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white">Cobertura de Mapeo</span>
                    <span className="text-white">{result.mappingCoverage.coveragePercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={result.mappingCoverage.coveragePercentage} className="h-2" />
                  <div className="text-xs text-gray-300 mt-1">
                    {result.mappingCoverage.mappedItems} de {result.mappingCoverage.totalItems} productos mapeados
                  </div>
                </div>

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-white">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      Advertencias
                    </h4>
                    <ul className="text-xs space-y-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index} className="text-yellow-300">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Unmapped Items */}
                {result.mappingCoverage.unmappedItems.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-white">Productos Sin Mapear</h4>
                    <div className="flex flex-wrap gap-1">
                      {result.mappingCoverage.unmappedItems.map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-gray-300 border-gray-600">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="text-sm text-red-400 mb-4">
                    Error: {result.error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PandaDoc Link Highlight */}
            {result.pandaDocUrl && (
              <div className="mb-6 p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-700 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#FF6900] rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Documento PandaDoc Listo</h4>
                    <p className="text-sm text-gray-300">
                      Tu cotización profesional está disponible para enviar
                      <span className="inline-block ml-2 px-2 py-1 text-xs bg-green-900/30 text-green-400 rounded-full border border-green-700">
                        ✓ Se abrió automáticamente
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="bg-[#FF6900] hover:bg-[#E55A00] flex-1">
                    <a href={result.pandaDocUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir PandaDoc
                    </a>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(result.pandaDocUrl!);
                      toast({
                        title: "Link copiado",
                        description: "El enlace de PandaDoc se ha copiado al portapapeles"
                      });
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyResultSummary} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Resumen
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    window.open('/billing-quotes', '_blank');
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Todas las Cotizaciones
                </Button>
              </div>
              
              <Button onClick={() => onOpenChange(false)} className="bg-gray-700 hover:bg-gray-600 text-white">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}