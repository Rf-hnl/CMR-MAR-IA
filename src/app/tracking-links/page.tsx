"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ExternalLink, 
  Eye, 
  Copy, 
  TrendingUp, 
  Calendar,
  Link2,
  MousePointer,
  Users,
  BarChart3,
  Plus,
  Search,
  Filter,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Activity
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';

// Colores optimizados para fondo oscuro con efectos neon
const CHART_COLORS = {
  primary: '#60A5FA',     // blue-400 (más brillante)
  secondary: '#34D399',   // emerald-400 (más brillante)
  accent: '#FBBF24',      // amber-400 (más brillante)
  danger: '#F87171',      // red-400 (más brillante)
  success: '#4ADE80',     // green-400 (más brillante)
  warning: '#FB923C',     // orange-400 (más brillante)
  purple: '#A78BFA',      // violet-400 (más brillante)
  pink: '#F472B6',        // pink-400 (más brillante)
  indigo: '#818CF8',      // indigo-400 (más brillante)
  teal: '#2DD4BF',        // teal-400 (más brillante)
  cyan: '#22D3EE',        // cyan-400
  lime: '#A3E635',        // lime-400
  rose: '#FB7185',        // rose-400
  sky: '#38BDF8'          // sky-400
};

const PIE_COLORS = [
  '#60A5FA', '#34D399', '#FBBF24', '#F87171', 
  '#A78BFA', '#F472B6', '#22D3EE', '#A3E635',
  '#FB923C', '#818CF8', '#2DD4BF', '#FB7185'
];

const GRADIENT_COLORS = {
  blue: 'from-blue-500/20 via-blue-400/30 to-cyan-400/20',
  green: 'from-emerald-500/20 via-green-400/30 to-teal-400/20',
  purple: 'from-purple-500/20 via-violet-400/30 to-pink-400/20',
  amber: 'from-amber-500/20 via-yellow-400/30 to-orange-400/20',
  rose: 'from-rose-500/20 via-pink-400/30 to-red-400/20'
};

// Función para formatear tooltips optimizada para fondo oscuro
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm p-4 border border-gray-700/50 rounded-xl shadow-2xl">
        <p className="font-semibold text-gray-100 mb-2 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-sm text-gray-200">
              <span className="font-medium">{entry.name}:</span> 
              <span className="text-white font-semibold ml-1">{entry.value}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface TrackingLink {
  id: string;
  leadId: string;
  type: 'catalogo' | 'landing' | 'producto' | 'servicio';
  title: string;
  destinationUrl: string;
  trackingUrl: string;
  campaignName: string;
  clickCount: number;
  lastClickAt: string | null;
  createdAt: string;
  isActive: boolean;
  metadata: {
    source?: string;
    leadName?: string;
    businessType?: string;
  };
}

interface TrackingStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  inactiveLinks: number;
  linksWithClicks: number;
  linksWithoutClicks: number;
  averageClicksPerLink: number;
  totalLinksCreatedThisWeek: number;
  totalLinksCreatedThisMonth: number;
  topPerformer: {
    title: string;
    clicks: number;
  } | null;
  performanceByType: {
    [key: string]: {
      total: number;
      clicks: number;
      avgClicks: number;
    };
  };
  performanceByCampaign: {
    [key: string]: {
      total: number;
      clicks: number;
      avgClicks: number;
    };
  };
}

interface ClickAnalytics {
  id: string;
  trackingId: string;
  leadId: string;
  timestamp: any;
  clickData: {
    userAgent: string;
    referrer: string;
    screenResolution: string;
    language: string;
    ipAddress: string;
    country?: string;
  };
}

interface TrackingAnalytics {
  linkDetails: {
    id: string;
    title: string;
    type: string;
    destinationUrl: string;
    clickCount: number;
    createdAt: any;
    lastClickAt: any;
  };
  clicks: ClickAnalytics[];
  analytics: {
    clicksByHour: { [hour: string]: number };
    clicksByDay: { [day: string]: number };
    deviceTypes: { [device: string]: number };
    browsers: { [browser: string]: number };
    countries: { [country: string]: number };
    referrers: { [referrer: string]: number };
  };
}

export default function TrackingLinksPage() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<TrackingLink[]>([]);
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [selectedLinkAnalytics, setSelectedLinkAnalytics] = useState<TrackingAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch tracking links
  useEffect(() => {
    const fetchTrackingLinks = async () => {
      if (!user || !currentOrganization) return;
      
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/tracking-links-simple?organizationId=${currentOrganization.id}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTrackingLinks(data.trackingLinks || []);
          
          // Calcular estadísticas avanzadas
          const links = data.trackingLinks || [];
          const totalClicks = links.reduce((sum: number, link: TrackingLink) => sum + link.clickCount, 0);
          const activeLinks = links.filter((link: TrackingLink) => link.isActive).length;
          const inactiveLinks = links.filter((link: TrackingLink) => !link.isActive).length;
          const linksWithClicks = links.filter((link: TrackingLink) => link.clickCount > 0).length;
          const linksWithoutClicks = links.filter((link: TrackingLink) => link.clickCount === 0).length;
          const averageClicksPerLink = links.length > 0 ? Math.round((totalClicks / links.length) * 100) / 100 : 0;

          // Calcular links creados esta semana y este mes
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          const totalLinksCreatedThisWeek = links.filter((link: TrackingLink) => 
            new Date(link.createdAt) >= weekAgo
          ).length;
          
          const totalLinksCreatedThisMonth = links.filter((link: TrackingLink) => 
            new Date(link.createdAt) >= monthAgo
          ).length;

          const topPerformer = links.length > 0 
            ? links.reduce((top: TrackingLink, current: TrackingLink) => 
                current.clickCount > top.clickCount ? current : top
              )
            : null;

          // Performance por tipo
          const performanceByType: { [key: string]: { total: number; clicks: number; avgClicks: number } } = {};
          links.forEach((link: TrackingLink) => {
            if (!performanceByType[link.type]) {
              performanceByType[link.type] = { total: 0, clicks: 0, avgClicks: 0 };
            }
            performanceByType[link.type].total += 1;
            performanceByType[link.type].clicks += link.clickCount;
          });
          
          Object.keys(performanceByType).forEach(type => {
            performanceByType[type].avgClicks = Math.round(
              (performanceByType[type].clicks / performanceByType[type].total) * 100
            ) / 100;
          });

          // Performance por campaña
          const performanceByCampaign: { [key: string]: { total: number; clicks: number; avgClicks: number } } = {};
          links.forEach((link: TrackingLink) => {
            if (!performanceByCampaign[link.campaignName]) {
              performanceByCampaign[link.campaignName] = { total: 0, clicks: 0, avgClicks: 0 };
            }
            performanceByCampaign[link.campaignName].total += 1;
            performanceByCampaign[link.campaignName].clicks += link.clickCount;
          });
          
          Object.keys(performanceByCampaign).forEach(campaign => {
            performanceByCampaign[campaign].avgClicks = Math.round(
              (performanceByCampaign[campaign].clicks / performanceByCampaign[campaign].total) * 100
            ) / 100;
          });

          setStats({
            totalLinks: links.length,
            totalClicks,
            activeLinks,
            inactiveLinks,
            linksWithClicks,
            linksWithoutClicks,
            averageClicksPerLink,
            totalLinksCreatedThisWeek,
            totalLinksCreatedThisMonth,
            topPerformer: topPerformer ? {
              title: topPerformer.title,
              clicks: topPerformer.clickCount
            } : null,
            performanceByType,
            performanceByCampaign
          });
        } else {
          console.error('Error fetching tracking links:', response.statusText);
          toast({
            title: "Error",
            description: "No se pudieron cargar los links de tracking",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching tracking links:', error);
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingLinks();
  }, [user, currentOrganization, toast]);

  // Filter links
  useEffect(() => {
    let filtered = trackingLinks;

    if (searchTerm) {
      filtered = filtered.filter(link => 
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.metadata.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(link => link.type === typeFilter);
    }

    if (campaignFilter !== 'all') {
      filtered = filtered.filter(link => link.campaignName === campaignFilter);
    }

    setFilteredLinks(filtered);
  }, [trackingLinks, searchTerm, typeFilter, campaignFilter]);

  const copyToClipboard = async (url: string, title: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado",
        description: `El link "${title}" se ha copiado al portapapeles`,
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'catalogo': return 'bg-blue-100 text-blue-800';
      case 'landing': return 'bg-green-100 text-green-800';
      case 'producto': return 'bg-purple-100 text-purple-800';
      case 'servicio': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'catalogo': return 'Catálogo';
      case 'landing': return 'Landing Page';
      case 'producto': return 'Producto';
      case 'servicio': return 'Servicio';
      default: return type;
    }
  };

  const availableCampaigns = Array.from(new Set(trackingLinks.map(link => link.campaignName)));

  const fetchLinkAnalytics = async (trackingId: string) => {
    if (!user || !currentOrganization) return;
    
    setAnalyticsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/tracking-analytics?trackingId=${trackingId}&organizationId=${currentOrganization.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const analytics = await response.json();
        setSelectedLinkAnalytics(analytics);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las analíticas del link",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const renderAnalyticsChart = (data: { [key: string]: number }, title: string, icon: React.ReactNode) => {
    const chartData = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([key, value]) => ({ name: key, value }));
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }} 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTimeChart = (data: { [key: string]: number }, title: string, isHourly: boolean = false) => {
    const chartData = Object.entries(data)
      .sort(([a], [b]) => {
        if (isHourly) {
          return parseInt(a) - parseInt(b);
        }
        return a.localeCompare(b);
      })
      .map(([key, value]) => ({
        time: isHourly ? `${key}:00` : format(new Date(key), 'dd/MM', { locale: es }),
        value
      }));
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={CHART_COLORS.secondary} 
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.secondary, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: CHART_COLORS.secondary, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative flex items-center gap-4 p-8 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-blue-400"></div>
            <div>
              <p className="text-white font-semibold">Cargando analíticas...</p>
              <p className="text-gray-400 text-sm">Preparando dashboard de tracking</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Link2 className="h-8 w-8 text-primary" />
            Tracking Links
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y monitorea los links de seguimiento para tus campañas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              if (!currentOrganization) return;
              const debugUrl = `/api/debug-tracking?organizationId=${currentOrganization.id}`;
              const response = await fetch(debugUrl);
              const debugData = await response.json();
              console.log('🔍 Debug Tracking Data:', debugData);
              alert(`Debug info logged to console. Links found: ${debugData.trackingLinksForThisOrg || 0}`);
            }}
          >
            🔍 Debug
          </Button>
          <Button
            variant="outline"
            className="bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
            onClick={async () => {
              if (!currentOrganization) return;
              
              // Primero ejecutar dry run
              const dryRunUrl = `/api/migrate-tracking-urls?organizationId=${currentOrganization.id}&dryRun=true`;
              const dryResponse = await fetch(dryRunUrl, { method: 'POST' });
              const dryResult = await dryResponse.json();
              
              if (dryResult.updatedCount > 0) {
                const confirmMigration = confirm(
                  `Se encontraron ${dryResult.updatedCount} links con URLs incorrectas (puerto 3000).\n` +
                  `¿Deseas migrarlos al puerto correcto (3047)?`
                );
                
                if (confirmMigration) {
                  const migrateUrl = `/api/migrate-tracking-urls?organizationId=${currentOrganization.id}&dryRun=false`;
                  const migrateResponse = await fetch(migrateUrl, { method: 'POST' });
                  const migrateResult = await migrateResponse.json();
                  
                  if (migrateResult.success) {
                    alert(`✅ Migración exitosa: ${migrateResult.updatedCount} links actualizados`);
                    // Recargar la página para mostrar los datos actualizados
                    window.location.reload();
                  } else {
                    alert(`❌ Error en migración: ${migrateResult.error}`);
                  }
                }
              } else {
                alert(`✅ Todos los links ya tienen URLs correctas. No se requiere migración.`);
              }
            }}
          >
            🔧 Migrar URLs
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Crear Link
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {stats && (
        <div className="space-y-8">
          {/* Header con efectos neon */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur-lg opacity-60"></div>
                  <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Dashboard de Analíticas
                  </h2>
                  <p className="text-gray-400 mt-1">Monitoreo en tiempo real de tus tracking links</p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards con efectos glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Links */}
            <Card className="relative overflow-hidden bg-gray-900/40 border-gray-700/50 backdrop-blur-sm hover:bg-gray-900/60 transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_COLORS.blue} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-bl-full blur-2xl"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400/30 rounded-lg blur-md"></div>
                    <div className="relative p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg backdrop-blur-sm">
                      <Link2 className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Total Links</p>
                    <p className="text-3xl font-bold text-white">{stats.totalLinks}</p>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mt-2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Clicks */}
            <Card className="relative overflow-hidden bg-gray-900/40 border-gray-700/50 backdrop-blur-sm hover:bg-gray-900/60 transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_COLORS.green} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/10 rounded-bl-full blur-2xl"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400/30 rounded-lg blur-md"></div>
                    <div className="relative p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-lg backdrop-blur-sm">
                      <MousePointer className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Total Clicks</p>
                    <p className="text-3xl font-bold text-white">{stats.totalClicks}</p>
                    <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mt-2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasa de Uso */}
            <Card className="relative overflow-hidden bg-gray-900/40 border-gray-700/50 backdrop-blur-sm hover:bg-gray-900/60 transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_COLORS.purple} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-bl-full blur-2xl"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-400/30 rounded-lg blur-md"></div>
                    <div className="relative p-3 bg-purple-500/20 border border-purple-400/30 rounded-lg backdrop-blur-sm">
                      <TrendingUp className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Tasa de Uso</p>
                    <p className="text-3xl font-bold text-white">
                      {stats.totalLinks > 0 ? Math.round((stats.linksWithClicks / stats.totalLinks) * 100) : 0}%
                    </p>
                    <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promedio CTR */}
            <Card className="relative overflow-hidden bg-gray-900/40 border-gray-700/50 backdrop-blur-sm hover:bg-gray-900/60 transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_COLORS.amber} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/10 rounded-bl-full blur-2xl"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-400/30 rounded-lg blur-md"></div>
                    <div className="relative p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg backdrop-blur-sm">
                      <Activity className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Promedio CTR</p>
                    <p className="text-3xl font-bold text-white">{stats.averageClicksPerLink}</p>
                    <div className="w-12 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mt-2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Links Usage Pie Chart */}
            <Card className="bg-gray-900/40 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3 text-gray-100">
                  <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Distribución de Uso
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Links Usados', value: stats.linksWithClicks },
                          { name: 'Links Sin Usar', value: stats.linksWithoutClicks }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="none"
                      >
                        {[
                          { name: 'Links Usados', value: stats.linksWithClicks },
                          { name: 'Links Sin Usar', value: stats.linksWithoutClicks }
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? CHART_COLORS.success : CHART_COLORS.danger}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ color: '#D1D5DB' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance by Type Bar Chart */}
            <Card className="bg-gray-900/40 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3 text-gray-100">
                  <div className="p-2 bg-purple-500/20 border border-purple-400/30 rounded-lg">
                    <Filter className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Performance por Tipo
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(stats.performanceByType).map(([type, data]) => ({
                        tipo: getTypeLabel(type),
                        clicks: data.clicks,
                        links: data.total,
                        promedio: data.avgClicks
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        dataKey="tipo" 
                        tick={{ fontSize: 12, fill: '#D1D5DB' }}
                        axisLine={{ stroke: '#6B7280' }}
                        tickLine={{ stroke: '#6B7280' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#D1D5DB' }}
                        axisLine={{ stroke: '#6B7280' }}
                        tickLine={{ stroke: '#6B7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ color: '#D1D5DB' }}
                      />
                      <Bar 
                        dataKey="clicks" 
                        fill={CHART_COLORS.primary} 
                        name="Total Clicks" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="links" 
                        fill={CHART_COLORS.secondary} 
                        name="Total Links" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Performance */}
            <Card className="bg-gray-900/40 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3 text-gray-100">
                  <div className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Top Campañas
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="horizontal"
                      data={Object.entries(stats.performanceByCampaign)
                        .sort(([,a], [,b]) => b.clicks - a.clicks)
                        .slice(0, 5)
                        .map(([campaign, data]) => ({
                          campaña: campaign.length > 15 ? campaign.substring(0, 15) + '...' : campaign,
                          clicks: data.clicks,
                          links: data.total
                        }))}
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 12, fill: '#D1D5DB' }}
                        axisLine={{ stroke: '#6B7280' }}
                        tickLine={{ stroke: '#6B7280' }}
                      />
                      <YAxis 
                        dataKey="campaña" 
                        type="category" 
                        tick={{ fontSize: 12, fill: '#D1D5DB' }} 
                        width={90}
                        axisLine={{ stroke: '#6B7280' }}
                        tickLine={{ stroke: '#6B7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="clicks" 
                        fill={CHART_COLORS.accent} 
                        name="Clicks" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="bg-gray-900/40 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3 text-gray-100">
                  <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Actividad Reciente
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { periodo: 'Este Mes', creados: stats.totalLinksCreatedThisMonth, activos: Math.round(stats.totalLinksCreatedThisMonth * 0.8) },
                        { periodo: 'Esta Semana', creados: stats.totalLinksCreatedThisWeek, activos: Math.round(stats.totalLinksCreatedThisWeek * 0.9) },
                        { periodo: 'Hoy', creados: Math.round(stats.totalLinksCreatedThisWeek / 7), activos: Math.round(stats.totalLinksCreatedThisWeek / 7 * 0.95) }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        dataKey="periodo" 
                        tick={{ fontSize: 12, fill: '#D1D5DB' }}
                        axisLine={{ stroke: '#6B7280' }}
                        tickLine={{ stroke: '#6B7280' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#D1D5DB' }}
                        axisLine={{ stroke: '#6B7280' }}
                        tickLine={{ stroke: '#6B7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ color: '#D1D5DB' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="creados" 
                        stackId="1" 
                        stroke={CHART_COLORS.indigo} 
                        fill={CHART_COLORS.indigo} 
                        fillOpacity={0.4}
                        name="Links Creados"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="activos" 
                        stackId="2" 
                        stroke={CHART_COLORS.teal} 
                        fill={CHART_COLORS.teal} 
                        fillOpacity={0.4}
                        name="Links Activos"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performer Highlight */}
          {stats.topPerformer && (
            <Card className="relative overflow-hidden bg-gray-900/60 border-amber-500/30 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-400/10 rounded-bl-full blur-3xl"></div>
              <CardHeader className="relative">
                <CardTitle className="text-xl flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl blur-lg opacity-60"></div>
                    <div className="relative p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl border border-amber-400/30">
                      <BarChart3 className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <span className="text-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent font-bold">
                    🏆 Link Más Exitoso
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3 leading-tight">{stats.topPerformer.title}</h3>
                    <p className="text-gray-300 mb-6 text-lg">Link con el mejor rendimiento de tu organización</p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 border border-amber-400/30 rounded-lg">
                          <MousePointer className="h-5 w-5 text-amber-400" />
                        </div>
                        <span className="text-gray-300 font-medium">Total de clicks</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-300 hover:bg-amber-500/30">
                        ⭐ Top Performer
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right ml-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 blur-2xl opacity-30"></div>
                      <div className="relative text-6xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                        {stats.topPerformer.clicks}
                      </div>
                    </div>
                    <p className="text-gray-400 mt-2 text-lg font-medium">clicks totales</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mt-3 mx-auto"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="bg-gray-900/40 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, lead o campaña..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="catalogo">Catálogo</SelectItem>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="producto">Producto</SelectItem>
                <SelectItem value="servicio">Servicio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Campaña" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las campañas</SelectItem>
                {availableCampaigns.map(campaign => (
                  <SelectItem key={campaign} value={campaign}>
                    {campaign}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || typeFilter !== 'all' || campaignFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setCampaignFilter('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links List */}
      <div className="space-y-4">
        {filteredLinks.length === 0 ? (
          <Card className="bg-gray-900/40 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="relative mx-auto mb-6 w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-30"></div>
                <div className="relative flex items-center justify-center w-24 h-24 bg-gray-800/50 border border-gray-600/50 rounded-full">
                  <Link2 className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">No hay links de tracking</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {trackingLinks.length === 0 
                  ? "Aún no se han creado links de tracking. Los links se generan automáticamente cuando envías mensajes de bienvenida." 
                  : "No hay links que coincidan con los filtros aplicados. Prueba a cambiar los criterios de búsqueda."}
              </p>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredLinks.map((link) => (
            <Card key={link.id} className="bg-gray-900/40 border-gray-700/50 backdrop-blur-sm hover:bg-gray-900/60 hover:border-gray-600/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{link.title}</h3>
                      <Badge className={getTypeColor(link.type)}>
                        {getTypeLabel(link.type)}
                      </Badge>
                      <Badge variant="outline">
                        {link.campaignName}
                      </Badge>
                      {!link.isActive && (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">{link.clickCount} clicks</p>
                        <p>Total de clicks</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {link.metadata.leadName || 'N/A'}
                        </p>
                        <p>Lead asociado</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {format(new Date(link.createdAt), 'dd MMM yyyy', { locale: es })}
                        </p>
                        <p>Creado</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {link.lastClickAt 
                            ? format(new Date(link.lastClickAt), 'dd MMM yyyy', { locale: es })
                            : 'Nunca'
                          }
                        </p>
                        <p>Último click</p>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 truncate">
                      {link.trackingUrl}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(link.trackingUrl, link.title)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchLinkAnalytics(link.id)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analíticas
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Analíticas: {link.title}
                          </DialogTitle>
                        </DialogHeader>
                        
                        {analyticsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : selectedLinkAnalytics ? (
                          <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                              <TabsTrigger value="overview">Resumen</TabsTrigger>
                              <TabsTrigger value="devices">Dispositivos</TabsTrigger>
                              <TabsTrigger value="time">Tiempo</TabsTrigger>
                              <TabsTrigger value="clicks">Clicks</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                      <MousePointer className="h-4 w-4 text-blue-600" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Total Clicks</p>
                                        <p className="text-2xl font-bold">{selectedLinkAnalytics.linkDetails.clickCount}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-green-600" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Último Click</p>
                                        <p className="text-sm font-bold">
                                          {selectedLinkAnalytics.linkDetails.lastClickAt 
                                            ? format(
                                                selectedLinkAnalytics.linkDetails.lastClickAt.toDate 
                                                  ? selectedLinkAnalytics.linkDetails.lastClickAt.toDate()
                                                  : new Date(selectedLinkAnalytics.linkDetails.lastClickAt), 
                                                'dd/MM/yy', 
                                                { locale: es }
                                              )
                                            : 'Nunca'
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                      <Globe className="h-4 w-4 text-purple-600" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Países</p>
                                        <p className="text-2xl font-bold">{Object.keys(selectedLinkAnalytics.analytics.countries).length}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                      <Activity className="h-4 w-4 text-orange-600" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Dispositivos</p>
                                        <p className="text-2xl font-bold">{Object.keys(selectedLinkAnalytics.analytics.deviceTypes).length}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderAnalyticsChart(
                                  selectedLinkAnalytics.analytics.countries,
                                  "Países",
                                  <Globe className="h-4 w-4" />
                                )}
                                {renderAnalyticsChart(
                                  selectedLinkAnalytics.analytics.browsers,
                                  "Navegadores",
                                  <Monitor className="h-4 w-4" />
                                )}
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="devices" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Device Types Pie Chart */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                      <Smartphone className="h-4 w-4" />
                                      Tipos de Dispositivo
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="h-64">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie
                                            data={Object.entries(selectedLinkAnalytics.analytics.deviceTypes).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={60}
                                            fill="#8884d8"
                                            dataKey="value"
                                          >
                                            {Object.entries(selectedLinkAnalytics.analytics.deviceTypes).map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                          </Pie>
                                          <Tooltip content={<CustomTooltip />} />
                                          <Legend />
                                        </PieChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Browsers Pie Chart */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                      <Monitor className="h-4 w-4" />
                                      Navegadores
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="h-64">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie
                                            data={Object.entries(selectedLinkAnalytics.analytics.browsers).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={60}
                                            fill="#8884d8"
                                            dataKey="value"
                                          >
                                            {Object.entries(selectedLinkAnalytics.analytics.browsers).map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                          </Pie>
                                          <Tooltip content={<CustomTooltip />} />
                                          <Legend />
                                        </PieChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="time" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderTimeChart(
                                  selectedLinkAnalytics.analytics.clicksByHour,
                                  "Clicks por Hora",
                                  true
                                )}
                                {renderTimeChart(
                                  selectedLinkAnalytics.analytics.clicksByDay,
                                  "Clicks por Día",
                                  false
                                )}
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="clicks" className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm font-medium">Clicks Recientes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {selectedLinkAnalytics.clicks.map((click, index) => (
                                      <div key={click.id} className="border rounded-lg p-3 text-sm">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="font-medium">Click #{index + 1}</span>
                                          <span className="text-muted-foreground">
                                            {click.timestamp && click.timestamp.toDate 
                                              ? format(click.timestamp.toDate(), 'dd/MM/yy HH:mm', { locale: es })
                                              : 'Fecha no disponible'
                                            }
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                          <div>
                                            <span className="font-medium">País:</span> {click.clickData?.country || 'Desconocido'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Idioma:</span> {click.clickData?.language || 'N/A'}
                                          </div>
                                          <div className="col-span-2">
                                            <span className="font-medium">User Agent:</span> 
                                            <span className="break-all">{click.clickData?.userAgent || 'N/A'}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {selectedLinkAnalytics.clicks.length === 0 && (
                                      <p className="text-center text-muted-foreground py-4">No hay clicks registrados</p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">No se pudieron cargar las analíticas</p>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                    >
                      <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Destino
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}