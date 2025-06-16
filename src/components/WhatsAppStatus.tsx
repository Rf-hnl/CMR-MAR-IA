"use client";

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface WhatsAppStatusProps {
  className?: string;
}

interface StatusData {
  connected: boolean;
  state: string;
  checking: boolean;
  lastCheck?: Date;
}

export default function WhatsAppStatus({ className }: WhatsAppStatusProps) {
  const [status, setStatus] = useState<StatusData>({
    connected: false,
    state: 'unknown',
    checking: false
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const response = await fetch('/api/whatsapp/status');
      const result = await response.json();
      
      setStatus({
        connected: result.connected,
        state: result.state,
        checking: false,
        lastCheck: new Date()
      });
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setStatus(prev => ({
        ...prev,
        connected: false,
        state: 'error',
        checking: false,
        lastCheck: new Date()
      }));
    }
  };

  // Verificar estado al montar el componente
  useEffect(() => {
    checkStatus();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (status.checking) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
    }
    
    switch (status.state) {
      case 'open':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'close':
      case 'connecting':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (status.checking) return 'Verificando...';
    
    switch (status.state) {
      case 'open':
        return 'Conectado';
      case 'close':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Error de conexión';
      default:
        return 'Estado desconocido';
    }
  };

  const getStatusVariant = () => {
    if (status.checking) return 'secondary';
    
    switch (status.state) {
      case 'open':
        return 'default' as const;
      case 'close':
      case 'error':
        return 'destructive' as const;
      case 'connecting':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">WhatsApp API</span>
                <Badge variant={getStatusVariant()}>
                  {getStatusText()}
                </Badge>
              </div>
              {status.lastCheck && (
                <p className="text-xs text-muted-foreground mt-1">
                  Última verificación: {status.lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={status.checking}
          >
            {status.checking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {!status.connected && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-medium">WhatsApp no está conectado</p>
                <p className="text-amber-700 text-xs mt-1">
                  Los mensajes automáticos no se enviarán hasta que se establezca la conexión.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}