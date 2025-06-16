"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  AlertTriangle, 
  Trash2, 
  Crown, 
  Calendar,
  Mail,
  Phone,
  Building,
  Target
} from 'lucide-react';
import type { UnifiedLead } from '@/types/data-sources';

interface DuplicateGroup {
  leads: UnifiedLead[];
  duplicateField: string;
}

interface DuplicateDetectorProps {
  leads: UnifiedLead[];
  onDuplicatesResolved: (remainingLeads: UnifiedLead[]) => void;
  onReloadData?: () => void; // Función para recargar datos del servidor
}

export default function DuplicateDetector({ leads, onDuplicatesResolved, onReloadData }: DuplicateDetectorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeadToKeep, setSelectedLeadToKeep] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Detectar duplicados cuando cambian los leads
  useEffect(() => {
    const detected = detectDuplicates(leads);
    setDuplicateGroups(detected);
    
    if (detected.length > 0) {
      setCurrentGroupIndex(0);
      setShowModal(true);
      setSelectedLeadToKeep(null);
    }
  }, [leads]);

  /**
   * Detecta leads duplicados (idénticos excepto por ID)
   */
  function detectDuplicates(leads: UnifiedLead[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < leads.length; i++) {
      if (processed.has(leads[i].id)) continue;

      const duplicates = [leads[i]];
      processed.add(leads[i].id);

      // Buscar duplicados del lead actual
      for (let j = i + 1; j < leads.length; j++) {
        if (processed.has(leads[j].id)) continue;

        if (areLeadsDuplicate(leads[i], leads[j])) {
          duplicates.push(leads[j]);
          processed.add(leads[j].id);
        }
      }

      // Si encontramos duplicados, agregar al grupo
      if (duplicates.length > 1) {
        groups.push({
          leads: duplicates,
          duplicateField: getDuplicateReason(leads[i], duplicates[1])
        });
      }
    }

    return groups;
  }

  /**
   * Verifica si dos leads son duplicados (idénticos excepto ID)
   */
  function areLeadsDuplicate(lead1: UnifiedLead, lead2: UnifiedLead): boolean {
    // Comparar campos principales
    const fieldsToCompare = [
      'name', 'email', 'phone', 'company',
      'campaignId', 'adSetId', 'formId'
    ];

    let matchingFields = 0;
    const totalFields = fieldsToCompare.length;

    for (const field of fieldsToCompare) {
      const value1 = (lead1 as any)[field]?.toString().toLowerCase().trim();
      const value2 = (lead2 as any)[field]?.toString().toLowerCase().trim();
      
      if (value1 && value2 && value1 === value2) {
        matchingFields++;
      } else if (!value1 && !value2) {
        matchingFields++; // Ambos vacíos también cuenta como coincidencia
      }
    }

    // Considerar duplicado si coinciden al menos 80% de los campos
    return (matchingFields / totalFields) >= 0.8;
  }

  /**
   * Determina la razón por la cual se consideran duplicados
   */
  function getDuplicateReason(lead1: UnifiedLead, lead2: UnifiedLead): string {
    if (lead1.email === lead2.email && lead1.phone === lead2.phone) {
      return 'Email y teléfono idénticos';
    }
    if (lead1.email === lead2.email) {
      return 'Email idéntico';
    }
    if (lead1.phone === lead2.phone) {
      return 'Teléfono idéntico';
    }
    if (lead1.name === lead2.name && lead1.company === lead2.company) {
      return 'Nombre y empresa idénticos';
    }
    return 'Múltiples campos coincidentes';
  }

  /**
   * Calcula una puntuación de relevancia para un lead
   */
  function calculateRelevanceScore(lead: UnifiedLead): number {
    let score = 0;

    // Campos de contacto completos
    if (lead.email) score += 25;
    if (lead.phone) score += 25;
    if (lead.company) score += 15;
    if (lead.name) score += 10;

    // Información de Meta Ads
    if (lead.metadata?.campaignName) score += 10;
    if (lead.metadata?.adSetName) score += 5;
    if (lead.value && lead.value > 0) score += 10;

    return score;
  }

  /**
   * Determina el lead más relevante automáticamente
   */
  function getBestLead(leads: UnifiedLead[]): UnifiedLead {
    return leads.reduce((best, current) => {
      const bestScore = calculateRelevanceScore(best);
      const currentScore = calculateRelevanceScore(current);
      
      // Si tienen la misma puntuación, preferir el más reciente
      if (currentScore > bestScore) {
        return current;
      } else if (currentScore === bestScore) {
        const bestDate = new Date(best.createdAt || 0);
        const currentDate = new Date(current.createdAt || 0);
        return currentDate > bestDate ? current : best;
      }
      
      return best;
    });
  }

  /**
   * Resuelve el grupo actual de duplicados
   */
  async function resolveCurrentGroup() {
    if (!selectedLeadToKeep || processing || !user) return;

    setProcessing(true);

    const currentGroup = duplicateGroups[currentGroupIndex];
    const leadsToDelete = currentGroup.leads.filter(lead => lead.id !== selectedLeadToKeep);

    console.log('🗑️ FRONTEND: Deleting leads:', {
      selectedToKeep: selectedLeadToKeep,
      leadsToDelete: leadsToDelete.map(l => ({ id: l.id, name: l.name })),
      totalInGroup: currentGroup.leads.length
    });

    try {
      // Eliminar leads duplicados usando la API
      const token = await user.getIdToken();
      const response = await fetch('/api/deleteLeads-temp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds: leadsToDelete.map(lead => lead.id),
          collection: 'meta-lead-ads'
        }),
      });

      if (!response.ok) {
        throw new Error('Error eliminando leads duplicados');
      }

      const result = await response.json();

      console.log('✅ FRONTEND: Delete response:', result);

      toast({
        title: "Duplicados resueltos",
        description: `Se eliminaron ${result.deletedCount} leads duplicados.`
      });

      // Recargar datos del servidor si está disponible
      if (onReloadData) {
        console.log('🔄 FRONTEND: Reloading data from server');
        onReloadData();
      }

      // Actualizar la lista de leads eliminando los duplicados (fallback local)
      const updatedLeads = leads.filter(lead => 
        !leadsToDelete.some(toDelete => toDelete.id === lead.id)
      );

      // Pasar al siguiente grupo o cerrar modal
      if (currentGroupIndex < duplicateGroups.length - 1) {
        setCurrentGroupIndex(currentGroupIndex + 1);
        setSelectedLeadToKeep(null);
      } else {
        setShowModal(false);
        onDuplicatesResolved(updatedLeads);
      }

    } catch (error: any) {
      console.error('Error deleting duplicate leads:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar los duplicados",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  }

  /**
   * Resuelve automáticamente todos los duplicados
   */
  async function resolveAllAutomatically() {
    if (processing || !user) return;
    
    setProcessing(true);

    const allLeadsToDelete: UnifiedLead[] = [];

    duplicateGroups.forEach(group => {
      const bestLead = getBestLead(group.leads);
      const toDelete = group.leads.filter(lead => lead.id !== bestLead.id);
      allLeadsToDelete.push(...toDelete);
    });

    try {
      // Eliminar todos los leads duplicados
      const token = await user.getIdToken();
      const response = await fetch('/api/deleteLeads-temp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds: allLeadsToDelete.map(lead => lead.id),
          collection: 'meta-lead-ads'
        }),
      });

      if (!response.ok) {
        throw new Error('Error eliminando leads duplicados');
      }

      const result = await response.json();

      const updatedLeads = leads.filter(lead => 
        !allLeadsToDelete.some(toDelete => toDelete.id === lead.id)
      );

      toast({
        title: "Todos los duplicados resueltos",
        description: `Se eliminaron ${result.deletedCount} leads duplicados automáticamente.`
      });

      setShowModal(false);
      onDuplicatesResolved(updatedLeads);

    } catch (error: any) {
      console.error('Error deleting all duplicate leads:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar todos los duplicados",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  }

  if (duplicateGroups.length === 0) return null;

  const currentGroup = duplicateGroups[currentGroupIndex];
  const bestLead = getBestLead(currentGroup.leads);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            Duplicados Detectados
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Se encontraron {duplicateGroups.length} grupos de leads duplicados. 
            Grupo {currentGroupIndex + 1} de {duplicateGroups.length}: {currentGroup.duplicateField}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alerta informativa */}
          <Alert className="bg-gray-800 border-gray-600">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-gray-200">
              <strong className="text-white">Se detectaron {currentGroup.leads.length} leads idénticos.</strong> 
              Selecciona cuál mantener y eliminaremos los demás.
            </AlertDescription>
          </Alert>

          {/* Leads duplicados */}
          <div className="grid gap-4">
            {currentGroup.leads.map((lead) => {
              const isRecommended = lead.id === bestLead.id;
              const relevanceScore = calculateRelevanceScore(lead);
              
              return (
                <Card 
                  key={lead.id} 
                  className={`cursor-pointer transition-all border ${
                    selectedLeadToKeep === lead.id 
                      ? 'ring-2 ring-blue-400 bg-blue-900/20 border-blue-400' 
                      : isRecommended 
                        ? 'border-green-400 bg-green-900/20' 
                        : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedLeadToKeep(lead.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2 text-white">
                        {isRecommended && <Crown className="h-4 w-4 text-yellow-400" />}
                        {lead.name}
                        {isRecommended && (
                          <Badge variant="secondary" className="bg-green-800 text-green-200 border-green-600">
                            Recomendado
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge variant="outline" className="border-gray-500 text-gray-300">
                        Score: {relevanceScore}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* ID */}
                    <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      ID: {lead.id}
                    </div>

                    {/* Información de contacto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="truncate text-gray-200">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-200">{lead.phone}</span>
                        </div>
                      )}
                      {lead.company && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span className="truncate text-gray-200">{lead.company}</span>
                        </div>
                      )}
                      {lead.createdAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-300">
                            {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta Ads info */}
                    {lead.metadata && (
                      <div className="text-xs text-gray-400 space-y-1">
                        {lead.metadata.campaignName && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-gray-400" />
                            <span className="truncate text-gray-300">Campaña: {lead.metadata.campaignName}</span>
                          </div>
                        )}
                        {lead.value && lead.value > 0 && (
                          <div className="text-gray-300">Valor: ${lead.value}</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-600">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedLeadToKeep(bestLead.id)}
                disabled={processing}
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Seleccionar Recomendado
              </Button>
              
              <Button
                variant="outline"
                onClick={resolveAllAutomatically}
                disabled={processing}
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Resolver Todo Automáticamente
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
              >
                Cancelar
              </Button>
              
              <Button
                onClick={resolveCurrentGroup}
                disabled={!selectedLeadToKeep || processing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {processing ? 'Procesando...' : 'Eliminar Duplicados'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}