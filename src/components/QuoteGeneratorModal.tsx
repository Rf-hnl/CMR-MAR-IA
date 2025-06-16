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
import { 
  Loader2, 
  FileText, 
  DollarSign, 
  Package, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Copy,
  Send,
  Download,
  Sparkles,
  Calculator,
  MessageCircle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/useOrganization";
import { getEvolutionAPI } from '@/lib/evolution-api';

interface QuoteGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLead?: {
    name: string;
    phone?: string | null;
    businessType?: string | null;
  } | null;
}

interface QuoteItem {
  nombre: string;
  categoria: 'producto' | 'servicio';
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  justificacion: string;
  prioridad: 'alta' | 'media' | 'baja';
}

interface QuotePackage {
  nombre: string;
  descripcion: string;
  items: QuoteItem[];
  precio_paquete: number;
  descuento_aplicado?: number;
  beneficios: string[];
}

interface QuoteData {
  titulo: string;
  resumen_ejecutivo: string;
  analisis_necesidades: {
    necesidades_identificadas: string[];
    oportunidades: string[];
    desafios: string[];
  };
  paquetes_sugeridos: QuotePackage[];
  items_adicionales?: QuoteItem[];
  resumen_financiero: {
    precio_minimo: number;
    precio_recomendado: number;
    precio_premium: number;
    forma_pago_sugerida: string;
    condiciones_especiales?: string[];
  };
  propuesta_valor: {
    beneficios_principales: string[];
    roi_estimado: string;
    timeline_implementacion: string;
  };
  proximos_pasos: string[];
  validez_cotizacion: string;
  terminos_condiciones: string[];
  metadata?: {
    generated_at: string;
    lead_name: string;
    business_type: string;
  };
}

export default function QuoteGeneratorModal({
  open,
  onOpenChange,
  currentLead
}: QuoteGeneratorModalProps) {
  const [step, setStep] = useState<'form' | 'generating' | 'viewing'>('form');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre_lead: '',
    tipo_negocio: '',
    necesidades: '',
    presupuesto_estimado: '',
    tamaño_empresa: 'pequeña' as 'pequeña' | 'mediana' | 'grande' | 'enterprise',
    requerimientos_especiales: '',
    contexto_adicional: ''
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('form');
      setQuote(null);
      setSelectedPackage(0);
      setFormData({
        nombre_lead: '',
        tipo_negocio: '',
        necesidades: '',
        presupuesto_estimado: '',
        tamaño_empresa: 'pequeña',
        requerimientos_especiales: '',
        contexto_adicional: ''
      });
    }
  }, [open]);

  const generateQuote = async () => {
    if (!currentOrganization) {
      toast({
        title: "Error",
        description: "Información de la organización no disponible",
        variant: "destructive"
      });
      return;
    }

    if (!currentLead && (!formData.nombre_lead || !formData.tipo_negocio)) {
      toast({
        title: "Error",
        description: "Por favor completa el nombre del lead y tipo de negocio",
        variant: "destructive"
      });
      return;
    }

    setStep('generating');
    setLoading(true);

    try {
      const requestBody = {
        leadName: currentLead?.name || formData.nombre_lead,
        businessType: currentLead?.businessType || formData.tipo_negocio || 'Negocio General',
        organizationId: currentOrganization.id,
        leadInfo: {
          necesidades: formData.necesidades ? formData.necesidades.split(',').map(n => n.trim()) : [],
          presupuesto_estimado: formData.presupuesto_estimado || undefined,
          tamaño_empresa: formData.tamaño_empresa
        },
        requerimientos_especiales: formData.requerimientos_especiales ? 
          formData.requerimientos_especiales.split(',').map(r => r.trim()) : [],
        contexto_adicional: formData.contexto_adicional || undefined
      };

      console.log('Generating quote with data:', requestBody);

      const response = await fetch('/api/ai/generate-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar cotización');
      }

      const result: QuoteData = await response.json();
      setQuote(result);
      setStep('viewing');

      // Guardar cotización en la base de datos
      try {
        const token = await user?.getIdToken();
        if (token) {
          const saveResponse = await fetch('/api/quotes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              quoteData: result,
              leadId: currentLead?.name ? undefined : undefined, // TODO: usar ID real del lead si existe
              leadName: currentLead?.name || formData.nombre_lead,
              businessType: currentLead?.businessType || formData.tipo_negocio,
              organizationId: currentOrganization.id
            })
          });

          if (saveResponse.ok) {
            const saveResult = await saveResponse.json();
            console.log('Quote saved with ID:', saveResult.quoteId);
          }
        }
      } catch (saveError) {
        console.error('Error saving quote:', saveError);
        // No mostrar error al usuario, solo loguear
      }

      toast({
        title: "✨ Cotización Generada",
        description: `Cotización inteligente creada para ${currentLead?.name || formData.nombre_lead}`,
      });
    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar la cotización",
        variant: "destructive"
      });
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const copyQuoteText = async () => {
    if (!quote) return;

    const selectedPkg = quote.paquetes_sugeridos[selectedPackage];
    
    const quoteText = `
📄 COTIZACIÓN PERSONALIZADA
${quote.titulo}

👨‍💼 Cliente: ${quote.metadata?.lead_name}
🏢 Tipo de Negocio: ${quote.metadata?.business_type}
📅 Fecha: ${new Date().toLocaleDateString()}

📋 RESUMEN EJECUTIVO:
${quote.resumen_ejecutivo}

🎯 PAQUETE RECOMENDADO: ${selectedPkg.nombre}
${selectedPkg.descripcion}

💰 PRECIO: $${selectedPkg.precio_paquete.toLocaleString()}
${selectedPkg.descuento_aplicado ? `💸 Descuento aplicado: ${selectedPkg.descuento_aplicado}%` : ''}

📦 INCLUYE:
${selectedPkg.items.map(item => 
  `• ${item.nombre} (${item.cantidad}x) - $${item.precio_total.toLocaleString()}\n  ${item.descripcion}`
).join('\n')}

✅ BENEFICIOS:
${selectedPkg.beneficios.map(b => `• ${b}`).join('\n')}

🚀 PROPUESTA DE VALOR:
• ROI Estimado: ${quote.propuesta_valor.roi_estimado}
• Implementación: ${quote.propuesta_valor.timeline_implementacion}

📞 PRÓXIMOS PASOS:
${quote.proximos_pasos.map(p => `• ${p}`).join('\n')}

⏰ Validez: ${quote.validez_cotizacion}
💳 Forma de Pago: ${quote.resumen_financiero.forma_pago_sugerida}

¡Estamos listos para potenciar tu negocio! 🚀
`;

    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Cotización copiada",
        description: "El texto de la cotización se ha copiado al portapapeles",
      });
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };

  const sendViaWhatsApp = async () => {
    if (!quote || !currentLead?.phone) {
      toast({
        title: "Error",
        description: "No hay número de teléfono disponible para este lead",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedPkg = quote.paquetes_sugeridos[selectedPackage];
      
      const message = `🎯 *COTIZACIÓN PERSONALIZADA*
      
Hola ${currentLead.name}! 👋

He preparado una cotización especial para tu ${quote.metadata?.business_type}:

💼 *${selectedPkg.nombre}*
${selectedPkg.descripcion}

💰 *Inversión: $${selectedPkg.precio_paquete.toLocaleString()}*
${selectedPkg.descuento_aplicado ? `🎉 *Con ${selectedPkg.descuento_aplicado}% de descuento especial*` : ''}

✅ *Incluye:*
${selectedPkg.items.slice(0, 3).map(item => `• ${item.nombre}`).join('\n')}
${selectedPkg.items.length > 3 ? `• Y ${selectedPkg.items.length - 3} elementos más...` : ''}

🚀 *ROI Estimado:* ${quote.propuesta_valor.roi_estimado}
⏱️ *Implementación:* ${quote.propuesta_valor.timeline_implementacion}

¿Te interesa conocer más detalles? ¡Hablemos! 📞`;

      const evolutionAPI = getEvolutionAPI();
      const result = await evolutionAPI.sendTextMessage({
        number: currentLead.phone,
        text: message
      });

      if (result.success) {
        toast({
          title: "✅ Cotización enviada",
          description: `Cotización enviada por WhatsApp a ${currentLead.name}`,
        });
      } else {
        throw new Error(result.error || 'Error al enviar por WhatsApp');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la cotización por WhatsApp",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-300';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'baja': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Generador de Cotizaciones con IA
          </DialogTitle>
          <DialogDescription>
            Crea cotizaciones inteligentes basadas en tu catálogo de productos y servicios
          </DialogDescription>
        </DialogHeader>

        {/* Formulario de entrada */}
        {step === 'form' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Lead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre_lead">Nombre del Lead</Label>
                    {currentLead ? (
                      <Input value={currentLead.name} disabled />
                    ) : (
                      <Input
                        id="nombre_lead"
                        placeholder="ej: Restaurante La Pasta"
                        value={formData.nombre_lead}
                        onChange={(e) => setFormData({...formData, nombre_lead: e.target.value})}
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="tipo_negocio">Tipo de Negocio</Label>
                    {currentLead ? (
                      <Input value={currentLead.businessType || 'No especificado'} disabled />
                    ) : (
                      <Input
                        id="tipo_negocio"
                        placeholder="ej: restaurante, retail, servicios..."
                        value={formData.tipo_negocio}
                        onChange={(e) => setFormData({...formData, tipo_negocio: e.target.value})}
                      />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="presupuesto">Presupuesto Estimado</Label>
                    <Input
                      id="presupuesto"
                      placeholder="ej: $5,000 - $10,000"
                      value={formData.presupuesto_estimado}
                      onChange={(e) => setFormData({...formData, presupuesto_estimado: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tamaño">Tamaño de Empresa</Label>
                    <Select 
                      value={formData.tamaño_empresa} 
                      onValueChange={(value: any) => setFormData({...formData, tamaño_empresa: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pequeña">Pequeña (1-10 empleados)</SelectItem>
                        <SelectItem value="mediana">Mediana (11-50 empleados)</SelectItem>
                        <SelectItem value="grande">Grande (51-200 empleados)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (200+ empleados)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="necesidades">Necesidades Identificadas</Label>
                  <Textarea
                    id="necesidades"
                    placeholder="ej: Automatización de procesos, Control de inventario, Reportes de ventas"
                    value={formData.necesidades}
                    onChange={(e) => setFormData({...formData, necesidades: e.target.value})}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separa múltiples necesidades con comas</p>
                </div>

                <div>
                  <Label htmlFor="requerimientos">Requerimientos Especiales</Label>
                  <Textarea
                    id="requerimientos"
                    placeholder="ej: Integración con sistema existente, Soporte 24/7, Capacitación personalizada"
                    value={formData.requerimientos_especiales}
                    onChange={(e) => setFormData({...formData, requerimientos_especiales: e.target.value})}
                    className="min-h-[60px]"
                  />
                </div>

                <div>
                  <Label htmlFor="contexto">Contexto Adicional</Label>
                  <Textarea
                    id="contexto"
                    placeholder="Información adicional relevante sobre el lead o la oportunidad..."
                    value={formData.contexto_adicional}
                    onChange={(e) => setFormData({...formData, contexto_adicional: e.target.value})}
                    className="min-h-[60px]"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={generateQuote} className="px-8">
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Cotización con IA
              </Button>
            </div>
          </div>
        )}

        {/* Estado de generación */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <Calculator className="h-4 w-4 text-blue-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h3 className="font-medium">🤖 IA Generando Cotización...</h3>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Analizando tu catálogo de productos y servicios
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Evaluando necesidades del lead</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-300"></div>
                <span>Calculando precios y paquetes</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-600"></div>
                <span>Creando propuesta de valor</span>
              </div>
            </div>
          </div>
        )}

        {/* Vista de cotización generada */}
        {step === 'viewing' && quote && (
          <div className="space-y-6">
            {/* Header de la cotización */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{quote.titulo}</h2>
                    <p className="text-gray-600 mt-2">{quote.resumen_ejecutivo}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>📅 {new Date().toLocaleDateString()}</span>
                      <span>⏰ Válida hasta: {quote.validez_cotizacion}</span>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generado con IA
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Análisis de necesidades */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                    Análisis de Necesidades
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">🎯 Necesidades Identificadas</h4>
                    <ul className="text-sm space-y-1">
                      {quote.analisis_necesidades.necesidades_identificadas.map((necesidad, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                          {necesidad}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm mb-2">🚀 Oportunidades</h4>
                    <ul className="text-sm space-y-1">
                      {quote.analisis_necesidades.oportunidades.map((oportunidad, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 text-orange-600 mt-1 flex-shrink-0" />
                          {oportunidad}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Paquetes sugeridos */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-green-600" />
                    Paquetes de Solución
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Selector de paquetes */}
                    <div className="flex gap-2 flex-wrap">
                      {quote.paquetes_sugeridos.map((pkg, index) => (
                        <Button
                          key={index}
                          variant={selectedPackage === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedPackage(index)}
                        >
                          {pkg.nombre}
                        </Button>
                      ))}
                    </div>

                    {/* Paquete seleccionado */}
                    {quote.paquetes_sugeridos[selectedPackage] && (
                      <Card className="border-2 border-primary">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">
                              {quote.paquetes_sugeridos[selectedPackage].nombre}
                            </CardTitle>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">
                                ${quote.paquetes_sugeridos[selectedPackage].precio_paquete.toLocaleString()}
                              </div>
                              {quote.paquetes_sugeridos[selectedPackage].descuento_aplicado && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {quote.paquetes_sugeridos[selectedPackage].descuento_aplicado}% descuento
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-muted-foreground">
                            {quote.paquetes_sugeridos[selectedPackage].descripcion}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Items del paquete */}
                            <div>
                              <h4 className="font-medium mb-3">📦 Incluye:</h4>
                              <div className="space-y-2">
                                {quote.paquetes_sugeridos[selectedPackage].items.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.nombre}</span>
                                        <Badge className={`text-xs ${getPriorityColor(item.prioridad)}`}>
                                          {item.prioridad}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {item.categoria}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">{item.descripcion}</p>
                                      <p className="text-xs text-blue-600 mt-1">{item.justificacion}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className="font-medium">${item.precio_total.toLocaleString()}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.cantidad}x ${item.precio_unitario.toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Beneficios */}
                            <div>
                              <h4 className="font-medium mb-3">✅ Beneficios:</h4>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {quote.paquetes_sugeridos[selectedPackage].beneficios.map((beneficio, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    {beneficio}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen financiero y propuesta de valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Resumen Financiero
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Básico</div>
                      <div className="font-bold">${quote.resumen_financiero.precio_minimo.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <div className="text-sm text-blue-600">Recomendado</div>
                      <div className="font-bold text-blue-700">${quote.resumen_financiero.precio_recomendado.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Premium</div>
                      <div className="font-bold text-purple-700">${quote.resumen_financiero.precio_premium.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">💳 Forma de Pago</h4>
                    <p className="text-sm">{quote.resumen_financiero.forma_pago_sugerida}</p>
                  </div>

                  {quote.resumen_financiero.condiciones_especiales && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">🎁 Condiciones Especiales</h4>
                      <ul className="text-sm space-y-1">
                        {quote.resumen_financiero.condiciones_especiales.map((condicion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            {condicion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Propuesta de Valor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">🎯 ROI Estimado</h4>
                    <p className="text-lg font-bold text-green-600">{quote.propuesta_valor.roi_estimado}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">⏱️ Timeline de Implementación</h4>
                    <p className="text-sm">{quote.propuesta_valor.timeline_implementacion}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm mb-2">✅ Beneficios Principales</h4>
                    <ul className="text-sm space-y-1">
                      {quote.propuesta_valor.beneficios_principales.map((beneficio, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                          {beneficio}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Próximos pasos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Próximos Pasos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {quote.proximos_pasos.map((paso, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm">{paso}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3 justify-end border-t pt-4">
              <Button variant="outline" onClick={copyQuoteText}>
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Cotización
                  </>
                )}
              </Button>
              
              {currentLead?.phone && (
                <Button onClick={sendViaWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E]">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar por WhatsApp
                </Button>
              )}
              
              <Button onClick={() => setStep('form')} variant="outline">
                Nueva Cotización
              </Button>
              
              <Button onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}