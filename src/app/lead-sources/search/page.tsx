"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LoadingComponent from '@/components/LoadingComponent';
import { Search, LineChart, Users, Target, Clock, TrendingUp, ChevronLeft, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp as FirestoreTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

import { BusinessDetailsModal } from "@/components/BusinessDetailsModal";
import SearchForm from '@/components/SearchForm';
import SearchResults from '@/components/SearchResults';

// Define BusinessDetail if it's not imported from BusinessDetailsModal
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

// Define Business if it's different from BusinessDetail or also needed
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

const LOCAL_STORAGE_LEADS_KEY_PREFIX = 'leadsia_leads_';
const LOCAL_FALLBACK_SOURCE = 'google_places_search_local_fallback';

export default function LeadSourcesSearchPage() {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();

  const [country, setCountry] = useState('');
  const [place, setPlace] = useState('');
  const [businessTypeInput, setBusinessTypeInput] = useState('');
  const [keywords, setKeywords] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedBusinessDetail, setSelectedBusinessDetail] = useState<Business | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalDetailsLoading, setModalDetailsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchPanelMinimized, setIsSearchPanelMinimized] = useState(false);

  useEffect(() => {
    if (initialLoadDone && !user) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, router]);

  // Auto-minimize search panel when results are displayed
  useEffect(() => {
    if (searchResults.length > 0 && hasSearched) {
      setIsSearchPanelMinimized(true);
    }
  }, [searchResults, hasSearched]);

  const getLocalStorageKey = useCallback(() => {
    return user ? `${LOCAL_STORAGE_LEADS_KEY_PREFIX}${user.uid}` : null;
  }, [user]);

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
      if (businessTypeInput) queryParams.append('type', businessTypeInput);
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
    
    // Prepare leads data for the new API
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

  if (authLoading || orgLoading || !initialLoadDone) {
    return <LoadingComponent message="Cargando fuente de leads..." />;
  }

  if (!user && initialLoadDone) {
    return <LoadingComponent message="Redirigiendo al inicio de sesión..." size="small" />;
  }
  
  if (!user || !currentOrganization) {
     return <LoadingComponent message="Cargando organización..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-background border-b border-border flex-shrink-0">
        {/* Title and Action Buttons */}
        <div className="p-4 sm:p-6 lg:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Búsqueda de Leads</h1>
              <p className="text-muted-foreground mt-1">
                Busca y agrega nuevos leads de negocios potenciales
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-6 p-4 sm:p-6 lg:p-6 h-full">
          {/* Search Form */}
          <div className={`transition-all duration-300 flex-shrink-0 ${
            isSearchPanelMinimized ? 'w-16' : 'w-full lg:w-1/3'
          }`}>
            <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
              {/* Header with toggle button */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold text-foreground flex items-center transition-all duration-300 ${
                    isSearchPanelMinimized ? 'text-sm' : 'text-lg'
                  }`}>
                    <Search className={`text-muted-foreground transition-all duration-300 ${
                      isSearchPanelMinimized ? 'h-4 w-4' : 'h-5 w-5 mr-2'
                    }`} />
                    {!isSearchPanelMinimized && 'Criterios de Búsqueda'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchPanelMinimized(!isSearchPanelMinimized)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    {isSearchPanelMinimized ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {!isSearchPanelMinimized && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Busca negocios potenciales usando Google Places API
                  </p>
                )}
              </div>
              
              {/* Collapsible form content */}
              <div className={`transition-all duration-300 overflow-hidden ${
                isSearchPanelMinimized ? 'max-h-0' : 'max-h-[800px]'
              }`}>
                <div className="p-4">
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
                </div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border rounded-lg p-4 h-full">
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
            </div>
          </div>
        </div>
      </div>

      <BusinessDetailsModal
        business={selectedBusinessDetail as BusinessDetail | null}
        open={isDetailsModalOpen}
        loading={modalDetailsLoading}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
  );
}