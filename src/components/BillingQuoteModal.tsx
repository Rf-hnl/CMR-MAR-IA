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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  FileText, 
  DollarSign, 
  Package, 
  Calculator,
  ExternalLink,
  Plus,
  Minus,
  Search,
  Building2,
  Mail,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/useOrganization";
import { ORGANIZED_CATALOG, PRODUCT_CATEGORIES, type ProductItem } from '@/data/pricing';

interface BillingQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLead?: {
    name: string;
    email?: string | null;
    businessType?: string | null;
  } | null;
}

interface QuoteProduct {
  name: string;
  cantidad: number;
  descuento: number;
  paymentType: 'unico' | 'mensual';
  price: number;
}

interface QuoteCalculation {
  total_lista: number;
  total_descuento: number;
  pago_unico_total: number;
  pago_mensual_total: number;
  total_impuestos: number;
  total_final: number;
  pago_unico_total_con_impuesto: number;
  pago_mensual_total_con_impuesto: number;
}

export default function BillingQuoteModal({
  open,
  onOpenChange,
  currentLead
}: BillingQuoteModalProps) {
  const [step, setStep] = useState<'setup' | 'products' | 'review' | 'generating' | 'result'>('setup');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Form data
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [templateType, setTemplateType] = useState<'standard' | 'monthly'>('standard');
  
  // Products
  const [selectedProducts, setSelectedProducts] = useState<QuoteProduct[]>([]);
  const [calculation, setCalculation] = useState<QuoteCalculation | null>(null);
  
  // Result
  const [result, setResult] = useState<{
    success: boolean;
    documentId?: string;
    viewUrl?: string;
    error?: string;
  } | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('setup');
      setSelectedProducts([]);
      setCalculation(null);
      setResult(null);
      setSearchTerm('');
      setSelectedCategory('all');
      setClientName('');
      setClientEmail('');
      setTemplateType('standard');
    }
  }, [open]);

  // Pre-fill lead data
  useEffect(() => {
    if (currentLead) {
      setClientName(currentLead.name);
      setClientEmail(currentLead.email || '');
    }
  }, [currentLead]);

  // Get available products
  const getAvailableProducts = (): ProductItem[] => {
    let products = Object.values(ORGANIZED_CATALOG).flat();
    
    if (selectedCategory !== 'all') {
      const categoryKey = selectedCategory as keyof typeof PRODUCT_CATEGORIES;
      products = ORGANIZED_CATALOG[PRODUCT_CATEGORIES[categoryKey]] || [];
    }
    
    if (searchTerm) {
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return products;
  };

  // Add product to quote
  const addProduct = (product: ProductItem) => {
    const exists = selectedProducts.find(p => p.name === product.name);
    if (exists) {
      toast({
        title: "Producto ya agregado",
        description: "Este producto ya está en la cotización",
        variant: "destructive"
      });
      return;
    }

    const newProduct: QuoteProduct = {
      name: product.name,
      cantidad: 1,
      descuento: 0,
      paymentType: product.isRecurring ? 'mensual' : 'unico',
      price: product.price
    };

    setSelectedProducts([...selectedProducts, newProduct]);
  };

  // Remove product
  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  // Update product
  const updateProduct = (index: number, field: keyof QuoteProduct, value: any) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  // Calculate totals
  const calculateTotals = (): QuoteCalculation => {
    let total_lista = 0;
    let total_descuento = 0;
    let pago_unico_total = 0;
    let pago_mensual_total = 0;

    selectedProducts.forEach(product => {
      const subtotal = product.price * product.cantidad;
      const descuento_valor = (product.price * product.descuento / 100) * product.cantidad;
      const precio_final = subtotal - descuento_valor;

      total_lista += subtotal;
      total_descuento += descuento_valor;

      if (product.paymentType === 'unico') {
        pago_unico_total += precio_final;
      } else {
        pago_mensual_total += precio_final;
      }
    });

    const total_impuestos = (pago_unico_total + pago_mensual_total) * 0.07;
    const total_final = total_lista - total_descuento + total_impuestos;
    const pago_unico_total_con_impuesto = pago_unico_total * 1.07;
    const pago_mensual_total_con_impuesto = pago_mensual_total * 1.07;

    return {
      total_lista,
      total_descuento,
      pago_unico_total,
      pago_mensual_total,
      total_impuestos,
      total_final,
      pago_unico_total_con_impuesto,
      pago_mensual_total_con_impuesto
    };
  };

  // Generate quote
  const generateQuote = async () => {
    if (!user || !currentOrganization) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado y tener una organización seleccionada",
        variant: "destructive"
      });
      return;
    }

    if (!clientName || !clientEmail || selectedProducts.length === 0) {
      toast({
        title: "Datos incompletos",
        description: "Complete todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    setStep('generating');
    setLoading(true);

    try {
      const token = await user.getIdToken();

      // Use the new billing-quotes API that automatically saves to database
      const response = await fetch('/api/billing-quotes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          businessType: currentLead?.businessType || undefined,
          leadId: currentLead ? 'lead-id-placeholder' : undefined, // TODO: Use real lead ID
          templateType,
          organizationId: currentOrganization.id,
          products: selectedProducts.map(p => ({
            name: p.name,
            cantidad: p.cantidad,
            descuento: p.descuento,
            paymentType: p.paymentType
          })),
          priority: 'medium'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          documentId: data.documentId,
          viewUrl: data.viewUrl || data.pandaDocUrl
        });
        setStep('result');
        
        toast({
          title: "✅ Cotización creada",
          description: `Cotización guardada y enviada a ${clientEmail} vía PandaDoc`,
        });
      } else if (response.status === 207) {
        // Partial success - saved to database but PandaDoc failed
        setResult({
          success: false,
          error: `${data.error}: ${data.details}`
        });
        setStep('result');
        
        toast({
          title: "⚠️ Cotización guardada parcialmente",
          description: "Se guardó en la base de datos pero falló el envío a PandaDoc",
          variant: "destructive"
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Error al generar cotización'
        });
        setStep('result');
        
        toast({
          title: "❌ Error",
          description: data.error || 'Error al generar cotización',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        success: false,
        error: 'Error de conexión'
      });
      setStep('result');
      
      toast({
        title: "❌ Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update calculation when products change
  useEffect(() => {
    if (selectedProducts.length > 0) {
      setCalculation(calculateTotals());
    } else {
      setCalculation(null);
    }
  }, [selectedProducts]);

  const canProceedToProducts = clientName && clientEmail;
  const canProceedToReview = selectedProducts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Generador de Cotización PandaDoc
          </DialogTitle>
          <DialogDescription>
            Crea cotizaciones profesionales usando tu catálogo de productos HypernovLabs
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Nombre del Cliente *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="ej: Restaurante La Pasta"
                      disabled={!!currentLead}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email del Cliente *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="contacto@cliente.com"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="templateType">Tipo de Cotización</Label>
                  <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Estándar</SelectItem>
                      <SelectItem value="monthly">Mensual (con pagos divididos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep('products')} 
                disabled={!canProceedToProducts}
              >
                Continuar a Productos
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Products */}
        {step === 'products' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Catálogo de Productos</CardTitle>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {getAvailableProducts().map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-muted-foreground">{product.description}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">${product.price}</Badge>
                              {product.isRecurring && (
                                <Badge variant="secondary" className="text-xs">Mensual</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addProduct(product)}
                            disabled={selectedProducts.some(p => p.name === product.name)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Selected Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Productos Seleccionados
                    <Badge variant="secondary">{selectedProducts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {selectedProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-900" />
                        <p>No hay productos seleccionados</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedProducts.map((product, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">${product.price} unitario</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeProduct(index)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Cantidad</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={product.cantidad}
                                    onChange={(e) => updateProduct(index, 'cantidad', parseInt(e.target.value) || 1)}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Descuento %</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={product.descuento}
                                    onChange={(e) => updateProduct(index, 'descuento', parseInt(e.target.value) || 0)}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Pago</Label>
                                  <Select
                                    value={product.paymentType}
                                    onValueChange={(value: any) => updateProduct(index, 'paymentType', value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unico">Único</SelectItem>
                                      <SelectItem value="mensual">Mensual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('setup')}>
                Volver
              </Button>
              <Button 
                onClick={() => setStep('review')} 
                disabled={!canProceedToReview}
              >
                Revisar Cotización
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && calculation && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Cotización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <p className="font-medium">{clientName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{clientEmail}</p>
                  </div>
                  <div>
                    <Label>Tipo de Template</Label>
                    <Badge>{templateType === 'monthly' ? 'Mensual' : 'Estándar'}</Badge>
                  </div>
                  <div>
                    <Label>Productos</Label>
                    <p className="font-medium">{selectedProducts.length} items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cálculos Financieros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-900 rounded">
                    <div className="text-sm text-muted-foreground">Total Lista</div>
                    <div className="font-bold">${calculation.total_lista.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-3 bg-red-900 rounded">
                    <div className="text-sm text-muted-foreground">Descuentos</div>
                    <div className="font-bold text-red-600">-${calculation.total_descuento.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-900 rounded">
                    <div className="text-sm text-muted-foreground">Impuestos (7%)</div>
                    <div className="font-bold text-blue-600">${calculation.total_impuestos.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-3 bg-green-900 rounded">
                    <div className="text-sm text-muted-foreground">Total Final</div>
                    <div className="font-bold text-green-600">${calculation.total_final.toFixed(2)}</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-900 rounded">
                    <div className="text-sm text-muted-foreground">Pago Único</div>
                    <div className="font-bold text-purple-600">${calculation.pago_unico_total_con_impuesto.toFixed(2)}</div>
                  </div>
                  <div className="text-center p-3 bg-orange-900 rounded">
                    <div className="text-sm text-muted-foreground">Pago Mensual</div>
                    <div className="font-bold text-orange-600">${calculation.pago_mensual_total_con_impuesto.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('products')}>
                Volver a Productos
              </Button>
              <Button onClick={generateQuote}>
                <FileText className="mr-2 h-4 w-4" />
                Generar Cotización
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h3 className="font-medium">Generando cotización en PandaDoc...</h3>
            <p className="text-sm text-muted-foreground text-center">
              Enviando cotización a {clientEmail}
            </p>
          </div>
        )}

        {/* Step 5: Result */}
        {step === 'result' && result && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {result.success ? (
                    <>
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                      <h3 className="text-lg font-medium">¡Cotización Enviada!</h3>
                      <p className="text-muted-foreground">
                        La cotización ha sido enviada exitosamente a {clientEmail}
                      </p>
                      {result.viewUrl && (
                        <Button asChild>
                          <a href={result.viewUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ver en PandaDoc
                          </a>
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
                      <h3 className="text-lg font-medium">Error al Generar Cotización</h3>
                      <p className="text-muted-foreground">{result.error}</p>
                      <Button variant="outline" onClick={() => setStep('review')}>
                        Intentar de Nuevo
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
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