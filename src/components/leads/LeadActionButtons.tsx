"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from 'lucide-react';
import type { ExtendedLead as Lead } from '@/types';
import { stageColors, stageIndicatorColors } from '@/lib/leads-utils';
import AIActionsModal from './AIActionsModal';

interface LeadActionButtonsProps {
  lead: Lead;
  onGenerateWelcomeMessage: (lead: Lead) => void;
  onEvaluateBusiness: (lead: Lead) => void;
  onGenerateSalesRecommendations: (lead: Lead) => void;
  onGenerateSolutionEmail: (lead: Lead) => void;
  onGenerateQuote: (lead: Lead) => void;
  onGenerateBillingQuote?: (lead: Lead) => void;
  onGenerateHybridQuote?: (lead: Lead) => void;
  currentActionLead: Lead | null; // Allow null for initial state
  isActionLoading: boolean;
  currentActionType: string | null; // Allow null for initial state
}

export default function LeadActionButtons({
  lead,
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
}: LeadActionButtonsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isCurrentlyProcessing = currentActionLead?.id === lead.id && isActionLoading;

  const getCurrentAction = () => {
    const actions = [
      { id: 'welcome', label: 'Mensaje de Bienvenida' },
      { id: 'evaluate', label: 'Evaluar Negocio' },
      { id: 'recommend', label: 'Recomendaciones' },
      { id: 'solution-email', label: 'Email de Configuración' },
      { id: 'quote', label: 'Generar Cotización' },
      { id: 'billing-quote', label: 'Cotización PandaDoc' },
      { id: 'hybrid-quote', label: 'Cotización Híbrida' }
    ];
    return actions.find(action => action.id === currentActionType);
  };

  const currentAction = getCurrentAction();

  return (
    <div className="space-y-2">
      {/* Botón principal que abre el modal */}
      <Button
        variant="outline"
        size="sm"
        className={`w-full h-8 text-xs transition-all duration-200 border-2 ${
          isCurrentlyProcessing 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-md' 
            : `bg-gradient-to-r ${stageColors[lead.stage as keyof typeof stageColors]} border-transparent shadow-sm hover:shadow-md hover:scale-[1.02]`
        }`}
        onClick={(e) => {
          e.stopPropagation(); // Evitar que se abra el modal de detalles
          setIsModalOpen(true);
        }}
        disabled={isCurrentlyProcessing}
      >
        {isCurrentlyProcessing && currentAction ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="truncate">{currentAction.label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full justify-center">
            <Sparkles className="h-3 w-3 drop-shadow-sm" />
            <span className="font-medium">Acciones IA</span>
          </div>
        )}
      </Button>

      {/* Modal de acciones de IA */}
      <AIActionsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        lead={lead}
        onGenerateWelcomeMessage={onGenerateWelcomeMessage}
        onEvaluateBusiness={onEvaluateBusiness}
        onGenerateSalesRecommendations={onGenerateSalesRecommendations}
        onGenerateSolutionEmail={onGenerateSolutionEmail}
        onGenerateQuote={onGenerateQuote}
        onGenerateBillingQuote={onGenerateBillingQuote}
        onGenerateHybridQuote={onGenerateHybridQuote}
        currentActionLead={currentActionLead}
        isActionLoading={isActionLoading}
        currentActionType={currentActionType}
      />
    </div>
  );
}
