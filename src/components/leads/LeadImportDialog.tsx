"use client";

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FileUp, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import type { ExtendedLead } from '@/types';
import { convertMetaLeadToExtended } from '@/lib/lead-converter';
import { XmlImportFormatter, CsvImportFormatter } from '@/types/formatters/import-formatter';

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (leads: ExtendedLead[]) => void;
  formatXmlLeads?: (input: any) => Promise<any>;
  formatCsvLeads?: (input: any) => Promise<any>;
}

export default function LeadImportDialog({
  open,
  onOpenChange,
  onImportComplete,
  formatXmlLeads,
  formatCsvLeads
}: LeadImportDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user || !currentOrganization) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado para importar leads.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingImport(true);
    setImportError(null);

    try {
      const text = await file.text();
      const isXml = file.name.toLowerCase().endsWith('.xml');
      const isCsv = file.name.toLowerCase().endsWith('.csv');

      if (!isXml && !isCsv) {
        throw new Error("Por favor selecciona un archivo XML o CSV");
      }

      let processedLeads: ExtendedLead[] = [];

      if (isXml && formatXmlLeads) {
        const result = await formatXmlLeads({ xmlContent: text });
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.leads || result.leads.length === 0) {
          throw new Error("No se encontraron leads válidos en el archivo XML");
        }

        // Use the XML formatter to convert to MetaLeadAdsModel
        const xmlFormatter = new XmlImportFormatter(user.uid, currentOrganization.id);
        
        processedLeads = result.leads.map((lead: any) => {
          const formatResult = xmlFormatter.format(lead);
          if (!formatResult.success || !formatResult.data) {
            throw new Error(`Error al formatear lead: ${formatResult.error}`);
          }
          
          // Convert MetaLeadAdsModel to ExtendedLead
          const metaLeadWithId = {
            ...formatResult.data,
            id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          
          return convertMetaLeadToExtended(
            metaLeadWithId,
            user.uid,
            currentOrganization.id,
            lead.suggestedStage || 'Nuevo'
          );
        });
      } else if (isCsv && formatCsvLeads) {
        const result = await formatCsvLeads({ csvContent: text });
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.leads || result.leads.length === 0) {
          throw new Error("No se encontraron leads válidos en el archivo CSV");
        }

        // Use the CSV formatter to convert to MetaLeadAdsModel
        const csvFormatter = new CsvImportFormatter(user.uid, currentOrganization.id);
        
        processedLeads = result.leads.map((lead: any) => {
          const formatResult = csvFormatter.format(lead);
          if (!formatResult.success || !formatResult.data) {
            throw new Error(`Error al formatear lead: ${formatResult.error}`);
          }
          
          // Convert MetaLeadAdsModel to ExtendedLead
          const metaLeadWithId = {
            ...formatResult.data,
            id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          
          return convertMetaLeadToExtended(
            metaLeadWithId,
            user.uid,
            currentOrganization.id,
            lead.suggestedStage || 'Nuevo'
          );
        });
      }

      if (processedLeads.length > 0) {
        onImportComplete(processedLeads);
        toast({
          title: "Importación exitosa",
          description: `Se importaron ${processedLeads.length} leads correctamente.`
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error importing file:", error);
      setImportError(error.message || "Error al procesar el archivo");
      toast({
        title: "Error en la importación",
        description: error.message || "No se pudo procesar el archivo",
        variant: "destructive"
      });
    } finally {
      setIsProcessingImport(false);
      // Reset input
      event.target.value = '';
    }
  }, [formatXmlLeads, formatCsvLeads, onImportComplete, onOpenChange, toast, user, currentOrganization]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Selecciona un archivo XML o CSV con información de leads para importar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
            <label htmlFor="file-import" className="cursor-pointer">
              <Button 
                variant="outline" 
                disabled={isProcessingImport}
                asChild
              >
                <span>
                  {isProcessingImport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Seleccionar archivo"
                  )}
                </span>
              </Button>
            </label>
            <input
              id="file-import"
              type="file"
              accept=".xml,.csv"
              onChange={handleFileImport}
              className="hidden"
              disabled={isProcessingImport}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Formatos soportados: XML, CSV
            </p>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>
              Los leads importados se procesarán con IA para extraer y formatear la información automáticamente.
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isProcessingImport}>
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}