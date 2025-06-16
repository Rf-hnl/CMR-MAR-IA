"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ExternalLink,
  Copy,
  Eye,
  Calendar,
  DollarSign,
  Package,
  Building2,
  Mail,
  CheckCircle,
  Clock,
  User,
  Hash
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BillingQuote } from '@/types/billing-quotes';

interface BillingQuoteDetailModalProps {
  quote: BillingQuote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BillingQuoteDetailModal({
  quote,
  open,
  onOpenChange
}: BillingQuoteDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!quote) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'generated': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'generated': return 'Generada';
      case 'sent': return 'Enviada';
      case 'viewed': return 'Vista';
      case 'accepted': return 'Aceptada';
      case 'rejected': return 'Rechazada';
      case 'expired': return 'Expirada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyQuoteInfo = async () => {
    const quoteText = `
COTIZACIÓN PANDADOC - ${quote.id}

Cliente: ${quote.clientName}
Email: ${quote.clientEmail}
Tipo de Negocio: ${quote.businessType || 'No especificado'}

Tipo de Template: ${quote.templateType === 'monthly' ? 'Mensual' : 'Estándar'}
Estado: ${getStatusLabel(quote.status)}
Prioridad: ${quote.priority || 'medium'}

PRODUCTOS (${quote.products.length}):
${quote.products.map(product => 
  `• ${product.name} (${product.cantidad}x) - $${product.precio_total.toLocaleString()}${product.descuento > 0 ? ` (${product.descuento}% desc.)` : ''}`
).join('\n')}

RESUMEN FINANCIERO:
• Subtotal: $${quote.calculations.total_lista.toLocaleString()}
• Descuentos: -$${quote.calculations.total_descuento.toLocaleString()}
• Impuestos (7%): $${quote.calculations.total_impuestos.toLocaleString()}
• TOTAL: $${quote.calculations.total_final.toLocaleString()}

Pago Único: $${quote.calculations.pago_unico_total_con_impuesto.toLocaleString()}
Pago Mensual: $${quote.calculations.pago_mensual_total_con_impuesto.toLocaleString()}

Creada: ${format(quote.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}
Válida hasta: ${format(quote.validUntil, 'dd/MM/yyyy', { locale: es })}
${quote.pandaDocUrl ? `\nPandaDoc: ${quote.pandaDocUrl}` : ''}
`;

    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Información copiada",
        description: "Los detalles de la cotización se han copiado al portapapeles",
      });
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Detalle de Cotización PandaDoc
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{quote.clientName}</h2>
                    <Badge className={getStatusColor(quote.status)}>
                      {getStatusLabel(quote.status)}
                    </Badge>
                    <Badge variant="outline">
                      {quote.templateType === 'monthly' ? 'Mensual' : 'Estándar'}
                    </Badge>
                    {quote.priority && (
                      <Badge className={getPriorityColor(quote.priority)}>
                        {quote.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{quote.clientEmail}</span>
                    </div>
                    {quote.businessType && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{quote.businessType}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span className="font-mono text-xs">{quote.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    ${quote.calculations.total_final.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {quote.metadata.totalProducts} productos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Productos ({quote.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {quote.products.map((product, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {product.cantidad}x ${product.precio_unitario.toLocaleString()} = ${product.subtotal.toLocaleString()}
                            </div>
                            {product.descuento > 0 && (
                              <div className="text-xs text-red-600">
                                Descuento {product.descuento}%: -${product.descuento_valor.toLocaleString()}
                              </div>
                            )}
                            <Badge 
                              variant="outline" 
                              className="text-xs mt-1"
                            >
                              {product.paymentType === 'unico' ? 'Pago Único' : 'Pago Mensual'}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${product.precio_total.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${quote.calculations.total_lista.toLocaleString()}</span>
                  </div>
                  {quote.calculations.total_descuento > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuentos:</span>
                      <span>-${quote.calculations.total_descuento.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Impuestos (7%):</span>
                    <span>${quote.calculations.total_impuestos.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL:</span>
                    <span>${quote.calculations.total_final.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pago Único:</span>
                    <span className="font-medium">${quote.calculations.pago_unico_total_con_impuesto.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pago Mensual:</span>
                    <span className="font-medium">${quote.calculations.pago_mensual_total_con_impuesto.toLocaleString()}</span>
                  </div>
                </div>

                {quote.templateType === 'monthly' && quote.calculations.pago_unico_50_1 && (
                  <>
                    <Separator />
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>50% Inicial:</span>
                        <span>${quote.calculations.pago_unico_50_1.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>50% Final:</span>
                        <span>${quote.calculations.pago_unico_50_2?.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline and Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Cronología
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-sm">Creada</div>
                    <div className="text-xs text-muted-foreground">
                      {format(quote.createdAt, 'dd MMMM yyyy, HH:mm', { locale: es })}
                    </div>
                  </div>
                </div>

                {quote.sentAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Enviada</div>
                      <div className="text-xs text-muted-foreground">
                        {format(quote.sentAt, 'dd MMMM yyyy, HH:mm', { locale: es })}
                      </div>
                    </div>
                  </div>
                )}

                {quote.viewedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Vista</div>
                      <div className="text-xs text-muted-foreground">
                        {format(quote.viewedAt, 'dd MMMM yyyy, HH:mm', { locale: es })}
                      </div>
                    </div>
                  </div>
                )}

                {quote.acceptedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Aceptada</div>
                      <div className="text-xs text-muted-foreground">
                        {format(quote.acceptedAt, 'dd MMMM yyyy, HH:mm', { locale: es })}
                      </div>
                    </div>
                  </div>
                )}

                {quote.rejectedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Rechazada</div>
                      <div className="text-xs text-muted-foreground">
                        {format(quote.rejectedAt, 'dd MMMM yyyy, HH:mm', { locale: es })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Moneda:</span>
                  <span>{quote.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tasa de Impuesto:</span>
                  <span>{(quote.taxRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Válida hasta:</span>
                  <span>{format(quote.validUntil, 'dd MMMM yyyy', { locale: es })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Vistas:</span>
                  <span>{quote.metadata.viewCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fuente:</span>
                  <span className="capitalize">{quote.metadata.source === 'lead' ? 'Lead' : 'Manual'}</span>
                </div>
                {quote.metadata.hasDiscounts && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Incluye descuentos</span>
                  </div>
                )}
                {quote.metadata.hasRecurringItems && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Incluye pagos recurrentes</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{quote.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end border-t pt-4">
            <Button variant="outline" onClick={copyQuoteInfo}>
              {copied ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Información
                </>
              )}
            </Button>
            
            {quote.pandaDocUrl && (
              <Button asChild className="bg-[#FF6900] hover:bg-[#E55A00]">
                <a href={quote.pandaDocUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en PandaDoc
                </a>
              </Button>
            )}
            
            <Button onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}