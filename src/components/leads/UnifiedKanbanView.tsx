// components/leads/UnifiedKanbanView.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, AlertCircle, Dot, Phone, MessageSquareText, Mail as MailIconLucide, 
  ExternalLink as ExternalLinkIcon, ChevronLeft, ChevronRight, DollarSign,
  Star, TrendingUp, Calendar, Target, Users
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useState } from 'react';
import type { UnifiedLead, LeadStage, UpdateLeadInput } from '@/types';

// Define LeadStage type based on LEAD_STAGES if not exported from '@/types'
type LeadStageType = (typeof LEAD_STAGES)[number];
import { LEAD_STAGES, stageColors, LOCAL_FALLBACK_SOURCE } from '@/lib/leads-utils';
import LeadActionButtons from './LeadActionButtons'; 
import { isFieldMissing, generateWhatsAppLink } from '@/lib/leads-utils';
import { useValuationConfig } from '@/hooks/useValuationConfig';
import { calculateLeadValuation, calculateStageTotal, formatCurrency } from '@/lib/valuation-calculator';
import { getLeadSourceIcon, getLeadSourceColor } from '@/lib/lead-converter';
import { LEAD_SOURCE_LABELS } from '@/types/formatters/lead-sources';

interface UnifiedKanbanViewProps {
  leads: UnifiedLead[];
  onStageChange: (leadId: string, newStage: LeadStage) => void;
  onOpenLeadDetails: (lead: UnifiedLead) => void;
  onUpdateLead: (leadId: string, updates: UpdateLeadInput) => Promise<void>;
  // AI Action Props
  onGenerateWelcomeMessage: (lead: UnifiedLead) => void;
  onEvaluateBusiness: (lead: UnifiedLead) => void;
  onGenerateSalesRecommendations: (lead: UnifiedLead) => void;
  onGenerateSolutionEmail: (lead: UnifiedLead) => void;
  currentActionLead: UnifiedLead | null;
  isActionLoading: boolean;
  currentActionType: string | null;
  selectedLeadForDetails: UnifiedLead | null; 
  loading?: boolean;
}

export default function UnifiedKanbanView({
  leads,
  onStageChange,
  onOpenLeadDetails,
  onUpdateLead,
  onGenerateWelcomeMessage,
  onEvaluateBusiness,
  onGenerateSalesRecommendations,
  onGenerateSolutionEmail,
  currentActionLead,
  isActionLoading,
  currentActionType,
  selectedLeadForDetails,
  loading = false
}: UnifiedKanbanViewProps) {
  const isMobile = useIsMobile();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const { activeConfig } = useValuationConfig();
  const [showFullLabel, setShowFullLabel] = useState<{[key: string]: boolean}>({});
  const [showFullStageLabel, setShowFullStageLabel] = useState<{[key: string]: boolean}>({});
  
  const {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop();

  // Mobile swipe navigation
  const nextStage = () => {
    setCurrentStageIndex(prev => (prev + 1) % LEAD_STAGES.length);
  };

  const prevStage = () => {
    setCurrentStageIndex(prev => (prev - 1 + LEAD_STAGES.length) % LEAD_STAGES.length);
  };

  // Handle lead drop on stage
  const handleLeadDrop = (leadData: any, targetStage: string) => {
    if (leadData.id && leadData.id !== targetStage) {
      onStageChange(leadData.id, targetStage as LeadStage);
    }
  };

  // Handle toggle for value label
  const toggleValueLabel = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullLabel(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  // Handle toggle for stage label
  const toggleStageLabel = (stage: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullStageLabel(prev => ({
      ...prev,
      [stage]: !prev[stage]
    }));
  };

  // Generate WhatsApp link for unified lead
  const generateUnifiedWhatsAppLink = (lead: UnifiedLead): string | null => {
    if (!lead.phone) return null;
    const cleanPhone = lead.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return null;
    return `https://wa.me/${cleanPhone}`;
  };

  // Check if lead has missing critical fields
  const hasIncompleteData = (lead: UnifiedLead): boolean => {
    return !lead.phone || !lead.email || !lead.address?.formatted;
  };

  // Render lead card (shared between mobile and desktop)
  const renderLeadCard = (lead: UnifiedLead) => {
    const featuredImage = lead.metadata.images?.find(img => img.is_featured)?.secure_url;
    const isIncomplete = hasIncompleteData(lead);
    const isSelected = selectedLeadForDetails?.id === lead.id;
    const sourceIcon = getLeadSourceIcon(lead.source);
    const sourceColor = getLeadSourceColor(lead.source);
    const sourceLabel = LEAD_SOURCE_LABELS[lead.source as keyof typeof LEAD_SOURCE_LABELS] || lead.source;
    const whatsappLink = generateUnifiedWhatsAppLink(lead);

    // Check if it's a Meta Ads lead with additional data
    const isMetaAdsLead = lead.sourceData.type === 'meta_ads';
    const metaData = isMetaAdsLead ? lead.sourceData : null;

    return (
      <Card
        key={lead.id}
        draggable={!isMobile}
        onDragStart={(e) => !isMobile && handleDragStart(e, {
          id: lead.id,
          type: 'lead',
          data: lead
        })}
        onDragEnd={handleDragEnd}
        className={`
          ${isSelected ? 'bg-secondary' : 'bg-muted'} 
          text-foreground border 
          ${isIncomplete ? 'border-dashed border-orange-500/50' : (isSelected ? 'border-primary/70' : 'border-border/20')}
          rounded-[var(--radius)] transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md
          ${currentActionLead?.id === lead.id ? 'ring-1 ring-primary/70' : ''}
          ${isMobile ? 'mb-3' : ''}
          ${draggedItem?.id === lead.id ? 'opacity-50 scale-95' : ''}
          ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        onClick={() => onOpenLeadDetails(lead)}
      >
        <CardHeader className={`${isMobile ? 'p-4' : 'p-3'} space-y-3`}>
          {/* Stage Selector and Source Indicator at Top */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select 
                value={lead.stage} 
                onValueChange={(newStage) => onStageChange(lead.id, newStage as LeadStage)}
              >
                <SelectTrigger 
                  className={`w-auto min-w-[100px] ${isMobile ? 'h-8' : 'h-7'} ${isMobile ? 'text-sm' : 'text-xs'} bg-gradient-to-r ${stageColors[lead.stage as LeadStageType]} text-white border-none shadow-sm font-medium`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                    <SelectValue placeholder="Etapa" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  {LEAD_STAGES.map(s => (
                    <SelectItem key={s} value={s} className={`${isMobile ? 'text-sm' : 'text-xs'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stageColors[s].split(' ')[0]}`}></div>
                        {s}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Source Indicator */}
              <div 
                className={`flex items-center gap-1 px-2 py-1 rounded-full border ${sourceColor} ${isMobile ? 'text-xs' : 'text-[10px]'} font-medium`}
                title={`Fuente: ${sourceLabel}`}
              >
                <span className="text-sm">{sourceIcon}</span>
                {!isMobile && <span className="hidden sm:inline">{sourceLabel}</span>}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Lead Score Badge */}
              {lead.leadScore && lead.leadScore > 70 && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-200 text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  {lead.leadScore}%
                </Badge>
              )}
              
              {/* Priority Badge */}
              {lead.priority && lead.priority !== 'medium' && (
                <Badge 
                  variant={lead.priority === 'high' || lead.priority === 'urgent' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {lead.priority === 'urgent' && '🔥'}
                  {lead.priority === 'high' && '⚡'}
                  {lead.priority}
                </Badge>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                className={`${isMobile ? 'h-8 w-8' : 'h-7 w-7'} text-muted-foreground hover:text-primary`} 
                onClick={(e: React.MouseEvent) => { 
                  e.stopPropagation(); 
                  /* TODO: Open three-dot menu */ 
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lead Info */}
          <div className="flex items-start justify-between space-x-2">
            <div className="flex-grow space-y-0.5 min-w-0">
              <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-sm'} text-foreground leading-tight flex items-center truncate`} title={lead.fullName}>
                <span className="truncate">{lead.fullName}</span>
                {isIncomplete && <AlertCircle className="h-3.5 w-3.5 text-orange-400 ml-1 flex-shrink-0" />}
                {lead.status === 'archived' && <Dot className="h-5 w-5 text-gray-400 flex-shrink-0" />}
              </h3>
              
              {lead.company && (
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground truncate`} title={lead.company}>
                  {lead.company}
                </p>
              )}
              
              {lead.address?.formatted && (
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground truncate`} title={lead.address.formatted}>
                  {lead.address.formatted}
                </p>
              )}
              
              {/* Business Type and Industry */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {lead.businessType && (
                  <span className={`text-[${isMobile ? '11px' : '10px'}] px-1.5 py-0.5 bg-background text-muted-foreground rounded-full border`}>
                    {lead.businessType}
                  </span>
                )}
                {lead.status === 'archived' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    Archivado
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} border border-border/30`}>
                <AvatarImage src={featuredImage} alt={lead.fullName} data-ai-hint="business logo" />
                <AvatarFallback className="bg-background text-muted-foreground text-xs">
                  {lead.fullName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`${isMobile ? 'p-4 pt-1' : 'p-3 pt-1'}`}>
          {/* Contact Actions */}
          <div className={`flex items-center justify-start space-x-1 ${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground mb-2.5`}>
            {lead.phone && (
              <a 
                href={`tel:${lead.phone}`} 
                onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                title={`Llamar a ${lead.fullName}`} 
                className={`${isMobile ? 'p-2' : 'p-1'} hover:text-primary rounded-full hover:bg-primary/10`}
              >
                <Phone className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
              </a>
            )}
            
            {whatsappLink && (
              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                title="Enviar WhatsApp" 
                className={`${isMobile ? 'p-2' : 'p-1'} hover:text-primary rounded-full hover:bg-primary/10`}
              >
                <MessageSquareText className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
              </a>
            )}
            
            {lead.email && (
              <a 
                href={`mailto:${lead.email}`} 
                onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                title={`Enviar email a ${lead.fullName}`} 
                className={`${isMobile ? 'p-2' : 'p-1'} hover:text-primary rounded-full hover:bg-primary/10`}
              >
                <MailIconLucide className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
              </a>
            )}
            
            {lead.website && (
              <a 
                href={lead.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                title={`Visitar sitio web de ${lead.fullName}`} 
                className={`${isMobile ? 'p-2' : 'p-1'} hover:text-primary rounded-full hover:bg-primary/10`}
              >
                <ExternalLinkIcon className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
              </a>
            )}
            
            {(!lead.phone && !lead.website && !lead.email && !whatsappLink) && (
              <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground/70 italic pl-1`}>
                Sin contacto directo
              </span>
            )}
          </div>
          
          {/* Enhanced Lead Information */}
          <div className="space-y-2">
            {/* Estimated Value */}
            {lead.estimatedValue && (
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-200">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-medium text-green-800`}>
                    Valor Est.
                  </span>
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-semibold text-green-600`}>
                  {formatCurrency(lead.estimatedValue)}
                </span>
              </div>
            )}

            {/* Close Probability */}
            {lead.closeProbability && (
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-md border border-blue-200">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                  <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-medium text-blue-800`}>
                    Prob. Cierre
                  </span>
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-semibold text-blue-600`}>
                  {lead.closeProbability}%
                </span>
              </div>
            )}

            {/* Next Follow Up */}
            {lead.nextFollowUpDate && (
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-violet-50 rounded-md border border-purple-200">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-purple-600" />
                  <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-medium text-purple-800`}>
                    Seguimiento
                  </span>
                </div>
                <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-semibold text-purple-600`}>
                  {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Campaign Info for Meta Ads leads */}
            {isMetaAdsLead && metaData && (
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-md border border-indigo-200">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-indigo-600" />
                  <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-medium text-indigo-800`}>
                    Campaña
                  </span>
                </div>
                <span 
                  className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-semibold text-indigo-600 truncate max-w-24`}
                  title={metaData.campaignName}
                >
                  {metaData.campaignName}
                </span>
              </div>
            )}
          </div>
          
          {/* AI Action Buttons - Convert lead to ExtendedLead format for compatibility */}
          <div className="mt-3">
            <LeadActionButtons
              lead={{
                id: lead.id,
                uid: lead.uid,
                organizationId: lead.organizationId,
                stage: lead.stage,
                source: lead.source,
                name: lead.fullName,
                fullName: lead.fullName,
                email: lead.email || '',
                phone: lead.phone || '',
                phoneNumber: lead.phone || '',
                company: lead.company || '',
                companyName: lead.company || '',
                address: lead.address?.formatted || null,
                website: lead.website || null,
                businessType: lead.businessType || null,
                notes: lead.notes || null,
                placeId: lead.sourceData.type === 'google_places' ? lead.sourceData.placeId : null,
                images: lead.metadata.images || [],
                featured_image_url: lead.metadata.images?.find(img => img.is_featured)?.secure_url,
                campaignName: isMetaAdsLead && metaData ? metaData.campaignName : '',
                campaignId: isMetaAdsLead && metaData ? metaData.campaignId : '',
                adSetName: isMetaAdsLead && metaData ? metaData.adSetName : '',
                adSetId: isMetaAdsLead && metaData ? metaData.adSetId : '',
                adName: isMetaAdsLead && metaData ? metaData.adName : '',
                formId: isMetaAdsLead && metaData ? metaData.formId : '',
                platformId: isMetaAdsLead && metaData ? metaData.platformId : '',
                partnerName: isMetaAdsLead && metaData ? metaData.partnerName || '' : '',
                isOrganic: isMetaAdsLead && metaData ? (metaData.isOrganic ? 'true' : 'false') : 'false',
                customDisclaimerResponses: isMetaAdsLead && metaData ? metaData.customResponses || '' : '',
                retailerItemId: isMetaAdsLead && metaData ? metaData.retailerItemId || '' : '',
                leadId: lead.leadId,
                dateCreated: isMetaAdsLead && metaData ? metaData.dateCreated || lead.sourceCreatedAt || lead.createdAt : lead.sourceCreatedAt || lead.createdAt,
                updatedAt: lead.updatedAt,
                vehicle: lead.interests?.vehicle?.type || '',
                homeListing: lead.interests?.property?.location || '',
                visitRequest: lead.interests?.visitRequested ? 'yes' : 'no',
                createdAt: lead.createdAt
              }}
              onGenerateWelcomeMessage={() => onGenerateWelcomeMessage(lead)}
              onEvaluateBusiness={() => onEvaluateBusiness(lead)}
              onGenerateSalesRecommendations={() => onGenerateSalesRecommendations(lead)}
              onGenerateSolutionEmail={() => onGenerateSolutionEmail(lead)}
              isActionLoading={isActionLoading && currentActionLead?.id === lead.id}
              currentActionLead={currentActionLead ? {
                id: currentActionLead.id,
                uid: currentActionLead.uid,
                organizationId: currentActionLead.organizationId,
                stage: currentActionLead.stage,
                source: currentActionLead.source,
                name: currentActionLead.fullName,
                fullName: currentActionLead.fullName,
                email: currentActionLead.email || '',
                phone: currentActionLead.phone || '',
                phoneNumber: currentActionLead.phone || '',
                company: currentActionLead.company || '',
                companyName: currentActionLead.company || '',
                address: currentActionLead.address?.formatted || null,
                website: currentActionLead.website || null,
                businessType: currentActionLead.businessType || null,
                notes: currentActionLead.notes || null,
                placeId: currentActionLead.sourceData.type === 'google_places' ? currentActionLead.sourceData.placeId : null,
                images: currentActionLead.metadata.images || [],
                featured_image_url: currentActionLead.metadata.images?.find(img => img.is_featured)?.secure_url,
                campaignName: '',
                campaignId: '',
                adSetName: '',
                adSetId: '',
                adName: '',
                formId: '',
                platformId: '',
                partnerName: '',
                isOrganic: 'false',
                customDisclaimerResponses: '',
                retailerItemId: '',
                leadId: currentActionLead.leadId,
                dateCreated: currentActionLead.sourceCreatedAt || currentActionLead.createdAt,
                updatedAt: currentActionLead.updatedAt,
                vehicle: '',
                homeListing: '',
                visitRequest: 'no',
                createdAt: currentActionLead.createdAt
              } : null}
              currentActionType={currentActionType}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mobile view with tabs/swipe
  if (isMobile) {
    return (
      <div className="w-full">
        {/* Mobile navigation with swipe indicators */}
        <div className="flex items-center justify-between mb-4 bg-card rounded-lg p-3 border">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={prevStage}
            disabled={currentStageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 text-center">
            <h3 className="font-semibold text-foreground">{LEAD_STAGES[currentStageIndex]}</h3>
            <p className="text-sm text-muted-foreground">
              {leads.filter(lead => lead.stage === LEAD_STAGES[currentStageIndex]).length} leads
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={nextStage}
            disabled={currentStageIndex === LEAD_STAGES.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stage indicators */}
        <div className="flex justify-center space-x-2 mb-4">
          {LEAD_STAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStageIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Current stage content */}
        <div className="space-y-3">
          {leads.filter(lead => lead.stage === LEAD_STAGES[currentStageIndex]).length === 0 ? (
            <div className="flex items-center justify-center h-32 bg-card rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground text-center">No hay leads en esta etapa.</p>
            </div>
          ) : (
            leads.filter(lead => lead.stage === LEAD_STAGES[currentStageIndex]).map(renderLeadCard)
          )}
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-x-5 gap-y-5 px-1 pb-4">
        {LEAD_STAGES.map(stage => (
          <div 
            key={stage} 
            className="flex-shrink-0 w-full inline-block align-top"
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage, handleLeadDrop)}
          >
            <Card className={`
              bg-card border-border/30 shadow-none min-h-[300px] max-h-[80vh] flex flex-col rounded-[var(--radius)]
              ${dropTarget === stage ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
              transition-all duration-200
            `}>
              <CardHeader className="pb-3 pt-4 px-4 sticky top-0 bg-card z-10 border-b border-border/20 rounded-t-[var(--radius)]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className={`mr-2.5 h-2.5 w-2.5 rounded-full ${stageColors[stage].split(' ')[0]}`}></span>
                    <CardTitle className="text-base font-semibold text-foreground">{stage}</CardTitle>
                  </div>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({leads.filter(lead => lead.stage === stage).length})
                  </span>
                </div>
                
                {/* Stage Value Summary */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/10 p-3 rounded-lg border border-primary/20 backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => toggleStageLabel(stage, e)}
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title={showFullStageLabel[stage] ? "Clic para mostrar acrónimo" : "Clic para mostrar nombre completo"}
                    >
                      {showFullStageLabel[stage] ? "Valor Proyectado:" : "VP:"}
                    </button>
                    <p className="text-sm font-bold text-primary">
                      {(() => {
                        const stageLeads = leads.filter(lead => lead.stage === stage);
                        const total = stageLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
                        return formatCurrency(total);
                      })()}
                    </p>
                  </div>
                  
                  {/* Lead Score Average */}
                  {(() => {
                    const stageLeads = leads.filter(lead => lead.stage === stage && lead.leadScore);
                    if (stageLeads.length > 0) {
                      const avgScore = stageLeads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0) / stageLeads.length;
                      return (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">
                            Avg Score: {Math.round(avgScore)}%
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 flex-1 overflow-y-auto p-3 pt-3 max-h-[calc(80vh-140px)]">
                {leads.filter(lead => lead.stage === stage).length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground text-center">No hay leads en esta etapa.</p>
                  </div>
                )}
                {leads.filter(lead => lead.stage === stage).map(renderLeadCard)}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}