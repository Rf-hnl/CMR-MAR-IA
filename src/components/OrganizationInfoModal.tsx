"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Copy, Users, Crown, Settings, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Organization } from '@/types/organization';

interface OrganizationInfoModalProps {
  organization: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIsOwner?: boolean;
}

export default function OrganizationInfoModal({ 
  organization, 
  open, 
  onOpenChange,
  userIsOwner = false 
}: OrganizationInfoModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyOrganizationId = async () => {
    if (!organization?.id) return;

    try {
      await navigator.clipboard.writeText(organization.id);
      setCopied(true);
      toast({
        title: "ID copiado",
        description: "El ID de la organización ha sido copiado al portapapeles."
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el ID.",
        variant: "destructive"
      });
    }
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            Información de la Organización
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Organization Name */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {organization.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {organization.description || 'Sin descripción disponible'}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                    Organización Activa
                  </Badge>
                  {userIsOwner && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <Crown className="h-3 w-3 mr-1" />
                      Propietario
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Miembros</p>
                    <p className="text-xl font-bold text-gray-900">{organization.memberIds.length}</p>
                  </div>
                  <Users className="h-6 w-6 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Configuración</p>
                    <p className="text-sm font-semibold text-gray-700 flex items-center">
                      <Settings className="h-3 w-3 mr-1" />
                      Activa
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organization ID */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">ID de Organización</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyOrganizationId}
                    className="h-8"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-green-600">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="bg-white border border-gray-200 rounded p-3">
                  <code className="text-xs text-gray-600 font-mono break-all select-all">
                    {organization.id}
                  </code>
                </div>
                
                <p className="text-xs text-gray-500">
                  Usa este ID para referencias técnicas o configuraciones avanzadas.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
            <p>
              💡 <strong>Tip:</strong> Puedes cambiar de organización desde la página de configuración.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}