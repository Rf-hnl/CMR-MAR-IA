"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingComponent from '@/components/LoadingComponent';
import { LogOut, PlusCircle, ArrowLeft, KanbanSquare, List, FileUp, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc, query, where, orderBy, serverTimestamp, Timestamp as FirestoreTimestamp, writeBatch, addDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

import type { ExtendedLead as Lead, LeadImage, Product as ProductDefinition } from '@/types';
import { type WelcomeMessageInput, type WelcomeMessageOutput } from '@/ai/flows/welcomeMessageFlow';
import { type EvaluateBusinessInput, type EvaluateBusinessOutput } from '@/ai/flows/evaluateBusinessFlow';
import { type SalesRecommendationsInput, type SalesRecommendationsOutput, type Product as AIProduct } from '@/ai/flows/salesRecommendationsFlow';
import { formatXmlLeads, type FormatXmlLeadsInput, type FormatXmlLeadsOutput, type FormattedLead as XmlFormattedLead } from '@/ai/flows/formatXmlLeadsFlow';
import { formatCsvLeads, type FormatCsvLeadsInput, type FormatCsvLeadsOutput, type FormattedLead as CsvFormattedLead } from '@/ai/flows/formatCsvLeadsFlow';

// Import all the extracted components
import KanbanView from '@/components/leads/KanbanView';
import TableView from '@/components/leads/TableView';
import LeadDetailsDialog from '@/components/leads/LeadDetailsDialog';
import LeadImportDialog from '@/components/leads/LeadImportDialog';
import LeadFilters from '@/components/leads/LeadFilters';
import LeadStats from '@/components/leads/LeadStats';
import { LeadInsights } from '@/components/leads/LeadInsights';
import { InsightsSkeleton, KanbanSkeleton, TableSkeleton, StatsSkeleton, FiltersSkeleton } from '@/components/leads/LeadsSkeleton';
import LeadActionResultModal from '@/components/leads/LeadActionResultModal';
import LeadSourceFilterModal from '@/components/leads/LeadSourceFilterModal';
import QuoteGeneratorModal from '@/components/QuoteGeneratorModal';
import BillingQuoteModal from '@/components/BillingQuoteModal';
import HybridQuoteModal from '@/components/HybridQuoteModal';

// Import utilities
import { LEAD_STAGES, LOCAL_STORAGE_LEADS_KEY_PREFIX, LOCAL_FALLBACK_SOURCE, formatFirestoreTimestamp, isFieldMissing, type LeadStage } from '@/lib/leads-utils';
import { getBusinessTypeFromMetaLead } from '@/lib/lead-converter';
import { LeadSource, getLeadSourceFromString } from '@/types/formatters/lead-sources';

type ImportedFormattedLead = (XmlFormattedLead | CsvFormattedLead) & { suggestedStage?: string };
type ActionResult = WelcomeMessageOutput | EvaluateBusinessOutput | SalesRecommendationsOutput | { error: string } | null;

export default function LeadsPage() {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "insights">("kanban");

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentActionLead, setCurrentActionLead] = useState<Lead | null>(null);
  const [actionResult, setActionResult] = useState<ActionResult>(null);
  const [isActionResultModalOpen, setIsActionResultModalOpen] = useState(false);
  const [currentActionType, setCurrentActionType] = useState<string | null>(null);

  const [userProducts, setUserProducts] = useState<AIProduct[]>([]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedFileForImport, setSelectedFileForImport] = useState<File | null>(null);
  const [importTargetStage, setImportTargetStage] = useState<LeadStage>("Nuevo");
  const [isImporting, setIsImporting] = useState(false);

  const [isLeadDetailsModalOpen, setIsLeadDetailsModalOpen] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);
  const [isSettingFeaturedImage, setIsSettingFeaturedImage] = useState<string | null>(null);

  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [selectedColumnStage, setSelectedColumnStage] = useState<LeadStage | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [isSourceFilterModalOpen, setIsSourceFilterModalOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<LeadSource[]>([]);
  
  // Quote generator modal state
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<Lead | null>(null);
  
  // Billing quote modal state
  const [isBillingQuoteModalOpen, setIsBillingQuoteModalOpen] = useState(false);
  const [selectedLeadForBillingQuote, setSelectedLeadForBillingQuote] = useState<Lead | null>(null);
  
  // Hybrid quote modal state
  const [isHybridQuoteModalOpen, setIsHybridQuoteModalOpen] = useState(false);
  const [selectedLeadForHybridQuote, setSelectedLeadForHybridQuote] = useState<Lead | null>(null);

  // Local storage key helper
  const getLocalStorageKey = useCallback(() => {
    return `${LOCAL_STORAGE_LEADS_KEY_PREFIX}${user?.uid || 'unknown'}`;
  }, [user?.uid]);

  // Fetch user products
  const fetchUserProducts = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(productsQuery);
      const products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category,
          price: data.price,
          original_price: data.original_price,
          description: data.description,
        } as AIProduct;
      });
      setUserProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [user?.uid]);

  // Load leads from leads-flow collection
  const loadLeads = useCallback(async () => {
    if (!user?.uid || !currentOrganization) return;
    
    setLoadingLeads(true);
    try {
      // Obtener el token de Firebase
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const fetchedLeads = data.leads || [];

      setLeads(fetchedLeads);
      
      if (fetchedLeads.length > 0) {
        localStorage.setItem(getLocalStorageKey(), JSON.stringify(fetchedLeads));
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      const cachedLeads = localStorage.getItem(getLocalStorageKey());
      if (cachedLeads) {
        try {
          setLeads(JSON.parse(cachedLeads));
          toast({
            title: "Usando datos en caché",
            description: "No se pudo conectar a la base de datos. Mostrando datos guardados localmente.",
          });
        } catch (parseError) {
          console.error('Error parsing cached leads:', parseError);
        }
      }
    } finally {
      setLoadingLeads(false);
    }
  }, [user?.uid, currentOrganization, getLocalStorageKey, toast]);

  // Stage change handler
  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      const leadRef = doc(db, 'leads-flow', leadId);
      const now = new Date().toISOString();
      
      // Get current lead to update stage history
      const currentLead = leads.find(lead => lead.id === leadId);
      const stageHistory = currentLead?.stageHistory || [];
      
      // Close previous stage if exists
      const updatedHistory = stageHistory.map(entry => 
        !entry.exitedAt ? { ...entry, exitedAt: now } : entry
      );
      
      // Add new stage entry
      updatedHistory.push({
        stage: newStage,
        enteredAt: now,
        triggeredBy: 'user',
        userId: user?.uid,
        notes: `Movido manualmente a ${newStage}`
      });

      await updateDoc(leadRef, {
        currentStage: newStage,
        stage: newStage, // For compatibility
        stageHistory: updatedHistory,
        updatedAt: serverTimestamp()
      });

      setLeads(prevLeads => prevLeads.map(lead => 
        lead.id === leadId 
          ? { 
              ...lead, 
              stage: newStage, 
              currentStage: newStage,
              stageHistory: updatedHistory,
              updatedAt: now 
            }
          : lead
      ));

      toast({
        title: "Etapa actualizada",
        description: `El lead ha sido movido a ${newStage}.`
      });
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la etapa del lead.",
        variant: "destructive"
      });
    }
  };

  // Lead details modal handlers
  const handleOpenLeadDetailsModal = (lead: Lead) => {
    setSelectedLeadForDetails(lead);
    setIsLeadDetailsModalOpen(true);
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const leadRef = doc(db, 'leads-flow', leadId);
      await updateDoc(leadRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      setLeads(prevLeads => prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, ...updates, updatedAt: new Date().toISOString() }
          : lead
      ));
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  };

  // AI Action handlers
  const handleGenerateWelcomeMessage = async (lead: Lead) => {
    setIsActionLoading(true);
    setCurrentActionLead(lead);
    setCurrentActionType('welcome');
    
    try {
      const input: WelcomeMessageInput & { leadId?: string; organizationId?: string; currentUser?: any } = {
        leadName: lead.fullName || lead.name,
        businessType: getBusinessTypeFromMetaLead(lead) || 'negocio',
        leadId: lead.id,
        organizationId: currentOrganization?.id,
        companyName: currentOrganization?.name || 'nuestra empresa',
        companyDescription: currentOrganization?.description || 'nos especializamos en soluciones tecnológicas para impulsar tu negocio',
        currentUser: {
          displayName: user?.displayName,
          email: user?.email
        }
      };
      
      console.log('Generating welcome message with input:', input);
      
      const response = await fetch('/api/ai/welcome-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify(input),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(`Error al parsear respuesta del servidor. Status: ${response.status}`);
      }
      
      console.log('Welcome message result:', result);
      
      if (!response.ok) {
        throw new Error(result.error || `Error del servidor (${response.status})`);
      }
      
      setActionResult(result);
      setIsActionResultModalOpen(true);
    } catch (error) {
      console.error('Error generating welcome message:', error);
      setActionResult({ error: `Error al generar el mensaje de bienvenida: ${error instanceof Error ? error.message : 'Error desconocido'}` });
      setIsActionResultModalOpen(true);
    } finally {
      setIsActionLoading(false);
      setCurrentActionLead(null);
      setCurrentActionType(null);
    }
  };

  const handleEvaluateBusiness = async (lead: Lead) => {
    setIsActionLoading(true);
    setCurrentActionLead(lead);
    setCurrentActionType('evaluate');
    
    try {
      const input: EvaluateBusinessInput = {
        leadName: lead.fullName || lead.name,
        businessType: getBusinessTypeFromMetaLead(lead) || '',
        website: lead.website || '',
        address: lead.address || '',
        // Información de nuestra empresa
        companyName: currentOrganization?.name || 'HNL-MAR-IA',
        companyDescription: currentOrganization?.description || 'Especialistas en soluciones tecnológicas para impulsar negocios',
        companyServices: `
• CRM y Gestión de Leads - Sistema avanzado de administración de clientes y seguimiento de oportunidades
• WhatsApp Business Automation - Automatización de mensajes y gestión de conversaciones
• Tracking y Analytics - Sistemas de seguimiento de interacciones y métricas de engagement  
• Inteligencia Artificial - Generación de contenido, evaluaciones de negocio y recomendaciones personalizadas
• Desarrollo Web - Sitios web profesionales y plataformas digitales
• Marketing Digital - Estrategias de presencia online y optimización de conversiones
• Sistemas TPV - Puntos de venta y gestión de transacciones
• Cotizaciones Inteligentes - Generación automática de propuestas comerciales
• Integración de APIs - Conexión entre sistemas y automatización de procesos
• Consultoría Digital - Asesoría en transformación digital y optimización de procesos
        `.trim()
      };
      
      console.log('Evaluating business with input:', input);
      
      const response = await fetch('/api/ai/evaluate-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Try to get response text for debugging
        try {
          const responseText = await response.text();
          console.error('Response text:', responseText);
        } catch (textError) {
          console.error('Failed to get response text:', textError);
        }
        
        throw new Error(`Error al parsear respuesta del servidor. Status: ${response.status}. Revisa la consola para más detalles.`);
      }
      
      console.log('Business evaluation result:', result);
      
      if (!response.ok) {
        const errorMsg = result?.error || `Error del servidor (${response.status})`;
        console.error('API returned error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      setActionResult(result);
      setIsActionResultModalOpen(true);
    } catch (error) {
      console.error('Error evaluating business:', error);
      setActionResult({ error: `Error al evaluar el negocio: ${error instanceof Error ? error.message : 'Error desconocido'}` });
      setIsActionResultModalOpen(true);
    } finally {
      setIsActionLoading(false);
      setCurrentActionLead(null);
      setCurrentActionType(null);
    }
  };

  const handleGenerateSalesRecommendations = async (lead: Lead) => {
    setIsActionLoading(true);
    setCurrentActionLead(lead);
    setCurrentActionType('recommend');
    
    try {
      const input: SalesRecommendationsInput = {
        leadName: lead.fullName || lead.name,
        businessType: getBusinessTypeFromMetaLead(lead) || '',
        userProducts: userProducts
      };
      
      console.log('Generating sales recommendations with input:', input);
      
      const response = await fetch('/api/ai/sales-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(`Error al parsear respuesta del servidor. Status: ${response.status}`);
      }
      
      console.log('Sales recommendations result:', result);
      
      if (!response.ok) {
        throw new Error(result.error || `Error del servidor (${response.status})`);
      }
      
      setActionResult(result);
      setIsActionResultModalOpen(true);
    } catch (error) {
      console.error('Error generating sales recommendations:', error);
      setActionResult({ error: `Error al generar recomendaciones de venta: ${error instanceof Error ? error.message : 'Error desconocido'}` });
      setIsActionResultModalOpen(true);
    } finally {
      setIsActionLoading(false);
      setCurrentActionLead(null);
      setCurrentActionType(null);
    }
  };

  const handleGenerateSolutionEmail = async (lead: Lead) => {
    setIsActionLoading(true);
    setCurrentActionLead(lead);
    setCurrentActionType('solution-email');
    
    try {
      const input = {
        leadName: lead.fullName || lead.name,
        businessType: getBusinessTypeFromMetaLead(lead) || '',
        configurationProposal: 'Configuración TPV personalizada',
        products: userProducts,
        benefits: ['Procesamiento seguro de pagos', 'Gestión de inventario', 'Reportes de ventas', 'Soporte técnico 24/7']
      };
      
      console.log('Generating solution email with input:', input);
      
      const response = await fetch('/api/ai/generate-solution-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(`Error al parsear respuesta del servidor. Status: ${response.status}`);
      }
      
      console.log('Solution email result:', result);
      
      if (!response.ok) {
        throw new Error(result.error || `Error del servidor (${response.status})`);
      }
      
      setActionResult(result);
      setIsActionResultModalOpen(true);
    } catch (error) {
      console.error('Error generating solution email:', error);
      setActionResult({ error: `Error al generar email de configuración: ${error instanceof Error ? error.message : 'Error desconocido'}` });
      setIsActionResultModalOpen(true);
    } finally {
      setIsActionLoading(false);
      setCurrentActionLead(null);
      setCurrentActionType(null);
    }
  };

  const handleGenerateQuote = (lead: Lead) => {
    setSelectedLeadForQuote(lead);
    setIsQuoteModalOpen(true);
  };

  const handleGenerateBillingQuote = (lead: Lead) => {
    setSelectedLeadForBillingQuote(lead);
    setIsBillingQuoteModalOpen(true);
  };

  const handleGenerateHybridQuote = (lead: Lead) => {
    setSelectedLeadForHybridQuote(lead);
    setIsHybridQuoteModalOpen(true);
  };

  // Import handlers
  const handleImportComplete = (importedLeads: Lead[]) => {
    setLeads(prevLeads => [...importedLeads, ...prevLeads]);
    setIsImportModalOpen(false);
    toast({
      title: "Importación completada",
      description: `Se importaron ${importedLeads.length} leads correctamente.`
    });
  };

  // Image handlers
  const handleUploadImages = async (leadId: string, images: LeadImage[]) => {
    try {
      const leadRef = doc(db, 'leads-flow', leadId);
      await updateDoc(leadRef, {
        images: arrayUnion(...images),
        updatedAt: serverTimestamp()
      });

      setLeads(prevLeads => prevLeads.map(lead => 
        lead.id === leadId 
          ? { 
              ...lead, 
              images: [...(lead.images || []), ...images],
              updatedAt: new Date().toISOString()
            }
          : lead
      ));
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleDeleteImage = async (leadId: string, imageId: string) => {
    // Implementation for deleting images
  };

  const handleSetFeaturedImage = async (leadId: string, imageId: string) => {
    // Implementation for setting featured image
  };

  // Filter handlers
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSource('');
    setSelectedStage('');
    setSelectedSources(availableLeadSources);
  };

  // Effects
  useEffect(() => {
    if (initialLoadDone && !authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      loadLeads();
      fetchUserProducts();
    }
  }, [user, initialLoadDone, authLoading, router, loadLeads, fetchUserProducts]);

  // Loading states
  if (!initialLoadDone || authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingComponent message="Cargando leads..." />
      </div>
    );
  }

  if (!user || !currentOrganization) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground mr-2">Redirigiendo al inicio de sesión...</p>
        <LoadingComponent message="Cargando organización..." size="small" />
      </div>
    );
  }

  if (loadingLeads) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-background border-b border-border flex-shrink-0">
          {/* Title skeleton */}
          <div className="p-4 sm:p-6 lg:p-6 border-b border-border/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="h-10 w-full sm:w-32 bg-muted animate-pulse rounded" />
                <div className="h-10 w-full sm:w-28 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>

          {/* Unified header skeleton */}
          <div className="p-4 sm:p-6 lg:p-6 space-y-4">
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4">
              <div className="grid w-full max-w-[600px] grid-cols-3 bg-muted rounded-lg p-1 xl:w-auto xl:flex-shrink-0">
                <div className="h-9 bg-muted-foreground/20 animate-pulse rounded" />
                <div className="h-9 bg-muted-foreground/20 animate-pulse rounded mx-1" />
                <div className="h-9 bg-muted-foreground/20 animate-pulse rounded" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                <div className="flex-1 max-w-md">
                  <div className="h-10 bg-muted animate-pulse rounded-lg" />
                </div>
                <div className="h-10 w-[150px] bg-muted animate-pulse rounded-lg" />
                <div className="h-10 w-[140px] bg-muted animate-pulse rounded-lg" />
              </div>
            </div>
            <StatsSkeleton />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <KanbanSkeleton />
        </div>
      </div>
    );
  }

  // Get available sources from leads
  const sources = Array.from(new Set(leads.map(lead => lead.source)));
  const availableLeadSources = Array.from(new Set(leads.map(lead => getLeadSourceFromString(lead.source))));
  
  // Initialize selected sources if empty
  if (selectedSources.length === 0 && availableLeadSources.length > 0) {
    setSelectedSources(availableLeadSources);
  }
  
  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.fullName || lead.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (!isFieldMissing(lead.email) && lead.email!.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (!isFieldMissing(lead.companyName) && lead.companyName!.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (!isFieldMissing(lead.phoneNumber) && lead.phoneNumber!.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = !selectedSource || lead.source === selectedSource;
    const matchesStage = !selectedStage || lead.stage === selectedStage;
    const matchesSelectedSources = selectedSources.length === 0 || selectedSources.includes(getLeadSourceFromString(lead.source));
    
    return matchesSearch && matchesSource && matchesStage && matchesSelectedSources;
  });

  // Action result modal handlers
  const handleActionResultModalClose = () => {
    setActionResult(null);
    setCurrentActionLead(null);
    setCurrentActionType(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "kanban" | "table" | "insights")} className="flex flex-col h-full">
        <header className="bg-background border-b border-border flex-shrink-0">
          {/* Title and Action Buttons */}
          <div className="p-4 sm:p-6 lg:p-6 border-b border-border/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Flujo de Leads</h1>
<LeadImportDialog 
  open={open} 
  onOpenChange={setOpen} 
  onImportComplete={handleImportComplete} 
  formatXmlLeads={formatXmlLeads} 
  formatCsvLeads={formatCsvLeads} 
/>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="h-10 text-sm w-full sm:w-auto" 
                  onClick={async () => {
                    try {
                      const token = await user?.getIdToken();
                      const response = await fetch(`/api/debug-leads?organizationId=${currentOrganization?.id}`, {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                      });
                      const data = await response.json();
                      console.log('🔍 Debug data:', data);
                      toast({
                        title: "Debug Info", 
                        description: `Meta: ${data.counts?.metaLeads || 0}, Flow: ${data.counts?.flowLeads || 0}, Active: ${data.counts?.activeFlowLeads || 0}`
                      });
                    } catch (error) {
                      console.error('Debug error:', error);
                      toast({title: "Error", description: "Error al obtener debug info", variant: "destructive"});
                    }
                  }}
                >
                  🔍 Debug
                </Button>
                <Button 
                  variant="outline" 
                  className="h-10 text-sm w-full sm:w-auto" 
                  onClick={() => {
                    // Limpiar caché local
                    localStorage.removeItem(getLocalStorageKey());
                    // Recargar leads
                    loadLeads();
                    toast({title: "Recargando", description: "Forzando recarga de leads desde la base de datos"});
                  }}
                >
                  🔄 Recargar
                </Button>
                <Button 
                  variant="default" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 text-sm w-full sm:w-auto" 
                  onClick={() => router.push('/leads/create')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Lead
                </Button>
                <Button 
                  variant="outline" 
                  className="border-primary/20 text-primary hover:bg-primary/10 h-10 text-sm w-full sm:w-auto" 
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <FileUp className="mr-2 h-4 w-4" /> Importar
                </Button>
              </div>
            </div>
          </div>

          {/* Unified Header with Tabs, Search and Stats */}
          <div className="p-4 sm:p-6 lg:p-6 space-y-4">
            {/* Tabs, Search and Filters in one unified line */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4">
              {/* Tabs */}
              <TabsList className="grid w-full max-w-[600px] grid-cols-3 bg-muted xl:w-auto xl:flex-shrink-0">
                <TabsTrigger value="insights" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                  📊 Resumen
                </TabsTrigger>
                <TabsTrigger value="kanban" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <KanbanSquare className="h-4 w-4 mr-2" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="table" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <List className="h-4 w-4 mr-2" />
                  Tabla
                </TabsTrigger>
              </TabsList>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                {/* Search Bar */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar por nombre, empresa, email o teléfono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                {viewMode !== 'insights' && (
                  <>
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="px-3 py-2.5 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[150px]"
                    >
                      <option value="">Todas las fuentes</option>
                      {sources.map(source => (
                        <option key={source} value={source}>
                          {source.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="px-3 py-2.5 text-sm border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[140px]"
                    >
                      <option value="">Todas las etapas</option>
                      {LEAD_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSourceFilterModalOpen(true)}
                      className="text-muted-foreground hover:text-foreground px-3 whitespace-nowrap"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Fuentes ({selectedSources.length})
                    </Button>

                    {(searchTerm || selectedSource || selectedStage || selectedSources.length !== availableLeadSources.length) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                        className="text-muted-foreground hover:text-foreground px-3 whitespace-nowrap"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            {viewMode !== 'insights' && <LeadStats leads={leads} />}
          </div>
        </header>

        <TabsContent value="insights" className="flex-1 overflow-auto p-4">
          {loadingLeads ? <InsightsSkeleton /> : <LeadInsights leads={leads} />}
        </TabsContent>

        <TabsContent value="kanban" className="flex-1 overflow-hidden">
          {loadingLeads ? (
            <div className="p-4">
              <KanbanSkeleton />
            </div>
          ) : (
            <KanbanView
              leads={filteredLeads}
              onStageChange={handleStageChange}
              onOpenLeadDetails={handleOpenLeadDetailsModal}
              onGenerateWelcomeMessage={handleGenerateWelcomeMessage}
              onEvaluateBusiness={handleEvaluateBusiness}
              onGenerateSalesRecommendations={handleGenerateSalesRecommendations}
              onGenerateSolutionEmail={handleGenerateSolutionEmail}
              onGenerateQuote={handleGenerateQuote}
              onGenerateBillingQuote={handleGenerateBillingQuote}
              onGenerateHybridQuote={handleGenerateHybridQuote}
              currentActionLead={currentActionLead}
              isActionLoading={isActionLoading}
              currentActionType={currentActionType}
              selectedLeadForDetails={selectedLeadForDetails}
            />
          )}
        </TabsContent>

        <TabsContent value="table" className="flex-1 overflow-hidden p-4">
          {loadingLeads ? <TableSkeleton /> : (
            <TableView
              leads={filteredLeads}
              onStageChange={handleStageChange}
              onOpenLeadDetails={handleOpenLeadDetailsModal}
              onGenerateWelcomeMessage={handleGenerateWelcomeMessage}
              onEvaluateBusiness={handleEvaluateBusiness}
              onGenerateSalesRecommendations={handleGenerateSalesRecommendations}
              onGenerateSolutionEmail={handleGenerateSolutionEmail}
              onGenerateQuote={handleGenerateQuote}
              onGenerateBillingQuote={handleGenerateBillingQuote}
              onGenerateHybridQuote={handleGenerateHybridQuote}
              currentActionLead={currentActionLead}
              isActionLoading={isActionLoading}
              currentActionType={currentActionType}
            />
          )}
        </TabsContent>

      </Tabs>

      <LeadDetailsDialog
        lead={selectedLeadForDetails}
        open={isLeadDetailsModalOpen}
        onOpenChange={setIsLeadDetailsModalOpen}
        onUpdate={handleUpdateLead}
        onUploadImages={handleUploadImages}
        onDeleteImage={handleDeleteImage}
        onSetFeaturedImage={handleSetFeaturedImage}
        isUploadingImages={false}
        isDeletingImage={isDeletingImage}
        isSettingFeaturedImage={isSettingFeaturedImage}
      />

      <LeadImportDialog
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={handleImportComplete}
        formatXmlLeads={formatXmlLeads}
        formatCsvLeads={formatCsvLeads}
      />

      <LeadActionResultModal
        open={isActionResultModalOpen}
        onOpenChange={setIsActionResultModalOpen}
        actionResult={actionResult}
        currentActionType={currentActionType}
        onClose={handleActionResultModalClose}
        isActionLoading={isActionLoading}
        currentLead={currentActionLead ? {
          id: currentActionLead.id,
          name: currentActionLead.fullName || currentActionLead.name,
          phone: currentActionLead.phoneNumber || currentActionLead.phone,
          businessType: getBusinessTypeFromMetaLead(currentActionLead)
        } : null}
        onLeadUpdate={loadLeads}
      />

      <LeadSourceFilterModal
        open={isSourceFilterModalOpen}
        onOpenChange={setIsSourceFilterModalOpen}
        selectedSources={selectedSources}
        onSourcesChange={setSelectedSources}
        availableSources={availableLeadSources}
      />

      <QuoteGeneratorModal
        open={isQuoteModalOpen}
        onOpenChange={setIsQuoteModalOpen}
        currentLead={selectedLeadForQuote ? {
          name: selectedLeadForQuote.fullName || selectedLeadForQuote.name,
          phone: selectedLeadForQuote.phoneNumber || selectedLeadForQuote.phone,
          businessType: getBusinessTypeFromMetaLead(selectedLeadForQuote)
        } : null}
      />

      <BillingQuoteModal
        open={isBillingQuoteModalOpen}
        onOpenChange={setIsBillingQuoteModalOpen}
        currentLead={selectedLeadForBillingQuote ? {
          name: selectedLeadForBillingQuote.fullName || selectedLeadForBillingQuote.name,
          email: selectedLeadForBillingQuote.email,
          businessType: getBusinessTypeFromMetaLead(selectedLeadForBillingQuote)
        } : null}
      />

      <HybridQuoteModal
        open={isHybridQuoteModalOpen}
        onOpenChange={setIsHybridQuoteModalOpen}
        currentLead={selectedLeadForHybridQuote ? {
          name: selectedLeadForHybridQuote.fullName || selectedLeadForHybridQuote.name,
          email: selectedLeadForHybridQuote.email,
          businessType: getBusinessTypeFromMetaLead(selectedLeadForHybridQuote)
        } : null}
      />
    </div>
  );
}
