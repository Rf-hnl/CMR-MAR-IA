"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, RefreshCw, Database } from 'lucide-react';

export default function OrganizationDebug() {
  const { user } = useAuth();
  const { organizations, currentOrganization, loading, error, reload } = useOrganization();
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Code className="mr-2 h-4 w-4" />
            Debug de Organizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDebug(true)}
          >
            Mostrar Info de Debug
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm">
            <Code className="mr-2 h-4 w-4" />
            Debug de Organizaciones
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={reload}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDebug(false)}
            >
              Ocultar
            </Button>
          </div>
        </div>
        <CardDescription>
          Información técnica para debug y testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado general */}
        <div>
          <h4 className="font-medium mb-2">Estado General</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Loading:</span>
              <Badge variant={loading ? "destructive" : "default"}>
                {loading ? "Cargando" : "Completo"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Error:</span>
              <Badge variant={error ? "destructive" : "default"}>
                {error || "Sin errores"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Total Organizaciones:</span>
              <Badge variant="secondary">{organizations.length}</Badge>
            </div>
          </div>
        </div>

        {/* Usuario actual */}
        <div>
          <h4 className="font-medium mb-2">Usuario Actual</h4>
          <div className="bg-gray-50 p-3 rounded text-xs font-mono">
            <div>UID: {user?.uid}</div>
            <div>Email: {user?.email}</div>
            <div>Display Name: {user?.displayName || 'N/A'}</div>
          </div>
        </div>

        {/* Organización actual */}
        <div>
          <h4 className="font-medium mb-2">Organización Actual</h4>
          {currentOrganization ? (
            <div className="bg-gray-50 p-3 rounded text-xs font-mono space-y-1">
              <div>ID: {currentOrganization.id}</div>
              <div>Nombre: {currentOrganization.name}</div>
              <div>Owner: {currentOrganization.ownerId}</div>
              <div>Miembros: [{currentOrganization.memberIds.join(', ')}]</div>
              <div>Creada: {currentOrganization.createdAt}</div>
            </div>
          ) : (
            <Badge variant="outline">No hay organización actual</Badge>
          )}
        </div>

        {/* Todas las organizaciones */}
        <div>
          <h4 className="font-medium mb-2">Todas las Organizaciones</h4>
          {organizations.length > 0 ? (
            <div className="space-y-2">
              {organizations.map((org) => (
                <div key={org.id} className="bg-gray-50 p-3 rounded text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-gray-600">ID: {org.id}</div>
                    </div>
                    <Badge variant={org.id === currentOrganization?.id ? "default" : "secondary"}>
                      {org.id === currentOrganization?.id ? "Actual" : "Otra"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Badge variant="outline">No hay organizaciones</Badge>
          )}
        </div>

        {/* Información de localStorage */}
        <div>
          <h4 className="font-medium mb-2">LocalStorage</h4>
          <div className="bg-gray-50 p-3 rounded text-xs font-mono">
            <div>currentOrganizationId: {localStorage.getItem('currentOrganizationId') || 'N/A'}</div>
          </div>
        </div>

        {/* Acciones de testing */}
        <div>
          <h4 className="font-medium mb-2">Acciones de Testing</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                localStorage.removeItem('currentOrganizationId');
                window.location.reload();
              }}
            >
              Limpiar localStorage
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('🏢 Organizations:', organizations);
                console.log('📍 Current Org:', currentOrganization);
                console.log('👤 User:', user);
              }}
            >
              <Database className="mr-2 h-4 w-4" />
              Log a Console
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}