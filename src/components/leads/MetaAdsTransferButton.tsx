"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, Database, RefreshCw, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

interface TransferStats {
  totalMetaLeads: number;
  totalFlowLeads: number;
  syncedFromMeta: number;
  pendingTransfer: number;
}

export default function MetaAdsTransferButton() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [stats, setStats] = useState<TransferStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadStats = async () => {
    if (!user || !currentOrganization) return;

    setLoadingStats(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/transfer-to-flow?organizationId=${currentOrganization.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error obteniendo estadísticas');
      }

      const data = await response.json();
      setStats(data);
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
  };

  const handleTransfer = async () => {
    if (!user || !currentOrganization) return;

    setIsTransferring(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/transfer-to-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organizationId: currentOrganization.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error durante la transferencia');
      }

      toast({
        title: "Transferencia completada",
        description: `${data.transferred} leads transferidos al flujo. ${data.skipped} ya existían.`
      });

      // Reload stats after transfer
      await loadStats();
      
    } catch (error: any) {
      console.error('Error during transfer:', error);
      toast({
        title: "Error en la transferencia",
        description: error.message || "No se pudo completar la transferencia.",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      loadStats();
    }
  };

  if (!currentOrganization) return null;

  const syncPercentage = stats ? 
    stats.totalMetaLeads > 0 ? 
      Math.round((stats.syncedFromMeta / stats.totalMetaLeads) * 100) : 
      100 : 0;

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          Transferir al Flujo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Transferir Meta Ads al Flujo
          </DialogTitle>
          <DialogDescription>
            Transfiere los leads de Meta Ads a la tabla de flujo de trabajo para poder gestionarlos en el kanban.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : stats ? (
            <>
              {/* Progress Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Estado de Sincronización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progreso</span>
                    <span className="font-mono">{stats.syncedFromMeta}/{stats.totalMetaLeads}</span>
                  </div>
                  <Progress value={syncPercentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">
                    {syncPercentage}% sincronizado
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Meta Ads</p>
                        <p className="text-xl font-bold text-gray-900">{stats.totalMetaLeads}</p>
                      </div>
                      <Database className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">En Flujo</p>
                        <p className="text-xl font-bold text-gray-900">{stats.syncedFromMeta}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Messages */}
              {stats.pendingTransfer > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      <strong>{stats.pendingTransfer}</strong> leads pendientes de transferir al flujo.
                    </p>
                  </div>
                </div>
              ) : stats.totalMetaLeads > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">
                      Todos los leads de Meta Ads están sincronizados.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    No hay leads de Meta Ads para transferir.
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">¿Qué hace la transferencia?</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Copia leads de Meta Ads a la tabla de flujo</li>
                  <li>• Agrega propiedades de seguimiento y scoring</li>
                  <li>• Permite gestión avanzada en el kanban</li>
                  <li>• No elimina los datos originales</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Error cargando estadísticas
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleTransfer}
            disabled={isTransferring || !stats || stats.pendingTransfer === 0}
          >
            {isTransferring ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Transfiriendo...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Transferir {stats?.pendingTransfer || 0} Leads
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}