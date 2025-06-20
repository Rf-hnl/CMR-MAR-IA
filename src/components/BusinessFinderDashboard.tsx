"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LoadingComponent from '@/components/LoadingComponent';
import { Search, LineChart, Users, Target, Clock, TrendingUp, Upload, Database, ArrowRight, FileText } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ContextualTooltip } from '@/components/ui/contextual-tooltip';
import { EmptyState } from '@/components/ui/empty-state';
import { collection, query, where, getDocs, orderBy, Timestamp as FirestoreTimestamp } from 'firebase/firestore';

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

export default function BusinessFinderDashboard() {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();

  const [leadsStats, setLeadsStats] = useState({
    total: 0,
    byStage: {} as Record<string, number>,
    conversionRate: 0,
    recentLeads: [] as LeadClient[]
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (initialLoadDone && !user) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, router]);

  const fetchLeadsStats = useCallback(async () => {
    if (!user || !currentOrganization) return;
    
    setStatsLoading(true);
    try {
      // Query meta-lead-ads collection
      let leadsQuery = query(
        collection(db, 'meta-lead-ads'),
        where('organizationId', '==', currentOrganization.id),
        orderBy('updatedAt', 'desc')
      );
      
      let snapshot = await getDocs(leadsQuery);
      
      // If no results, try old leads collection for backward compatibility
      if (snapshot.size === 0) {
        leadsQuery = query(
          collection(db, 'leads'),
          where('organizationId', '==', currentOrganization.id),
          orderBy('updatedAt', 'desc')
        );
        snapshot = await getDocs(leadsQuery);
      }
      
      if (snapshot.size > 0) {
        const leads = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          } as LeadClient;
        });
        
        // Calculate statistics
        const total = leads.length;
        const byStage = leads.reduce((acc: Record<string, number>, lead: LeadClient) => {
          acc[lead.stage] = (acc[lead.stage] || 0) + 1;
          return acc;
        }, {});
        
        const wonLeads = byStage['Ganado'] || 0;
        const conversionRate = total > 0 ? (wonLeads / total) * 100 : 0;
        
        // Get recent leads (last 5)
        const recentLeads = leads.slice(0, 5);
        
        setLeadsStats({
          total,
          byStage,
          conversionRate: Math.round(conversionRate * 10) / 10,
          recentLeads
        });
      }
    } catch (error) {
      console.error('Error fetching leads stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [user, currentOrganization]);

  useEffect(() => {
    fetchLeadsStats();
  }, [fetchLeadsStats]);

  if (authLoading || orgLoading || !initialLoadDone) {
    return <LoadingComponent message="Cargando dashboard..." />;
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard Principal</h1>
              <p className="text-muted-foreground mt-1">
                Resumen general de tu actividad de leads
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="h-10 text-sm w-full sm:w-auto" 
                onClick={() => fetchLeadsStats()}
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Actualizar Stats
              </Button>
              <Button 
                variant="default" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 text-sm w-full sm:w-auto" 
                onClick={() => router.push('/lead-sources/search')}
              >
                <Search className="mr-2 h-4 w-4" /> Buscar Leads
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-row items-center justify-between pb-3">
              <ContextualTooltip 
                content="Número total de leads registrados en tu sistema desde todas las fuentes (CSV, Google Places, Meta Ads, etc.)"
                showIcon={true}
                iconType="info"
              >
                <h3 className="text-sm font-medium text-muted-foreground">Total Leads</h3>
              </ContextualTooltip>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? '--' : leadsStats.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsLoading ? 'Cargando...' : 'Total de leads registrados'}
              </p>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-row items-center justify-between pb-3">
              <ContextualTooltip 
                content="Distribución de tus leads según su etapa en el pipeline: Nuevo, Contactado, Calificado, Propuesta Enviada, etc."
                showIcon={true}
                iconType="info"
              >
                <h3 className="text-sm font-medium text-muted-foreground">Leads por Etapa</h3>
              </ContextualTooltip>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {statsLoading ? (
                <div className="text-2xl font-bold text-foreground">--</div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(leadsStats.byStage).slice(0, 3).map(([stage, count]) => (
                    <div key={stage} className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{stage}</span>
                      <span className="text-sm font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {statsLoading ? 'Cargando...' : 'Distribución por etapa'}
              </p>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-row items-center justify-between pb-3">
              <ContextualTooltip 
                content="Porcentaje de leads que han llegado a la etapa 'Ganado'. Es tu métrica clave de éxito en ventas."
                showIcon={true}
                iconType="info"
              >
                <h3 className="text-sm font-medium text-muted-foreground">Tasa de Conversión</h3>
              </ContextualTooltip>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? '--' : `${leadsStats.conversionRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsLoading ? 'Cargando...' : 'Leads ganados vs total'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <ArrowRight className="mr-2 h-5 w-5 text-muted-foreground" />
              Acciones Rápidas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Accede rápidamente a las funciones más utilizadas del flujo de leads
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ContextualTooltip 
              content="Importa leads masivamente desde un archivo CSV. Formato requerido: nombre, email, teléfono, dirección."
              side="top"
            >
              <Button 
                variant="outline" 
                className="h-auto p-4 border-blue-500/20 text-blue-600 hover:bg-blue-500/10 flex-col gap-2 w-full"
                onClick={() => {
                  router.push('/lead-sources');
                  // Try to activate CSV import tab if possible
                  setTimeout(() => {
                    const csvTab = document.querySelector('[value="file-import"]') as HTMLElement;
                    if (csvTab) csvTab.click();
                  }, 100);
                }}
              >
                <Upload className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Importar Leads desde CSV</div>
                  <div className="text-xs text-muted-foreground">Sube un archivo CSV con tus leads</div>
                </div>
              </Button>
            </ContextualTooltip>
            
            <ContextualTooltip 
              content="Busca negocios potenciales en Google Places usando palabras clave y ubicación. Perfecto para prospección local."
              side="top"
            >
              <Button 
                variant="outline" 
                className="h-auto p-4 border-green-500/20 text-green-600 hover:bg-green-500/10 flex-col gap-2 w-full"
                onClick={() => {
                  router.push('/lead-sources');
                  // Try to activate google places tab if possible  
                  setTimeout(() => {
                    const placesTab = document.querySelector('[value="google-places"]') as HTMLElement;
                    if (placesTab) placesTab.click();
                  }, 100);
                }}
              >
                <Search className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Buscar Negocios</div>
                  <div className="text-xs text-muted-foreground">Encuentra nuevos prospectos en Google Places</div>
                </div>
              </Button>
            </ContextualTooltip>
            
            <ContextualTooltip 
              content="Accede a tu pipeline principal donde gestionas el flujo de ventas, actualizas etapas y haces seguimiento."
              side="top"
            >
              <Button 
                variant="outline" 
                className="h-auto p-4 border-purple-500/20 text-purple-600 hover:bg-purple-500/10 flex-col gap-2 w-full"
                onClick={() => router.push('/leads')}
              >
                <FileText className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Ir a mi Flujo de Ventas</div>
                  <div className="text-xs text-muted-foreground">Gestiona tu pipeline de ventas</div>
                </div>
              </Button>
            </ContextualTooltip>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
              Actividad Reciente
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/leads')}
              className="text-primary border-primary/20 hover:bg-primary/10"
            >
              Ver Todos los Leads
            </Button>
          </div>
          {statsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : leadsStats.recentLeads.length > 0 ? (
            <div className="space-y-3">
              {leadsStats.recentLeads.map((lead) => (
                <div key={lead.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <h3 className="font-medium text-foreground">{lead.name}</h3>
                    <p className="text-sm text-muted-foreground">{lead.address || 'Sin dirección'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lead.stage === 'Ganado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      lead.stage === 'Perdido' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                      lead.stage === 'Negociación' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {lead.stage}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {typeof lead.createdAt === 'string' 
                        ? new Date(lead.createdAt).toLocaleDateString('es-ES') 
                        : 'Fecha no disponible'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No hay leads recientes"
              description="¡Comienza buscando nuevos leads para ver tu actividad aquí!"
              action={{
                label: "Buscar Leads",
                onClick: () => router.push('/lead-sources')
              }}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}