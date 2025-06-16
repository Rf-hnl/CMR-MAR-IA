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
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import BillingQuoteModal from '@/components/BillingQuoteModal';
import BillingQuoteDetailModal from '@/components/BillingQuoteDetailModal';
import HybridQuoteModal from '@/components/HybridQuoteModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BillingQuote } from '@/types/billing-quotes';
import type { ExtendedLead as Lead } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getBusinessTypeFromMetaLead } from '@/lib/lead-converter';

interface BillingQuoteStats {
  total: number;
  byStatus: Record<string, number>;
  byTemplateType: Record<string, number>;
  totalValue: number;
  averageValue: number;
  acceptanceRate: number;
  viewRate: number;
}

export default function BillingQuotesPage() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [quotes, setQuotes] = useState<BillingQuote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<BillingQuote[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isHybridQuoteModalOpen, setIsHybridQuoteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<BillingQuote | null>(null);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [stats, setStats] = useState<BillingQuoteStats | null>(null);

  // Fetch billing quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user || !currentOrganization) return;
      
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/billing-quotes?organizationId=${currentOrganization.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setQuotes(data.quotes || []);
          setStats(data.stats || null);
        } else {
          console.error('Error fetching billing quotes:', response.statusText);
          toast({
            title: "Error",
            description: "No se pudieron cargar las cotizaciones",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching billing quotes:', error);
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [user, currentOrganization, toast]);

  // Fetch leads when no quotes exist
  const fetchLeads = async () => {
    if (!user || !currentOrganization) return;
    
    setLoadingLeads(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/getLeadsFlow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          userId: user.uid
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Load leads when there are no quotes
  useEffect(() => {
    if (!loading && quotes.length === 0) {
      fetchLeads();
    }
  }, [loading, quotes.length]);

  // Filter quotes
  useEffect(() => {
    let filtered = quotes;

    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.businessType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    if (templateFilter !== 'all') {
      filtered = filtered.filter(quote => quote.templateType === templateFilter);
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, statusFilter, templateFilter]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'generated': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <ExternalLink className="h-4 w-4" />;
      case 'viewed': return <Eye className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTemplateFilter('all');
  };

  const refreshQuotes = async () => {
    if (!user || !currentOrganization) return;
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/billing-quotes?organizationId=${currentOrganization.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
        setStats(data.stats || null);
        toast({
          title: "✅ Actualizado",
          description: "Lista de cotizaciones actualizada",
        });
      }
    } catch (error) {
      console.error('Error refreshing quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuoteFromLead = (lead: Lead, isHybrid: boolean = false) => {
    setSelectedLeadForQuote(lead);
    if (isHybrid) {
      setIsHybridQuoteModalOpen(true);
    } else {
      setIsQuoteModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Cotizaciones PandaDoc
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona cotizaciones creadas con PandaDoc desde tu catálogo de productos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshQuotes}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
          <Button onClick={() => setIsQuoteModalOpen(true)} className="bg-primary">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotización PandaDoc
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
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
                <DollarSign className="h-4 w-4 text-green-600" />
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
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Promedio</p>
                  <p className="text-2xl font-bold">${stats.averageValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Tasa Aceptación</p>
                  <p className="text-2xl font-bold">{stats.acceptanceRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, email o tipo de negocio..."
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
                <SelectItem value="generated">Generadas</SelectItem>
                <SelectItem value="sent">Enviadas</SelectItem>
                <SelectItem value="viewed">Vistas</SelectItem>
                <SelectItem value="accepted">Aceptadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="standard">Estándar</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all' || templateFilter !== 'all') && (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando cotizaciones...</p>
            </CardContent>
          </Card>
        ) : filteredQuotes.length === 0 ? (
          quotes.length === 0 ? (
            // Show leads list when no quotes exist
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Selecciona un Lead para Crear tu Primera Cotización
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Elige un lead de tu lista para generar una cotización automáticamente con sus datos.
                  </p>
                </CardHeader>
              </Card>

              {loadingLeads ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando leads disponibles...</p>
                  </CardContent>
                </Card>
              ) : leads.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay leads disponibles</h3>
                    <p className="text-muted-foreground mb-4">
                      Primero crea algunos leads para poder generar cotizaciones.
                    </p>
                    <Button onClick={() => window.open('/leads', '_blank')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ir a Crear Leads
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {leads.slice(0, 10).map((lead) => {
                    const businessType = getBusinessTypeFromMetaLead(lead);
                    const featuredImage = lead.images?.find(img => img.isFeatured)?.url;
                    
                    return (
                      <Card key={lead.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={featuredImage} alt={lead.name} />
                                <AvatarFallback>
                                  {(lead.fullName || lead.name).substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <h3 className="font-semibold">{lead.fullName || lead.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{lead.email || 'Sin email'}</span>
                                  {businessType && (
                                    <>
                                      <span>•</span>
                                      <span className="capitalize">{businessType}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCreateQuoteFromLead(lead, false)}
                              >
                                <Building2 className="h-4 w-4 mr-2" />
                                PandaDoc
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleCreateQuoteFromLead(lead, true)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                              >
                                <span className="mr-2">⚡</span>
                                Híbrida IA+PandaDoc
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {leads.length > 10 && (
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-muted-foreground mb-2">
                          Mostrando 10 de {leads.length} leads disponibles
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => window.open('/leads', '_blank')}
                        >
                          Ver Todos los Leads
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Show no results message when filtering
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron cotizaciones</h3>
                <p className="text-muted-foreground mb-4">
                  No hay cotizaciones que coincidan con los filtros aplicados.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </CardContent>
            </Card>
          )
        ) : (
          filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{quote.clientName}</h3>
                      <Badge className={getStatusColor(quote.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(quote.status)}
                          {getStatusLabel(quote.status)}
                        </div>
                      </Badge>
                      <Badge variant="outline">
                        {quote.templateType === 'monthly' ? 'Mensual' : 'Estándar'}
                      </Badge>
                      {quote.metadata.hasDiscounts && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Con descuentos
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">{quote.clientEmail}</p>
                        <p>{quote.businessType || 'Sin especificar'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">${quote.calculations.total_final.toLocaleString()}</p>
                        <p>{quote.metadata.totalProducts} productos</p>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedQuoteForDetail(quote);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalles
                    </Button>
                    
                    {quote.pandaDocUrl && (
                      <Button 
                        size="sm" 
                        asChild
                        className="bg-[#FF6900] hover:bg-[#E55A00]"
                      >
                        <a href={quote.pandaDocUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          PandaDoc
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Timeline of status changes */}
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
                      {quote.acceptedAt && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>Aceptada {format(quote.acceptedAt, 'dd/MM', { locale: es })}</span>
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

      {/* Modal for creating new quotes */}
      <BillingQuoteModal
        open={isQuoteModalOpen}
        onOpenChange={(open) => {
          setIsQuoteModalOpen(open);
          if (!open) {
            setSelectedLeadForQuote(null);
            // Refresh quotes when modal closes (in case a new quote was created)
            refreshQuotes();
          }
        }}
        currentLead={selectedLeadForQuote ? {
          name: selectedLeadForQuote.fullName || selectedLeadForQuote.name,
          email: selectedLeadForQuote.email,
          businessType: getBusinessTypeFromMetaLead(selectedLeadForQuote)
        } : null}
      />

      {/* Modal for creating hybrid quotes */}
      <HybridQuoteModal
        open={isHybridQuoteModalOpen}
        onOpenChange={(open) => {
          setIsHybridQuoteModalOpen(open);
          if (!open) {
            setSelectedLeadForQuote(null);
            // Refresh quotes when modal closes (in case a new quote was created)
            refreshQuotes();
          }
        }}
        currentLead={selectedLeadForQuote ? {
          name: selectedLeadForQuote.fullName || selectedLeadForQuote.name,
          email: selectedLeadForQuote.email,
          businessType: getBusinessTypeFromMetaLead(selectedLeadForQuote)
        } : null}
      />

      {/* Modal for viewing quote details */}
      <BillingQuoteDetailModal
        quote={selectedQuoteForDetail}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
}