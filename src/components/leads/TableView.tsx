// components/leads/TableView.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { AlertCircle, Dot, Phone, MessageSquareText, Mail, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { ExtendedLead as Lead } from '@/types';

// Define LeadStage type based on your LEAD_STAGES if not exported from '@/types'
type LeadStage = (typeof LEAD_STAGES)[number];
import { LEAD_STAGES, stageColors, LOCAL_FALLBACK_SOURCE } from '@/lib/leads-utils';
import LeadActionButtons from './LeadActionButtons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { isFieldMissing, generateWhatsAppLink } from '@/lib/leads-utils';
import { useValuationConfig } from '@/hooks/useValuationConfig';
import { calculateLeadValuation, formatCurrency, getValueColor } from '@/lib/valuation-calculator';


interface TableViewProps {
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
}

export default function TableView({
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
}: TableViewProps) {
  const { activeConfig } = useValuationConfig();
  return (
    <div className="p-0">
      <Card className="border-border/30 bg-card text-card-foreground rounded-[var(--radius)] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto"> 
            <Table className="min-w-full"> 
              <TableHeader>
                <TableRow className="border-b-border/20 hover:bg-muted/10">
                  <TableHead className="text-muted-foreground w-[60px] pl-4">Avatar</TableHead>
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="hidden md:table-cell text-muted-foreground">Dirección</TableHead>
                  <TableHead className="text-muted-foreground">Etapa</TableHead>
                  <TableHead className="text-muted-foreground">Valor</TableHead>
                  <TableHead className="hidden sm:table-cell text-muted-foreground">Actualizado</TableHead>
                  <TableHead className="text-muted-foreground">Contacto</TableHead>
                  <TableHead className="text-muted-foreground text-right pr-4 whitespace-nowrap">Acciones y Etapa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                      No has guardado ningún lead todavía o no coinciden con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
                {leads.map(lead => {
                  const featuredImage = lead.images?.find(img => img.is_featured)?.secure_url;
                  const isImported = lead.source === 'xml_import_ia' || lead.source === 'csv_import_ia';
                  const isImportedIncomplete = isImported && (
                      isFieldMissing(lead.address) || isFieldMissing(lead.businessType) ||
                      isFieldMissing(lead.company) || isFieldMissing(lead.website)
                  );
                  const isLocal = lead.source === LOCAL_FALLBACK_SOURCE || (lead.source.includes('_import_ia') && !lead.placeId && !lead.id.startsWith('local_firebase_id_'));
                  
                  return (
                  <TableRow key={lead.id} className={`${isLocal ? 'bg-yellow-900/10 hover:bg-yellow-900/20' : 'hover:bg-muted/5'} ${isImportedIncomplete ? 'border-l-2 border-orange-600/70' : ''} border-b-border/20`}>
                    <TableCell className="pl-4 py-2">
                      <Avatar className="h-9 w-9 border border-border/30">
                        <AvatarImage src={featuredImage} alt={lead.name} data-ai-hint="business logo" />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {lead.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-foreground py-2">
                      <div className="flex items-center">
                        <span className="hover:text-primary hover:underline cursor-pointer truncate" title={lead.name} onClick={() => onOpenLeadDetails(lead)}>{lead.name}</span>
                        {isLocal && <Dot className="h-5 w-5 text-yellow-400 flex-shrink-0"  />}
                        {isImportedIncomplete && <AlertCircle className="h-4 w-4 text-orange-400 ml-1.5 flex-shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs max-w-xs truncate text-muted-foreground py-2" title={isFieldMissing(lead.address) ? undefined : lead.address!}>{isFieldMissing(lead.address) ? 'N/A' : lead.address}</TableCell>
                    <TableCell className="py-2">
                      <span className={`px-2 py-1 text-xs rounded-md font-medium whitespace-nowrap ${stageColors[lead.stage as keyof typeof stageColors] || 'bg-muted text-muted-foreground'}`}>
                        {lead.stage}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      {activeConfig ? (
                        <span className={`font-semibold text-sm ${getValueColor(calculateLeadValuation(lead, activeConfig).totalValue, lead.stage)}`}>
                          {formatCurrency(calculateLeadValuation(lead, activeConfig).totalValue)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">$0.00</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground py-2 whitespace-nowrap">
                      {format(
                        lead.updatedAt instanceof Date
                          ? lead.updatedAt
                          : (typeof lead.updatedAt === 'object' && 'toDate' in lead.updatedAt)
                            ? lead.updatedAt.toDate()
                            : new Date(lead.updatedAt),
                        "dd MMM yyyy, HH:mm",
                        { locale: es }
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center space-x-1">
                        {!isFieldMissing(lead.phone) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                            <a href={`tel:${lead.phone}`} title={`Llamar a ${lead.name}`}><Phone className="h-4 w-4" /></a>
                          </Button>
                        )}
                        {generateWhatsAppLink(lead) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                            <a href={generateWhatsAppLink(lead)!} target="_blank" rel="noopener noreferrer" title="Enviar WhatsApp"><MessageSquareText className="h-4 w-4" /></a>
                          </Button>
                        )}
                        {!isFieldMissing(lead.email) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                            <a href={`mailto:${lead.email}`} title={`Email a ${lead.name}`}><Mail className="h-4 w-4" /></a>
                          </Button>
                        )}
                        {!isFieldMissing(lead.website) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" asChild>
                            <a href={lead.website!} target="_blank" rel="noopener noreferrer" title={`Visitar sitio web de ${lead.name}`}><ExternalLinkIcon className="h-4 w-4" /></a>
                          </Button>
                        )}
                        {(isFieldMissing(lead.phone) && isFieldMissing(lead.website) && isFieldMissing(lead.email) && !generateWhatsAppLink(lead)) && <span className="text-xs text-muted-foreground">N/D</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4 py-2 space-y-1">
                      <div className="min-w-[150px]"> 
                        <Select value={lead.stage} onValueChange={(newStage) => onStageChange(lead.id, newStage as LeadStage)}>
                            <SelectTrigger className="w-full h-8 text-xs bg-input text-foreground focus:ring-primary rounded-[var(--radius)]">
                              <SelectValue placeholder="Cambiar etapa" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                              {LEAD_STAGES.map(s => (
                                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>
                      <div className="flex justify-end"> 
                          <LeadActionButtons
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
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
