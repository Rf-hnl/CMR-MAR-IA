"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Phone, MessageSquareText, Globe, Mail as MailIconLucide, BrainCircuit, Lightbulb, Zap, MoreVertical, Trash2, Edit2, Eye, PackageSearch, Mail, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ExtendedLead as Lead } from '@/types';

interface LeadActionsProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onViewDetails: (lead: Lead) => void;
  onGenerateWelcomeMessage: (lead: Lead) => void;
  onEvaluateBusiness: (lead: Lead) => void;
  onGenerateSalesRecommendations: (lead: Lead) => void;
  onGenerateSolutionEmail: (lead: Lead) => void;
  onGenerateQuote: (lead: Lead) => void;
  isProcessing?: boolean;
}

export default function LeadActions({ 
  lead, 
  onEdit, 
  onDelete, 
  onViewDetails,
  onGenerateWelcomeMessage,
  onEvaluateBusiness,
  onGenerateSalesRecommendations,
  onGenerateSolutionEmail,
  onGenerateQuote,
  isProcessing = false
}: LeadActionsProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCall = () => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, '_blank');
    } else {
      toast({
        title: "Teléfono no disponible",
        description: "Este lead no tiene un número de teléfono asociado.",
        variant: "destructive"
      });
    }
  };

  const handleWhatsApp = () => {
    if (lead.phone) {
      const phoneNumber = lead.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    } else {
      toast({
        title: "Teléfono no disponible",
        description: "Este lead no tiene un número de teléfono para WhatsApp.",
        variant: "destructive"
      });
    }
  };

  const handleEmail = () => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_blank');
    } else {
      toast({
        title: "Email no disponible",
        description: "Este lead no tiene un email asociado.",
        variant: "destructive"
      });
    }
  };

  const handleWebsite = () => {
    if (lead.website) {
      window.open(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`, '_blank');
    } else {
      toast({
        title: "Sitio web no disponible",
        description: "Este lead no tiene un sitio web asociado.",
        variant: "destructive"
      });
    }
  };

  const isContactDisabled = !lead.phone && !lead.email && !lead.website;

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCall}
          disabled={!lead.phone}
          title="Llamar"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWhatsApp}
          disabled={!lead.phone}
          title="WhatsApp"
        >
          <MessageSquareText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWebsite}
          disabled={!lead.website}
          title="Sitio web"
        >
          <Globe className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEmail}
          disabled={!lead.email}
          title="Email"
        >
          <MailIconLucide className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(lead)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => onGenerateWelcomeMessage(lead)}
              disabled={isProcessing || isContactDisabled}
            >
              <BrainCircuit className="h-4 w-4 mr-2" />
              Generar mensaje de bienvenida
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onEvaluateBusiness(lead)}
              disabled={isProcessing}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Evaluar negocio
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onGenerateSalesRecommendations(lead)}
              disabled={isProcessing}
            >
              <PackageSearch className="h-4 w-4 mr-2" />
              Recomendar productos
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onGenerateSolutionEmail(lead)}
              disabled={isProcessing}
            >
              <Mail className="h-4 w-4 mr-2" />
              Generar email configuración TPV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onGenerateQuote(lead)}
              disabled={isProcessing}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Generar cotización
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar lead?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a {lead.name || 'este lead'}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(lead.id);
                setShowDeleteDialog(false);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}