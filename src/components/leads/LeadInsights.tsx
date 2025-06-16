"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Target, Phone, Mail, Globe, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtendedLead as Lead } from '@/types';
import { LEAD_STAGES } from '@/lib/leads-utils';
import { useValuationConfig } from '@/hooks/useValuationConfig';
import { calculateLeadValuation, calculateStageTotal, formatCurrency } from '@/lib/valuation-calculator';

interface LeadInsightsProps {
  leads: Lead[];
  className?: string;
}

export const LeadInsights = ({ leads, className }: LeadInsightsProps) => {
  const { activeConfig, loading } = useValuationConfig();
  
  const insights = useMemo(() => {
    const total = leads.length;
    
    // Stage distribution with valuation
    const stageDistribution = LEAD_STAGES.map(stage => {
      const stageLeads = leads.filter(lead => lead.stage === stage);
      const stageValue = activeConfig ? calculateStageTotal(leads, stage, activeConfig) : 0;
      return {
        stage,
        count: stageLeads.length,
        percentage: total ? (stageLeads.length / total) * 100 : 0,
        value: stageValue,
        formattedValue: formatCurrency(stageValue)
      };
    });

    // Contact info completeness
    const contactStats = {
      withPhone: leads.filter(lead => lead.phone && lead.phone.trim()).length,
      withEmail: leads.filter(lead => lead.email && lead.email.trim()).length,
      withWebsite: leads.filter(lead => lead.website && lead.website.trim()).length,
      complete: leads.filter(lead => 
        lead.phone?.trim() && lead.email?.trim() && lead.website?.trim()
      ).length
    };

    // Source distribution
    const sourceDistribution = leads.reduce((acc, lead) => {
      const source = lead.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentLeads = leads.filter(lead => {
      let createdAt: Date;
      if (
        typeof lead.createdAt === 'object' &&
        lead.createdAt !== null &&
        typeof (lead.createdAt as { toDate?: () => Date }).toDate === 'function'
      ) {
        createdAt = (lead.createdAt as { toDate: () => Date }).toDate();
      } else if (typeof lead.createdAt === 'string' || typeof lead.createdAt === 'number') {
        createdAt = new Date(lead.createdAt);
      } else {
        createdAt = new Date(0);
      }
      return createdAt > oneWeekAgo;
    }).length;

    // Financial projections
    const totalProjectedValue = activeConfig ? leads.reduce((sum, lead) => {
      return sum + calculateLeadValuation(lead, activeConfig).totalValue;
    }, 0) : 0;

    const wonValue = activeConfig ? calculateStageTotal(leads, 'Ganado', activeConfig) : 0;
    const lostValue = activeConfig ? calculateStageTotal(leads, 'Perdido', activeConfig) : 0;
    const pipelineValue = totalProjectedValue - wonValue - lostValue;

    return {
      total,
      stageDistribution,
      contactStats,
      sourceDistribution,
      recentLeads,
      conversionRate: total ? (leads.filter(lead => lead.stage === 'Ganado').length / total) * 100 : 0,
      financials: {
        totalProjected: totalProjectedValue,
        won: wonValue,
        lost: lostValue,
        pipeline: pipelineValue
      }
    };
  }, [leads, activeConfig]);

  const MiniChart = ({ data, color = "bg-primary" }: { data: number; color?: string }) => (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-8 rounded-full", color)} 
           style={{ height: `${Math.max(data, 5)}%` }} />
      <span className="text-sm font-medium">{data}%</span>
    </div>
  );

  // Show skeleton while loading valuation config
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Skeleton for loading state */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6">
              <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-2 w-full bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.total}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +{insights.recentLeads} esta semana
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyección Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(insights.financials.totalProjected)}
            </div>
            <div className="text-xs text-muted-foreground">
              Valor total pipeline
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(insights.financials.won)}
            </div>
            <div className="text-xs text-muted-foreground">
              {insights.conversionRate.toFixed(1)}% conversión
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Target className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {formatCurrency(insights.financials.pipeline)}
            </div>
            <div className="text-xs text-muted-foreground">
              Pipeline activo
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdidos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(insights.financials.lost)}
            </div>
            <div className="text-xs text-muted-foreground">
              Costo oportunidad
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Etapa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.stageDistribution.map((stage, index) => {
              const getStageColor = (stageName: string) => {
                if (stageName === 'Ganado') return 'text-green-600';
                if (stageName === 'Perdido') return 'text-red-600';
                return 'text-blue-600';
              };
              
              return (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {stage.count} ({stage.percentage.toFixed(1)}%)
                      </div>
                      <div className={`text-sm font-semibold ${getStageColor(stage.stage)}`}>
                        {stage.formattedValue}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={stage.percentage} 
                    className="h-2"
                    style={{
                      '--progress-background': stage.stage === 'Ganado' ? 'rgb(34, 197, 94)' : 
                                             stage.stage === 'Perdido' ? 'rgb(239, 68, 68)' : 
                                             `hsl(${(index * 60) % 360}, 70%, 50%)`
                    } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Con Teléfono</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{insights.contactStats.withPhone}</span>
                <MiniChart 
                  data={Math.round(insights.total ? (insights.contactStats.withPhone / insights.total) * 100 : 0)} 
                  color="bg-blue-500" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-500" />
                <span className="text-sm">Con Email</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{insights.contactStats.withEmail}</span>
                <MiniChart 
                  data={Math.round(insights.total ? (insights.contactStats.withEmail / insights.total) * 100 : 0)} 
                  color="bg-green-500" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Con Website</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{insights.contactStats.withWebsite}</span>
                <MiniChart 
                  data={Math.round(insights.total ? (insights.contactStats.withWebsite / insights.total) * 100 : 0)} 
                  color="bg-purple-500" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fuentes de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(insights.sourceDistribution).map(([source, count]) => (
              <Badge key={source} variant="outline" className="flex items-center gap-1">
                {source.replace('_', ' ')}
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 ml-1">
                  {count}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};