"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import LoadingComponent from '@/components/LoadingComponent';
import LoadingSpinner from '@/components/LoadingSpinner';
import DuplicateDetector from '@/components/leads/DuplicateDetector';
import { BusinessDetailsModal } from "@/components/BusinessDetailsModal";
import SearchForm from '@/components/SearchForm';
import SearchResults from '@/components/SearchResults';
import { 
  Search, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  Send,
  Users,
  LineChart,
  Target,
  TrendingUp
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp as FirestoreTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { DataSource, DATA_SOURCE_CONFIG, type DataSourceStats, type UnifiedLead } from '@/types/data-sources';

// Business interfaces for search functionality
interface BusinessDetail {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  international_phone_number?: string;
  website?: string;
  types?: string[];
  rating?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  business_status?: string;
}

interface Business extends Partial<BusinessDetail> {
  place_id: string;
  name: string;
  business_status?: string;
}

const LEAD_STAGES_CLIENT = [
  "Nuevo",
  "Contactado", 
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

type LeadStageClient = typeof LEAD_STAGES_CLIENT[number];

interface LeadClient {
  id: string;
  uid: string;
  name: string;
  address: string | null;
  stage: LeadStageClient;
  createdAt: FirestoreTimestamp | string;
  updatedAt: FirestoreTimestamp | string;
  placeId: string;
  source: string;
  phone?: string | null;
  website?: string | null;
  businessType?: string | null;
}

const LeadSourcesPage = () => {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'search' | DataSource>('search');

  // Search functionality state
  const [country, setCountry] = useState('PA');
  const [place, setPlace] = useState('');
  const [businessTypeInput, setBusinessTypeInput] = useState('todos');
  const [keywords, setKeywords] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedBusinessDetail, setSelectedBusinessDetail] = useState<Business | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalDetailsLoading, setModalDetailsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Data sources functionality state
  const [stats, setStats] = useState<DataSourceStats[]>([]);
  const [sourceLeads, setSourceLeads] = useState<UnifiedLead[]>([]);
  const [selectedSourceLeads, setSelectedSourceLeads] = useState<string[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (initialLoadDone && !user) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, router]);

  // Search functionality methods
  const handleSearch = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Por favor, inicia sesión para buscar.", variant: "destructive" });
      return;
    }
    setSearchLoading(true);
    setSearchResults([]);
    setSelectedBusinessDetail(null);
    setSelectedLeads(new Set());
    setHasSearched(true);
    try {
      const queryParams = new URLSearchParams();
      if (country) queryParams.append('country', country);
      if (place) queryParams.append('place', place);
      if (businessTypeInput && businessTypeInput !== 'todos') queryParams.append('type', businessTypeInput);
      if (keywords) queryParams.append('keywords', keywords);

      const response = await fetch(`/api/findBusinesses?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al buscar negocios. La respuesta del servidor no fue JSON.' }));
        throw new Error(errorData.message || 'Error al buscar negocios.');
      }
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error: any) {
      toast({ title: "Error de Búsqueda", description: error.message, variant: "destructive" });
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCheckboxChange = (placeId: string) => {
    setSelectedLeads(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(placeId)) {
        newSelected.delete(placeId);
      } else {
        newSelected.add(placeId);
      }
      return newSelected;
    });
  };

  const handleShowDetails = async (business: Business) => {
    setSelectedBusinessDetail(business);
    setIsDetailsModalOpen(true);
    setModalDetailsLoading(true);
    try {
      const response = await fetch(`/api/getPlaceDetails?placeId=${business.place_id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No se pudieron cargar todos los detalles. La respuesta del servidor no fue JSON.' }));
        toast({ title: "Error al Cargar Detalles", description: `${errorData.message || 'Error desconocido'}. Mostrando información básica.`, variant: "destructive" });
        setModalDetailsLoading(false);
        return;
      }
      const data = await response.json();
      const enrichedBusinessData: Business = {
        ...business,
        ...data.result,
        place_id: business.place_id,
        name: data.result.name || business.name,
      };
      setSelectedBusinessDetail(enrichedBusinessData);
      setSearchResults(prevResults =>
        prevResults.map(b => b.place_id === business.place_id ? enrichedBusinessData : b)
      );
    } catch (error: any) {
      toast({ title: "Error al Cargar Detalles", description: error.message, variant: "destructive" });
    } finally {
      setModalDetailsLoading(false);
    }
  };

  const handleAddToLeads = async () => {
    if (!user || !currentOrganization) {
      toast({ title: "Error de Autenticación", description: "Por favor, inicia sesión para guardar leads.", variant: "destructive" });
      return;
    }
    if (selectedLeads.size === 0) {
      toast({ title: "No Hay Leads Seleccionados", description: "Por favor, selecciona negocios para guardar.", variant: "destructive" });
      return;
    }

    setSaveLoading(true);
    
    const leadsDataToSave = searchResults
      .filter(business => selectedLeads.has(business.place_id))
      .map(b => ({
        place_id: b.place_id,
        name: b.name,
        vicinity: b.vicinity,
        formatted_address: b.formatted_address,
        phone: b.international_phone_number,
        website: b.website,
        types: b.types,
        rating: b.rating,
        business_status: b.business_status
      }));

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/addLeads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leads: leadsDataToSave,
          organizationId: currentOrganization.id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar leads');
      }

      const savedCount = result.saved || 0;
      const totalCount = result.total || 0;
      const errors = result.errors || [];

      if (savedCount > 0) {
        toast({ 
          title: "Éxito", 
          description: `¡${savedCount} de ${totalCount} lead(s) guardados correctamente!` 
        });
      }

      if (errors.length > 0) {
        console.warn('Errors during lead saving:', errors);
        toast({ 
          title: "Advertencia", 
          description: `${errors.length} leads tuvieron errores. Revisa la consola para detalles.`,
          variant: "default"
        });
      }

      if (savedCount === 0 && errors.length === 0) {
        toast({ 
          title: "Información", 
          description: "Todos los leads seleccionados ya existían." 
        });
      }
      
    } catch (error: any) {
      console.error("Error saving leads:", error);
      toast({ 
        title: "Error al Guardar Leads", 
        description: error.message || "Error desconocido al guardar leads",
        variant: "destructive"
      });
    }

    setSelectedLeads(new Set());
    setSaveLoading(false);
  };

  // Data sources functionality methods
  const loadStats = useCallback(async () => {
    if (!user || !currentOrganization) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/data-sources/stats?organizationId=${currentOrganization.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error loading stats');

      const data = await response.json();
      setStats(data.stats || []);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas.",
        variant: "destructive"
      });
    } finally {
      setLoadingStats(false);
    }
  }, [user, currentOrganization, toast]);

  const loadSourceLeads = useCallback(async (source: DataSource) => {
    if (!user || !currentOrganization) return;

    console.log('🔄 Loading leads for source:', source);
    setLoadingLeads(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/data-sources/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          source
        })
      });

      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        let errorData;
        try {
          errorData = await response.json();
          console.error('📄 Error data:', errorData);
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Leads loaded successfully:', data.leads?.length || 0);
      setSourceLeads(data.leads || []);
      setSelectedSourceLeads([]);
    } catch (error: any) {
      console.error('💥 Error loading leads:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los leads.",
        variant: "destructive"
      });
      // Reset state on error
      setSourceLeads([]);
      setSelectedSourceLeads([]);
    } finally {
      setLoadingLeads(false);
    }
  }, [user, currentOrganization, toast]);

  const transferToFlow = useCallback(async () => {
    if (!user || !currentOrganization || selectedSourceLeads.length === 0) return;

    setTransferring(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/transfer-to-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          leadIds: selectedSourceLeads,
          sourceType: activeTab
        })
      });

      if (!response.ok) throw new Error('Error transferring leads');

      const data = await response.json();
      
      toast({
        title: "Transferencia completada",
        description: `${data.transferred} leads transferidos al flujo.`
      });

      await loadStats();
      await loadSourceLeads(activeTab as DataSource);
      setSelectedSourceLeads([]);

    } catch (error: any) {
      console.error('Error transferring leads:', error);
      toast({
        title: "Error en transferencia",
        description: error.message || "No se pudo completar la transferencia.",
        variant: "destructive"
      });
    } finally {
      setTransferring(false);
    }
  }, [user, currentOrganization, selectedSourceLeads, activeTab, toast, loadStats, loadSourceLeads]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'search' | DataSource);
    if (value !== 'search') {
      loadSourceLeads(value as DataSource);
    }
  };

  const handleLeadSelection = (leadId: string, checked: boolean) => {
    setSelectedSourceLeads(prev => 
      checked 
        ? [...prev, leadId]
        : prev.filter(id => id !== leadId)
    );
  };

  const handleDuplicatesResolved = (remainingLeads: UnifiedLead[]) => {
    setSourceLeads(remainingLeads);
    setSelectedSourceLeads([]);
  };

  const handleReloadData = () => {
    if (activeTab !== 'search') {
      loadSourceLeads(activeTab as DataSource);
    }
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (authLoading || orgLoading || !initialLoadDone) {
    return <LoadingComponent message="Cargando fuente de leads..." />;
  }

  if (!user && initialLoadDone) {
    return <LoadingComponent message="Redirigiendo al inicio de sesión..." size="small" />;
  }
  
  if (!user || !currentOrganization) {
     return <LoadingComponent message="Cargando organización..." />;
  }

  const currentStats = stats.find(s => s.source === activeTab);
  const availableLeads = sourceLeads.filter(lead => !lead.transferredToFlow);
  const transferredLeads = sourceLeads.filter(lead => lead.transferredToFlow);
  const allSelected = availableLeads.length > 0 && selectedSourceLeads.length === availableLeads.length;
  const someSelected = selectedSourceLeads.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Obtener Leads</h1>
          <p className="text-muted-foreground">
            Busca negocios potenciales y gestiona leads de diferentes fuentes
          </p>
        </div>
        <Button onClick={loadStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Overview */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const config = DATA_SOURCE_CONFIG[stat.source];
            const transferPercentage = stat.total > 0 ? Math.round((stat.transferred / stat.total) * 100) : 0;
            
            return (
              <Card key={stat.source} className={`cursor-pointer transition-all duration-200 ${
                activeTab === stat.source ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
              }`} onClick={() => handleTabChange(stat.source)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <CardTitle className="text-sm">{config.name}</CardTitle>
                    </div>
                    <Badge variant={stat.isActive ? "default" : "secondary"} className="text-xs">
                      {stat.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold text-lg">{stat.total}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pendientes</p>
                      <p className="font-semibold text-lg text-orange-600">{stat.pending}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Transferidos</span>
                      <span>{stat.transferred}/{stat.total}</span>
                    </div>
                    <Progress value={transferPercentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Google Places
          </TabsTrigger>
          {stats.map((stat) => {
            const config = DATA_SOURCE_CONFIG[stat.source];
            return (
              <TabsTrigger key={stat.source} value={stat.source} className="flex items-center gap-2">
                <span className="text-sm">{config.icon}</span>
                {config.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Form */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Criterios de Búsqueda
                  </CardTitle>
                  <CardDescription>
                    Busca negocios potenciales usando Google Places API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SearchForm
                    country={country}
                    place={place}
                    businessTypeInput={businessTypeInput}
                    keywords={keywords}
                    loading={searchLoading}
                    onCountryChange={setCountry}
                    onPlaceChange={setPlace}
                    onBusinessTypeChange={setBusinessTypeInput}
                    onKeywordsChange={setKeywords}
                    onSubmit={handleSearch}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Search Results */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <SearchResults
                    searchResults={searchResults}
                    selectedLeads={selectedLeads}
                    hasSearched={hasSearched}
                    searchLoading={searchLoading}
                    saveLoading={saveLoading}
                    onToggleLead={handleCheckboxChange}
                    onShowDetails={handleShowDetails}
                    onAddToLeads={handleAddToLeads}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Data Source Tabs */}
        {stats.map((stat) => {
          const config = DATA_SOURCE_CONFIG[stat.source];
          return (
            <TabsContent key={stat.source} value={stat.source} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        {config.name}
                      </CardTitle>
                      <CardDescription>
                        {config.description}
                      </CardDescription>
                    </div>
                    
                    {someSelected && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {selectedSourceLeads.length} seleccionados
                        </Badge>
                        <Button 
                          onClick={transferToFlow}
                          disabled={transferring}
                          className="bg-primary"
                        >
                          {transferring ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Transfiriendo...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Transferir al Flujo
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {loadingLeads ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableLeads.length > 0 && (
                        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const availableIds = availableLeads.map(lead => lead.id);
                                setSelectedSourceLeads(availableIds);
                              } else {
                                setSelectedSourceLeads([]);
                              }
                            }}
                            id="select-all"
                          />
                          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Seleccionar todos los disponibles ({availableLeads.length})
                          </label>
                        </div>
                      )}

                      <div className="space-y-3">
                        {sourceLeads.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No hay leads en esta fuente de datos</p>
                          </div>
                        ) : (
                          <>
                            {availableLeads.length > 0 && (
                              <div>
                                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Disponibles para transferir ({availableLeads.length})
                                </h3>
                                <div className="space-y-2">
                                  {availableLeads.map((lead) => (
                                    <LeadCard 
                                      key={lead.id} 
                                      lead={lead} 
                                      isSelected={selectedSourceLeads.includes(lead.id)}
                                      onSelect={handleLeadSelection}
                                      showCheckbox={true}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {transferredLeads.length > 0 && (
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2 text-base">
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                  Ya transferidos ({transferredLeads.length})
                                </h3>
                                <div className="space-y-2">
                                  {transferredLeads.map((lead) => (
                                    <LeadCard 
                                      key={lead.id} 
                                      lead={lead} 
                                      isSelected={false}
                                      onSelect={() => {}}
                                      showCheckbox={false}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <DuplicateDetector 
                leads={sourceLeads}
                onDuplicatesResolved={handleDuplicatesResolved}
                onReloadData={handleReloadData}
              />
            </TabsContent>
          );
        })}
      </Tabs>

      <BusinessDetailsModal
        business={selectedBusinessDetail as BusinessDetail | null}
        open={isDetailsModalOpen}
        loading={modalDetailsLoading}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
  );
};

// Lead card component
interface LeadCardProps {
  lead: UnifiedLead;
  isSelected: boolean;
  onSelect: (leadId: string, checked: boolean) => void;
  showCheckbox: boolean;
}

function LeadCard({ lead, isSelected, onSelect, showCheckbox }: LeadCardProps) {
  const config = DATA_SOURCE_CONFIG[lead.source];
  
  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg transition-all duration-200 ${
      lead.transferredToFlow 
        ? 'bg-green-900/20 border-green-600' 
        : isSelected 
          ? 'bg-primary/5 border-primary' 
          : 'bg-background border-border hover:border-border/60'
    }`}>
      {showCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(lead.id, !!checked)}
          className="mt-1"
        />
      )}
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <h4 className={`font-semibold text-base ${
            lead.transferredToFlow ? 'text-gray-200' : 'text-foreground'
          }`}>{lead.name}</h4>
          <Badge variant="outline" className={`${config.color} text-xs`}>
            {config.name}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            lead.transferredToFlow 
              ? 'text-gray-400 bg-gray-800' 
              : 'text-muted-foreground bg-muted'
          }`}>
            ID: {lead.id}
          </span>
          {lead.createdAt && (
            <span className={`text-xs ${
              lead.transferredToFlow ? 'text-gray-400' : 'text-muted-foreground'
            }`}>
              Creado: {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {lead.email && (
            <div className="flex items-center gap-1">
              <span className={lead.transferredToFlow ? "text-gray-400" : "text-muted-foreground"}>📧</span>
              <span className={`truncate ${lead.transferredToFlow ? "text-gray-300" : "text-foreground"}`}>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1">
              <span className={lead.transferredToFlow ? "text-gray-400" : "text-muted-foreground"}>📱</span>
              <span className={lead.transferredToFlow ? "text-gray-300" : "text-foreground"}>{lead.phone}</span>
            </div>
          )}
          {lead.company && (
            <div className="flex items-center gap-1">
              <span className={lead.transferredToFlow ? "text-gray-400" : "text-muted-foreground"}>🏢</span>
              <span className={`truncate ${lead.transferredToFlow ? "text-gray-300" : "text-foreground"}`}>{lead.company}</span>
            </div>
          )}
          {lead.stage && (
            <div className="flex items-center gap-1">
              <span className={lead.transferredToFlow ? "text-gray-400" : "text-muted-foreground"}>📊</span>
              <Badge variant="secondary" className={`text-xs ${
                lead.transferredToFlow ? "bg-gray-700 text-gray-300 border-gray-600" : ""
              }`}>
                {lead.stage}
              </Badge>
            </div>
          )}
        </div>
        
        {lead.source === 'meta-ads' && lead.metadata && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${
            lead.transferredToFlow ? "text-gray-400" : "text-muted-foreground"
          }`}>
            {lead.metadata.campaignName && (
              <div className="flex items-center gap-1">
                <span>📢</span>
                <span className="truncate">Campaña: {lead.metadata.campaignName}</span>
              </div>
            )}
            {lead.metadata.adSetName && (
              <div className="flex items-center gap-1">
                <span>🎯</span>
                <span className="truncate">AdSet: {lead.metadata.adSetName}</span>
              </div>
            )}
            {lead.metadata.formId && (
              <div className="flex items-center gap-1">
                <span>📝</span>
                <span className="truncate">Form ID: {lead.metadata.formId}</span>
              </div>
            )}
            {lead.value && (
              <div className="flex items-center gap-1">
                <span>💰</span>
                <span>Valor: ${lead.value}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {lead.transferredToFlow && (
        <div className="flex items-center gap-1 text-green-400 mt-1">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Transferido</span>
        </div>
      )}
    </div>
  );
}

export default LeadSourcesPage;