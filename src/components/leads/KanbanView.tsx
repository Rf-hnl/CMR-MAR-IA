// components/leads/KanbanView.tsx
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreVertical, AlertCircle, Dot, Phone, MessageSquareText, Mail as MailIconLucide, ExternalLink as ExternalLinkIcon, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useState } from 'react';
import type { ExtendedLead as Lead } from '@/types';

// Define LeadStage type based on LEAD_STAGES if not exported from '@/types'
type LeadStage = (typeof LEAD_STAGES)[number];
import { LEAD_STAGES, stageColors, stageIndicatorColors, stageColumnColors, stageBorderColors, stageCardBackgrounds, LOCAL_FALLBACK_SOURCE } from '@/lib/leads-utils';
import LeadActionButtons from './LeadActionButtons'; 
import { isFieldMissing, generateWhatsAppLink } from '@/lib/leads-utils';
import { useValuationConfig } from '@/hooks/useValuationConfig';
import { calculateLeadValuation, calculateStageTotal, formatCurrency } from '@/lib/valuation-calculator';
import { getLeadSourceIcon, getLeadSourceColor } from '@/lib/lead-converter';
import { getLeadSourceFromString, LEAD_SOURCE_LABELS } from '@/types/formatters/lead-sources';

interface KanbanViewProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: LeadStage) => void;
  onOpenLeadDetails: (lead: Lead) => void;
  // AI Action Props
  onGenerateWelcomeMessage: (lead: Lead) => void;
  onEvaluateBusiness: (lead: Lead) => void;
  onGenerateSalesRecommendations: (lead: Lead) => void;
  onGenerateSolutionEmail: (lead: Lead) => void;
  onGenerateQuote: (lead: Lead) => void;
  onGenerateBillingQuote?: (lead: Lead) => void;
  onGenerateHybridQuote?: (lead: Lead) => void;
  currentActionLead: Lead | null;
  isActionLoading: boolean;
  currentActionType: string | null;
  selectedLeadForDetails: Lead | null; 
}

export default function KanbanView({
  leads,
  onStageChange,
  onOpenLeadDetails,
  onGenerateWelcomeMessage,
  onEvaluateBusiness,
  onGenerateSalesRecommendations,
  onGenerateSolutionEmail,
  onGenerateQuote,
  onGenerateBillingQuote,
  onGenerateHybridQuote,
  currentActionLead,
  isActionLoading,
  currentActionType,
  selectedLeadForDetails,
}: KanbanViewProps) {
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

  // Render lead card (shared between mobile and desktop)
  const renderLeadCard = (lead: Lead) => {
    const featuredImage = lead.images?.find(img => img.is_featured)?.secure_url;
    const isImported = lead.source === 'xml_import_ia' || lead.source === 'csv_import_ia';
    const isImportedIncomplete = isImported && (
        isFieldMissing(lead.address) || isFieldMissing(lead.businessType) ||
        isFieldMissing(lead.company) || isFieldMissing(lead.website)
    );
    const isLocal = lead.source === LOCAL_FALLBACK_SOURCE || (lead.source.includes('_import_ia') && !lead.placeId && !lead.id.startsWith('local_firebase_id_'));
    const isSelected = selectedLeadForDetails?.id === lead.id;
    
    // Get source information
    const sourceIcon = getLeadSourceIcon(lead.source);
    const sourceColor = getLeadSourceColor(lead.source);
    const sourceLabel = LEAD_SOURCE_LABELS[getLeadSourceFromString(lead.source)];

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
          bg-gradient-to-b ${stageCardBackgrounds[lead.stage as LeadStage]} 
          text-foreground border-2 
          ${isImportedIncomplete ? 'border-dashed border-orange-500/50' : (isSelected ? 'border-primary/70' : `${stageBorderColors[lead.stage as LeadStage]}`)}
          rounded-[var(--radius)] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg
          ${currentActionLead?.id === lead.id ? 'ring-2 ring-primary/70' : ''}
          ${isMobile ? 'mb-3' : ''}
          ${draggedItem?.id === lead.id ? 'opacity-50 scale-95' : ''}
          ${!isMobile ? 'cursor-grab active:cursor-grabbing hover:scale-[1.02]' : ''}
        `}
        onClick={() => onOpenLeadDetails(lead)}
      >
        <CardHeader className={`${isMobile ? 'p-4' : 'p-3'} space-y-3`}>
          {/* Stage Selector and Source Indicator at Top */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={lead.stage} onValueChange={(newStage) => onStageChange(lead.id, newStage as LeadStage)}>
                <SelectTrigger 
                  className={`w-auto min-w-[100px] ${isMobile ? 'h-8' : 'h-7'} ${isMobile ? 'text-sm' : 'text-xs'} bg-gradient-to-r ${stageColors[lead.stage as LeadStage]} border-none shadow-sm font-medium`}
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
                        <div className={`w-2 h-2 rounded-full ${stageIndicatorColors[s]}`}></div>
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
            
            <Button variant="ghost" size="icon" className={`${isMobile ? 'h-8 w-8' : 'h-7 w-7'} text-muted-foreground hover:text-primary`} onClick={(e: React.MouseEvent) => { e.stopPropagation(); /* TODO: Open three-dot menu */ }}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Lead Info */}
          <div className="flex items-start justify-between space-x-2">
            <div className="flex-grow space-y-0.5 min-w-0">
                <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-sm'} text-foreground leading-tight flex items-center truncate`} title={lead.name}>
                  <span className="truncate">{lead.name}</span>
                  {isLocal && <Dot className="h-5 w-5 text-yellow-400 flex-shrink-0"  />}
                  {isImportedIncomplete && <AlertCircle className="h-3.5 w-3.5 text-orange-400 ml-1 flex-shrink-0" />}
                </h3>
                {!isFieldMissing(lead.company) && <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground truncate`} title={lead.company!}>{lead.company}</p>}
                {!isFieldMissing(lead.address) && <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground truncate`} title={lead.address!}>{lead.address}</p>}
                
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {isLocal && <span className={`text-[${isMobile ? '11px' : '10px'}] px-1.5 py-0.5 bg-background text-muted-foreground rounded-full`}>Local</span>}
                  {isImported && <span className={`text-[${isMobile ? '11px' : '10px'}] px-1.5 py-0.5 bg-background text-muted-foreground rounded-full`}>Importado</span>}
                </div>
            </div>
            <div className="flex-shrink-0">
                <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} border border-border/30`}>
                  <AvatarImage src={featuredImage} alt={lead.name} data-ai-hint="business logo" />
                  <AvatarFallback className="bg-background text-muted-foreground text-xs">
                    {lead.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`${isMobile ? 'p-4 pt-1' : 'p-3 pt-1'}`}>
          <div className={`flex items-center justify-start space-x-1 ${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground mb-2.5`}>
              {!isFieldMissing(lead.phone) && (
                  <a href={`tel:${lead.phone}`} onClick={(e: React.MouseEvent) => e.stopPropagation()} title={`Llamar a ${lead.name}`} className={`${isMobile ? 'p-2' : 'p-1'} hover:text-primary rounded-full hover:bg-primary/10`}>
                      <Phone className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                  </a>
              )}
              {generateWhatsAppLink(lead) && ( 
                  <a href={generateWhatsAppLink(lead)!} target="_blank" rel="noopener noreferrer" onClick={(e: React.MouseEvent) => e.stopPropagation()} title="Enviar WhatsApp" className={`${isMobile ? 'p-2' : 'p-1'} hover:text-primary rounded-full hover:bg-primary/10`}>
                      <MessageSquareText className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                  </a>
              )}
              {!isFieldMissing(lead.email) && (
                  <a href={`mailto:${lead.email}`} onClick={(e: React.MouseEvent) => e.stopPropagation()} title={`Enviar email a ${lead.name}`} className={`${isMobile ? 'p-2' : 'p-1'} hover:text-primary rounded-full hover:bg-primary/10`}>
                      <MailIconLucide className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                  </a>
              )}
              {!isFieldMissing(lead.website) && (
                  <a href={lead.website!} target="_blank" rel="noopener noreferrer" onClick={(e: React.MouseEvent) => e.stopPropagation()} title={`Visitar sitio web de ${lead.name}`} className={`${isMobile ? 'p-2' : 'p-1'} hover:text-primary rounded-full hover:bg-primary/10`}>
                      <ExternalLinkIcon className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                  </a>
              )}
              {(isFieldMissing(lead.phone) && isFieldMissing(lead.website) && isFieldMissing(lead.email) && !generateWhatsAppLink(lead)) && <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground/70 italic pl-1`}>Sin contacto directo</span>}
            </div>
            
            {/* Valor unitario del lead */}
            {activeConfig && (
              <div className={`mb-2.5 p-2 bg-gradient-to-r ${stageCardBackgrounds[lead.stage as LeadStage]} rounded-md border ${stageBorderColors[lead.stage as LeadStage].split(' ')[0]} backdrop-blur-sm`}>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => toggleValueLabel(lead.id, e)}
                    className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer`}
                    title={showFullLabel[lead.id] ? "Clic para mostrar acrónimo" : "Clic para mostrar nombre completo"}
                  >
                    {showFullLabel[lead.id] ? "Valor Unitario:" : "VU:"}
                  </button>
                  <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} font-semibold text-foreground`}>
                    {calculateLeadValuation(lead, activeConfig).formattedValue}
                  </span>
                </div>
              </div>
            )}
            
<LeadActionButtons
  lead={lead}
  onGenerateWelcomeMessage={() => onGenerateWelcomeMessage(lead)}
  onEvaluateBusiness={() => onEvaluateBusiness(lead)}
  onGenerateSalesRecommendations={() => onGenerateSalesRecommendations(lead)}
  onGenerateSolutionEmail={() => onGenerateSolutionEmail(lead)}
  onGenerateQuote={() => onGenerateQuote(lead)}
  onGenerateBillingQuote={onGenerateBillingQuote ? () => onGenerateBillingQuote(lead) : undefined}
  onGenerateHybridQuote={onGenerateHybridQuote ? () => onGenerateHybridQuote(lead) : undefined}
  isActionLoading={isActionLoading && currentActionLead?.id === lead.id}
  currentActionLead={currentActionLead}
  currentActionType={currentActionType}
/>
          </CardContent>
      </Card>
    );
  };

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

  // Desktop view (original)
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-5 px-1 pb-4">
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
              bg-gradient-to-b ${stageColumnColors[stage]} border-border/30 shadow-none min-h-[300px] max-h-[80vh] flex flex-col rounded-[var(--radius)]
              ${dropTarget === stage ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
              transition-all duration-200
            `}>
              <CardHeader className={`pb-3 pt-4 px-4 sticky top-0 bg-gradient-to-b ${stageColumnColors[stage]} z-10 border-b border-border/20 rounded-t-[var(--radius)]`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className={`mr-2.5 h-2.5 w-2.5 rounded-full ${stageIndicatorColors[stage]}`}></span>
                    <CardTitle className="text-base font-semibold text-foreground">{stage}</CardTitle>
                  </div>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({leads.filter(lead => lead.stage === stage).length})
                  </span>
                </div>
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
                      {activeConfig ? formatCurrency(calculateStageTotal(leads, stage, activeConfig)) : '$0'}
                    </p>
                  </div>
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
