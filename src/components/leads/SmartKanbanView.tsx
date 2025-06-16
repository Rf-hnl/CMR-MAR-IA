// components/leads/SmartKanbanView.tsx
// Wrapper component que detecta automáticamente qué sistema usar

"use client";

import { useState, useEffect } from 'react';
import { useUnifiedLeads } from '@/hooks/useUnifiedLeads';
import { useOrganization } from '@/hooks/useOrganization';
import UnifiedKanbanView from './UnifiedKanbanView';
import KanbanView from './KanbanView';
import UnifiedLeadDetailsDialog from './UnifiedLeadDetailsDialog';
import LeadDetailsDialog from './LeadDetailsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Zap, Database, TrendingUp, AlertTriangle, 
  CheckCircle2, Settings, RefreshCw
} from 'lucide-react';
import type { ExtendedLead, UnifiedLead, LeadStage, UpdateLeadInput } from '@/types';

interface SmartKanbanViewProps {
  // Legacy props for backward compatibility
  leads?: ExtendedLead[];
  onStageChange?: (leadId: string, newStage: LeadStage) => void;
  onOpenLeadDetails?: (lead: ExtendedLead) => void;
  onUpdate?: (leadId: string, updates: Partial<ExtendedLead>) => Promise<void>;
  onUploadImages?: (leadId: string, images: any[]) => Promise<void>;
  onDeleteImage?: (leadId: string, imageId: string) => Promise<void>;
  onSetFeaturedImage?: (leadId: string, imageId: string) => Promise<void>;
  
  // AI Action Props
  onGenerateWelcomeMessage?: (lead: ExtendedLead | UnifiedLead) => void;
  onEvaluateBusiness?: (lead: ExtendedLead | UnifiedLead) => void;
  onGenerateSalesRecommendations?: (lead: ExtendedLead | UnifiedLead) => void;
  onGenerateSolutionEmail?: (lead: ExtendedLead | UnifiedLead) => void;
  currentActionLead?: ExtendedLead | UnifiedLead | null;
  isActionLoading?: boolean;
  currentActionType?: string | null;
  selectedLeadForDetails?: ExtendedLead | UnifiedLead | null;
  
  // Configuration
  forceUnified?: boolean; // Force unified system
  forceLegacy?: boolean;  // Force legacy system
}

export default function SmartKanbanView(props: SmartKanbanViewProps) {
  const { organizationId } = useOrganization();
  const [useUnifiedSystem, setUseUnifiedSystem] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isCheckingMigration, setIsCheckingMigration] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ExtendedLead | UnifiedLead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Unified system hooks
  const {
    leads: unifiedLeads,
    loading: unifiedLoading,
    error: unifiedError,
    searchLeads,
    updateLead: updateUnifiedLead,
    refreshLeads,
    getLeadsAsExtended
  } = useUnifiedLeads();

  // Check migration status on mount
  useEffect(() => {
    if (organizationId && !props.forceUnified && !props.forceLegacy) {
      checkMigrationStatus();
    }
  }, [organizationId]);

  // Auto-detect system to use
  useEffect(() => {
    if (props.forceUnified) {
      setUseUnifiedSystem(true);
    } else if (props.forceLegacy) {
      setUseUnifiedSystem(false);
    } else if (migrationStatus) {
      // Use unified system if data is available and migration is complete
      const hasUnifiedData = migrationStatus.collections?.['leads-unified'] > 0;
      const isFullyMigrated = migrationStatus.isFullyMigrated;
      setUseUnifiedSystem(hasUnifiedData && isFullyMigrated);
    }
  }, [props.forceUnified, props.forceLegacy, migrationStatus]);

  const checkMigrationStatus = async () => {
    if (!organizationId) return;
    
    setIsCheckingMigration(true);
    try {
      // This would typically require auth token, simplified for demo
      const response = await fetch(`/api/leads/migrate?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setMigrationStatus(data.data);
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
    } finally {
      setIsCheckingMigration(false);
    }
  };

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    if (useUnifiedSystem) {
      await updateUnifiedLead(leadId, { stage: newStage });
    } else if (props.onStageChange) {
      props.onStageChange(leadId, newStage);
    }
  };

  const handleOpenLeadDetails = (lead: ExtendedLead | UnifiedLead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
    
    if (!useUnifiedSystem && props.onOpenLeadDetails) {
      props.onOpenLeadDetails(lead as ExtendedLead);
    }
  };

  const handleUpdateLead = async (leadId: string, updates: any) => {
    if (useUnifiedSystem) {
      await updateUnifiedLead(leadId, updates as UpdateLeadInput);
    } else if (props.onUpdate) {
      await props.onUpdate(leadId, updates);
    }
  };

  // Render migration status banner
  const renderMigrationBanner = () => {
    if (!migrationStatus || props.forceUnified || props.forceLegacy) return null;

    const hasUnifiedData = migrationStatus.collections?.['leads-unified'] > 0;
    const hasLegacyData = (migrationStatus.collections?.['meta-lead-ads'] || 0) + 
                          (migrationStatus.collections?.['leads-flow'] || 0) > 0;

    if (!hasUnifiedData && hasLegacyData) {
      return (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-base text-orange-900">
                  Sistema Legacy Detectado
                </CardTitle>
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  Migración Disponible
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={checkMigrationStatus}
                  disabled={isCheckingMigration}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isCheckingMigration ? 'animate-spin' : ''}`} />
                  Verificar
                </Button>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Database className="h-4 w-4 mr-1" />
                  Migrar Datos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-orange-900">Meta Ads</p>
                <p className="text-orange-700">{migrationStatus.collections?.['meta-lead-ads'] || 0} leads</p>
              </div>
              <div>
                <p className="font-medium text-orange-900">Flow</p>
                <p className="text-orange-700">{migrationStatus.collections?.['leads-flow'] || 0} leads</p>
              </div>
              <div>
                <p className="font-medium text-orange-900">Legacy</p>
                <p className="text-orange-700">{migrationStatus.collections?.['leads'] || 0} leads</p>
              </div>
              <div>
                <p className="font-medium text-orange-900">Unificado</p>
                <p className="text-orange-700">{migrationStatus.collections?.['leads-unified'] || 0} leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (hasUnifiedData) {
      return (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base text-green-900">
                  Sistema Unificado Activo
                </CardTitle>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Optimizado
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="system-toggle" className="text-sm text-green-800">
                    Sistema Unificado
                  </Label>
                  <Switch 
                    id="system-toggle"
                    checked={useUnifiedSystem}
                    onCheckedChange={setUseUnifiedSystem}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={refreshLeads}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Performance</p>
                  <p className="text-green-700">Optimizado</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Datos</p>
                  <p className="text-green-700">{migrationStatus.collections?.['leads-unified'] || 0} leads</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Funciones</p>
                  <p className="text-green-700">Completas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // Determine which data to use
  const leadsToDisplay = useUnifiedSystem ? unifiedLeads : (props.leads || []);
  const isLoading = useUnifiedSystem ? unifiedLoading : false;

  return (
    <div className="space-y-4">
      {renderMigrationBanner()}
      
      {/* Error Display */}
      {unifiedError && useUnifiedSystem && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">Error: {unifiedError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {useUnifiedSystem ? (
        <UnifiedKanbanView
          leads={unifiedLeads}
          onStageChange={handleStageChange}
          onOpenLeadDetails={handleOpenLeadDetails}
          onUpdateLead={handleUpdateLead}
          onGenerateWelcomeMessage={props.onGenerateWelcomeMessage || (() => {})}
          onEvaluateBusiness={props.onEvaluateBusiness || (() => {})}
          onGenerateSalesRecommendations={props.onGenerateSalesRecommendations || (() => {})}
          onGenerateSolutionEmail={props.onGenerateSolutionEmail || (() => {})}
          currentActionLead={props.currentActionLead as UnifiedLead}
          isActionLoading={props.isActionLoading || false}
          currentActionType={props.currentActionType || null}
          selectedLeadForDetails={props.selectedLeadForDetails as UnifiedLead}
          loading={isLoading}
        />
      ) : (
        <KanbanView
          leads={props.leads || []}
          onStageChange={props.onStageChange || (() => {})}
          onOpenLeadDetails={props.onOpenLeadDetails || (() => {})}
          onGenerateWelcomeMessage={props.onGenerateWelcomeMessage || (() => {})}
          onEvaluateBusiness={props.onEvaluateBusiness || (() => {})}
          onGenerateSalesRecommendations={props.onGenerateSalesRecommendations || (() => {})}
          onGenerateSolutionEmail={props.onGenerateSolutionEmail || (() => {})}
          currentActionLead={props.currentActionLead as ExtendedLead}
          isActionLoading={props.isActionLoading || false}
          currentActionType={props.currentActionType || null}
          selectedLeadForDetails={props.selectedLeadForDetails as ExtendedLead}
        />
      )}

      {/* Modal */}
      {selectedLead && (
        useUnifiedSystem ? (
          <UnifiedLeadDetailsDialog
            lead={selectedLead as UnifiedLead}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onUpdate={handleUpdateLead}
            onUploadImages={props.onUploadImages || (() => Promise.resolve())}
            onDeleteImage={props.onDeleteImage || (() => Promise.resolve())}
            onSetFeaturedImage={props.onSetFeaturedImage || (() => Promise.resolve())}
            isUploadingImages={false}
            isDeletingImage={null}
            isSettingFeaturedImage={null}
          />
        ) : (
          <LeadDetailsDialog
            lead={selectedLead as ExtendedLead}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onUpdate={props.onUpdate || (() => Promise.resolve())}
            onUploadImages={props.onUploadImages || (() => Promise.resolve())}
            onDeleteImage={props.onDeleteImage || (() => Promise.resolve())}
            onSetFeaturedImage={props.onSetFeaturedImage || (() => Promise.resolve())}
            isUploadingImages={false}
            isDeletingImage={null}
            isSettingFeaturedImage={null}
          />
        )
      )}
    </div>
  );
}