"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { RefreshCw, Download, AlertCircle, CheckCircle, Clock, Facebook } from 'lucide-react';

interface MetaAdsSyncStats {
  totalMetaLeads: number;
  syncedLeads: number;
  pendingSync: number;
  lastSync: string | null;
}

interface MetaAdsSyncProps {
  onSyncComplete?: () => void;
}

export default function MetaAdsSync({ onSyncComplete }: MetaAdsSyncProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<MetaAdsSyncStats | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    skipped: number;
    total: number;
  } | null>(null);

  const fetchSyncStats = useCallback(async () => {
    if (!user || !currentOrganization) return;

    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `/api/sync-meta-leads?organizationId=${currentOrganization.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de Meta Ads');
      }

      const stats = await response.json();
      setSyncStats(stats);
    } catch (error: any) {
      console.error('Error fetching Meta Ads stats:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al obtener estadísticas de Meta Ads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, currentOrganization, toast]);

  const handleSync = useCallback(async () => {
    if (!user || !currentOrganization) return;

    setIsSyncing(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/sync-meta-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al sincronizar leads de Meta Ads');
      }

      setLastSyncResult({
        synced: result.synced,
        skipped: result.skipped,
        total: result.total,
      });

      toast({
        title: 'Sincronización Completada',
        description: result.message,
      });

      // Refresh stats after sync
      await fetchSyncStats();
      onSyncComplete?.();
    } catch (error: any) {
      console.error('Error syncing Meta Ads leads:', error);
      toast({
        title: 'Error en Sincronización',
        description: error.message || 'Error al sincronizar leads de Meta Ads',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, currentOrganization, toast, fetchSyncStats, onSyncComplete]);

  // Load stats on component mount
  React.useEffect(() => {
    fetchSyncStats();
  }, [fetchSyncStats]);

  if (!user || !currentOrganization) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Facebook className="mr-2 h-5 w-5 text-blue-600" />
            Meta Ads Leads
          </CardTitle>
          <CardDescription>
            Sincroniza leads de Facebook/Instagram Ads
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSyncStats}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button
            onClick={handleSync}
            disabled={isSyncing || isLoading}
            size="sm"
          >
            {isSyncing ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando estadísticas...</span>
          </div>
        ) : syncStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Meta Ads</p>
                  <p className="text-2xl font-bold text-blue-900">{syncStats.totalMetaLeads}</p>
                </div>
                <Facebook className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Sincronizados</p>
                  <p className="text-2xl font-bold text-green-900">{syncStats.syncedLeads}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Pendientes</p>
                  <p className="text-2xl font-bold text-orange-900">{syncStats.pendingSync}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar las estadísticas de Meta Ads
            </AlertDescription>
          </Alert>
        )}

        {lastSyncResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Última sincronización:</strong> {lastSyncResult.synced} leads sincronizados, {lastSyncResult.skipped} omitidos de {lastSyncResult.total} totales
            </AlertDescription>
          </Alert>
        )}

        {syncStats && syncStats.pendingSync > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hay {syncStats.pendingSync} leads de Meta Ads pendientes de sincronización.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="secondary" className="flex items-center">
            <Facebook className="mr-1 h-3 w-3" />
            Facebook Ads
          </Badge>
          <Badge variant="secondary">
            Instagram Ads
          </Badge>
          <Badge variant="outline">
            Sincronización Automática
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}