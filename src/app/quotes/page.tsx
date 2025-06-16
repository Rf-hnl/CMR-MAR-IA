"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Send, 
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  ArrowUpRight,
  MessageCircle,
  Clock
} from 'lucide-react';
import QuoteGeneratorModal from '@/components/QuoteGeneratorModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos para el historial de cotizaciones
interface SavedQuote {
  id: string;
  leadName: string;
  businessType: string;
  totalAmount: number;
  packageName: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  createdAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  validUntil: Date;
  metadata: {
    items: number;
    discount?: number;
  };
}

// Datos simulados (en producción vendrían de la base de datos)
const mockQuotes: SavedQuote[] = [
  {
    id: '1',
    leadName: 'Restaurante La Pasta',
    businessType: 'restaurante',
    totalAmount: 12500,
    packageName: 'Paquete Recomendado',
    status: 'sent',
    createdAt: new Date('2024-01-15'),
    sentAt: new Date('2024-01-15'),
    validUntil: new Date('2024-02-15'),
    metadata: { items: 4, discount: 15 }
  },
  {
    id: '2',
    leadName: 'Boutique Elegance',
    businessType: 'retail',
    totalAmount: 8000,
    packageName: 'Paquete Básico',
    status: 'viewed',
    createdAt: new Date('2024-01-14'),
    sentAt: new Date('2024-01-14'),
    viewedAt: new Date('2024-01-15'),
    validUntil: new Date('2024-02-14'),
    metadata: { items: 3 }
  },
  {
    id: '3',
    leadName: 'Bufete Jurídico Santos',
    businessType: 'servicios profesionales',
    totalAmount: 18000,
    packageName: 'Paquete Premium',
    status: 'accepted',
    createdAt: new Date('2024-01-10'),
    sentAt: new Date('2024-01-12'),
    validUntil: new Date('2024-02-10'),
    metadata: { items: 6, discount: 10 }
  },
  {
    id: '4',
    leadName: 'Clínica Dental Smile',
    businessType: 'servicios médicos',
    totalAmount: 15000,
    packageName: 'Paquete Personalizado',
    status: 'draft',
    createdAt: new Date('2024-01-16'),
    validUntil: new Date('2024-02-16'),
    metadata: { items: 5 }
  }
];

export default function QuotesPage() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<SavedQuote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<SavedQuote | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar cotizaciones desde la base de datos
  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user || !currentOrganization) return;
      
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/quotes?organizationId=${currentOrganization.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setQuotes(data.quotes || []);
        } else {
          console.error('Error fetching quotes:', response.statusText);
          // Fallback a datos simulados en caso de error
          setQuotes(mockQuotes);
        }
      } catch (error) {
        console.error('Error fetching quotes:', error);
        // Fallback a datos simulados en caso de error
        setQuotes(mockQuotes);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user, currentOrganization]);

  // Filtrar cotizaciones
  useEffect(() => {
    let filtered = quotes;

    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.packageName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, statusFilter]);

  // Estadísticas
  const stats = {
    total: quotes.length,
    sent: quotes.filter(q => q.status === 'sent' || q.status === 'viewed' || q.status === 'accepted').length,
    totalValue: quotes.reduce((sum, q) => sum + q.totalAmount, 0),
    acceptanceRate: quotes.filter(q => q.status === 'accepted').length / Math.max(quotes.filter(q => q.status !== 'draft').length, 1) * 100,
    avgQuoteValue: quotes.length > 0 ? quotes.reduce((sum, q) => sum + q.totalAmount, 0) / quotes.length : 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviada';
      case 'viewed': return 'Vista';
      case 'accepted': return 'Aceptada';
      case 'rejected': return 'Rechazada';
      default: return status;
    }
  };

  const handleSendQuote = async (quoteId: string) => {
    if (!user || !currentOrganization) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/quotes', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteId,
          status: 'sent',
          organizationId: currentOrganization.id
        })
      });

      if (response.ok) {
        // Actualizar estado local
        setQuotes(prev => prev.map(q => 
          q.id === quoteId 
            ? { ...q, status: 'sent' as const, sentAt: new Date() }
            : q
        ));
        
        toast({
          title: "Cotización enviada",
          description: "La cotización ha sido enviada por WhatsApp",
        });
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la cotización",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y envía cotizaciones inteligentes generadas con IA
          </p>
        </div>
        
        <Button onClick={() => setIsQuoteModalOpen(true)} className="bg-primary">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cotización
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cotizaciones</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Enviadas</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tasa Aceptación</p>
                <p className="text-2xl font-bold">{stats.acceptanceRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, tipo de negocio o paquete..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borradores</SelectItem>
                <SelectItem value="sent">Enviadas</SelectItem>
                <SelectItem value="viewed">Vistas</SelectItem>
                <SelectItem value="accepted">Aceptadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all') && (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de cotizaciones */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando cotizaciones...</p>
            </CardContent>
          </Card>
        ) : filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay cotizaciones</h3>
              <p className="text-muted-foreground mb-4">
                {quotes.length === 0 
                  ? "Aún no has creado ninguna cotización. ¡Crea tu primera cotización inteligente!"
                  : "No se encontraron cotizaciones con los filtros aplicados."
                }
              </p>
              {quotes.length === 0 && (
                <Button onClick={() => setIsQuoteModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Cotización
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{quote.leadName}</h3>
                      <Badge className={getStatusColor(quote.status)}>
                        {getStatusLabel(quote.status)}
                      </Badge>
                      {quote.metadata.discount && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {quote.metadata.discount}% descuento
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">{quote.packageName}</p>
                        <p>{quote.businessType}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">${quote.totalAmount.toLocaleString()}</p>
                        <p>{quote.metadata.items} items</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {format(quote.createdAt, 'dd MMM yyyy', { locale: es })}
                        </p>
                        <p>Creada</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {format(quote.validUntil, 'dd MMM yyyy', { locale: es })}
                        </p>
                        <p>Válida hasta</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    
                    {quote.status === 'draft' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSendQuote(quote.id)}
                        className="bg-[#25D366] hover:bg-[#128C7E]"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                    )}
                    
                    {quote.status !== 'draft' && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    )}
                  </div>
                </div>

                {/* Timeline de estado */}
                {quote.status !== 'draft' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Creada {format(quote.createdAt, 'dd/MM', { locale: es })}</span>
                      </div>
                      {quote.sentAt && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Enviada {format(quote.sentAt, 'dd/MM', { locale: es })}</span>
                        </div>
                      )}
                      {quote.viewedAt && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>Vista {format(quote.viewedAt, 'dd/MM', { locale: es })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de generación de cotizaciones */}
      <QuoteGeneratorModal
        open={isQuoteModalOpen}
        onOpenChange={setIsQuoteModalOpen}
        currentLead={null} // Para cotización nueva sin lead específico
      />
    </div>
  );
}