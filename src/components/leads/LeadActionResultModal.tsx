"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BrainCircuit, Lightbulb, PackageSearch, Mail, Sparkles, Bot, Target, Check, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { ActionResult } from '@/types/actionResult';
import { useFormattedContent } from '@/hooks/useFormattedContent';
import { useModalState } from '@/hooks/useModalState';
import { QuickActions } from './components/QuickActions';
import { ContentView } from './components/ContentView';
import { isFieldMissing } from '@/lib/leads-utils';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

interface LeadActionResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionResult: ActionResult;
  currentActionType: string | null;
  onClose: () => void;
  isActionLoading?: boolean;
  currentLead?: {
    id?: string;
    name: string;
    phone?: string | null;
    businessType?: string | null;
  } | null;
  onLeadUpdate?: () => void; // Callback para actualizar la lista de leads
}

export default function LeadActionResultModal({
  open,
  onOpenChange,
  actionResult,
  currentActionType,
  onClose,
  isActionLoading = false,
  currentLead,
  onLeadUpdate
}: LeadActionResultModalProps) {
  const { state, actions } = useModalState();
  const contentText = useFormattedContent(actionResult);
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  // Estados para WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<{
    connected: boolean;
    checking: boolean;
    autoSending: boolean;
    autoSent: boolean;
  }>({ connected: false, checking: false, autoSending: false, autoSent: false });

  // Estado para editar número de teléfono
  const [editingPhone, setEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState('');
  
  // Estados para cotización inteligente
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<string | null>(null);
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  // Memoized values
  const hasPhoneNumber = useMemo(() => 
    Boolean(currentLead?.phone && !isFieldMissing(currentLead.phone)), 
    [currentLead?.phone]
  );

  const modalIcon = useMemo(() => {
    switch (currentActionType) {
      case 'welcome': return <Bot className="h-5 w-5 text-blue-600" />;
      case 'evaluate': return <Target className="h-5 w-5 text-green-600" />;
      case 'recommend': return <Target className="h-5 w-5 text-orange-600" />;
      case 'solution-email': return <Mail className="h-5 w-5 text-purple-600" />;
      default: return <Sparkles className="h-5 w-5 text-blue-600" />;
    }
  }, [currentActionType]);

  const modalTitle = useMemo(() => {
    switch (currentActionType) {
      case 'welcome': return 'Mensaje de Bienvenida Generado';
      case 'evaluate': return 'Evaluación del Negocio';
      case 'recommend': return 'Recomendaciones de Productos';
      case 'solution-email': return 'Email de Configuración TPV';
      default: return 'Resultado Generado';
    }
  }, [currentActionType]);

  // Helper function to resolve text content
  const resolveText = useCallback((custom?: string) => custom ?? contentText, [contentText]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      actions.resetAll();
    }
    onOpenChange(isOpen);
  }, [onClose, onOpenChange, actions]);

  const handleCopy = useCallback(async (customText?: string) => {
    const textToCopy = resolveText(customText);
    if (!textToCopy) return;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      actions.copySuccess();
      setTimeout(() => actions.copyReset(), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [resolveText, actions]);
  
  // Verificar estado de WhatsApp usando Evolution API
  const checkWhatsAppStatus = useCallback(async () => {
    setWhatsappStatus(prev => ({ ...prev, checking: true }));
    
    try {
      // Usar Evolution API endpoint
      const response = await fetch('http://localhost:8081/instance/connectionState/u', {
        method: 'GET',
        headers: {
          'apikey': 'evolution_api_key_2024'
        }
      });
      

      if (response.ok) {
        const result = await response.json();
        const isConnected = result.instance?.state === 'open';
        
        setWhatsappStatus(prev => ({
          ...prev,
          connected: isConnected,
          checking: false
        }));
      } else {
        setWhatsappStatus(prev => ({
          ...prev,
          connected: false,
          checking: false
        }));
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setWhatsappStatus(prev => ({
        ...prev,
        connected: false,
        checking: false
      }));
    }
  }, []);

  // Función para actualizar el estado del lead después de enviar mensaje de bienvenida
  const updateLeadStatusAfterWelcomeMessage = useCallback(async () => {
    if (!currentLead?.id || !user || !currentOrganization) {
      console.log('No se puede actualizar lead: faltan datos requeridos');
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadId: currentLead.id,
          organizationId: currentOrganization.id,
          newStatus: 'contactado',
          contactMethod: 'whatsapp',
          responseStatus: 'sin_respuesta',
          notes: `Mensaje de bienvenida enviado via WhatsApp a ${editedPhone || currentLead.phone}`,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Estado del lead actualizado a "contactado - sin respuesta"');
        
        // Llamar al callback para refrescar la lista de leads
        if (onLeadUpdate) {
          onLeadUpdate();
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Error al actualizar estado del lead:', errorData);
      }
    } catch (error) {
      console.error('Error al actualizar estado del lead:', error);
    }
  }, [currentLead, user, currentOrganization, editedPhone, onLeadUpdate]);

  // Auto-envío de mensaje de bienvenida
  const handleAutoSendWelcomeMessage = useCallback(async () => {
    if (!currentLead?.phone || !currentLead?.name || whatsappStatus.autoSending || whatsappStatus.autoSent) {
      return;
    }

    setWhatsappStatus(prev => ({ ...prev, autoSending: true }));

    try {
      const response = await fetch('/api/whatsapp/send-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: currentLead.phone,
          leadName: currentLead.name,
          businessType: currentLead.businessType,
          message: contentText // Usar el mensaje generado por IA
        })
      });

      const result = await response.json();

      if (result.success) {
        setWhatsappStatus(prev => ({
          ...prev,
          autoSending: false,
          autoSent: true
        }));
        
        // Actualizar estado del lead después del auto-envío
        await updateLeadStatusAfterWelcomeMessage();
        
        // Mostrar notificación de éxito
        setTimeout(() => {
          toast({
            title: "✅ Mensaje de Bienvenida Enviado",
            description: `Enviado a ${currentLead.name}. Lead movido a "Contactado - Sin respuesta"`,
            duration: 5000,
          });
        }, 500);
      } else {
        throw new Error(result.error || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error en auto-envío:', error);
      setWhatsappStatus(prev => ({
        ...prev,
        autoSending: false
      }));
      
      alert(`❌ Error al enviar mensaje automático: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }, [currentLead, contentText, whatsappStatus.autoSending, whatsappStatus.autoSent, updateLeadStatusAfterWelcomeMessage]);

  // Función para normalizar número de teléfono
  const normalizePhoneNumber = useCallback((phone: string) => {
    // Limpiar el número de teléfono
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Lógica de formateo según la documentación Evolution API
    if (cleanPhone.length === 8) {
      // Número local, agregar código de país Costa Rica
      cleanPhone = '506' + cleanPhone;
    } else if (cleanPhone.length === 10 && !cleanPhone.startsWith('506')) {
      // Número de 10 dígitos sin código de país
      cleanPhone = '506' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      // Número de Estados Unidos/Canadá
      cleanPhone = cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('52')) {
      // Número de México
      cleanPhone = cleanPhone;
    }
    
    return cleanPhone;
  }, []);

  const handleWhatsAppSend = useCallback(async (customText?: string, customPhone?: string) => {
    const phoneToUse = customPhone || editedPhone || currentLead?.phone;
    
    if (!phoneToUse) {
      alert('❌ No hay número de teléfono disponible para este contacto');
      return;
    }
    
    const textToSend = resolveText(customText);
    if (!textToSend) {
      alert('❌ No hay contenido para enviar');
      return;
    }
    
    actions.startSending();
    
    try {
      // Normalizar número de teléfono
      const normalizedPhone = normalizePhoneNumber(phoneToUse);
      
      // Usar Evolution API para enviar mensaje
      const response = await fetch('http://localhost:8081/message/sendText/u', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'evolution_api_key_2024'
        },
        body: JSON.stringify({
          number: normalizedPhone,
          text: textToSend
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Mensaje enviado exitosamente:', result);
        actions.sendSuccess();
        
        // Si es un mensaje de bienvenida, actualizar el estado del lead
        if (currentActionType === 'welcome' && currentLead) {
          await updateLeadStatusAfterWelcomeMessage();
        }
        
        setTimeout(() => actions.sendReset(), 3000);
        
        // Mensaje específico para mensaje de bienvenida
        if (currentActionType === 'welcome') {
          toast({
            title: "✅ Mensaje de Bienvenida Enviado",
            description: `Enviado a ${normalizedPhone}. Lead movido a "Contactado - Sin respuesta"`,
            duration: 5000,
          });
        } else {
          toast({
            title: "✅ Mensaje Enviado",
            description: `Mensaje enviado exitosamente a ${normalizedPhone}`,
            duration: 3000,
          });
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Error al enviar mensaje:', errorData);
        alert(`❌ Error al enviar mensaje: ${errorData.message || 'Error desconocido'}`);
      }
      
    } catch (error) {
      console.error('Error al enviar mensaje via Evolution API:', error);
      alert('❌ Error de conexión con Evolution API');
    } finally {
      actions.sendReset();
    }
  }, [hasPhoneNumber, resolveText, actions, currentLead, editedPhone, normalizePhoneNumber]);

  const handleStartEdit = useCallback(() => {
    actions.startEdit(contentText);
  }, [actions, contentText]);

  // Función para generar cotización inteligente basada en la evaluación
  const handleGenerateIntelligentQuote = useCallback(async () => {
    if (!currentLead) return;
    
    setIsGeneratingQuote(true);
    
    try {
      // Usar la API de cotización híbrida (IA + PandaDoc)
      const response = await fetch('/api/quotes/generate-intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadName: currentLead.name,
          businessType: currentLead.businessType,
          evaluation: contentText, // Usar la evaluación como contexto
          requestedServices: extractServicesFromEvaluation(contentText), // Extraer servicios recomendados
        })
      });

      const result = await response.json();

      if (response.ok) {
        setGeneratedQuote(result.quotationUrl || result.documentUrl);
        setQuoteGenerated(true);
        
        toast({
          title: "✅ Cotización Generada",
          description: "Cotización inteligente creada con éxito usando PandaDoc",
          duration: 5000,
        });
      } else {
        throw new Error(result.error || 'Error al generar cotización');
      }
    } catch (error) {
      console.error('Error generating intelligent quote:', error);
      toast({
        title: "❌ Error",
        description: `Error al generar cotización: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGeneratingQuote(false);
    }
  }, [currentLead, contentText, toast]);

  // Función auxiliar para extraer servicios recomendados de la evaluación
  const extractServicesFromEvaluation = (evaluation: string) => {
    const services = [];
    if (evaluation.includes('CRM')) services.push('CRM y Gestión de Leads');
    if (evaluation.includes('WhatsApp')) services.push('WhatsApp Business Automation');
    if (evaluation.includes('Tracking')) services.push('Tracking y Analytics');
    if (evaluation.includes('IA') || evaluation.includes('Inteligencia')) services.push('Inteligencia Artificial');
    if (evaluation.includes('Web') || evaluation.includes('sitio')) services.push('Desarrollo Web');
    if (evaluation.includes('Marketing')) services.push('Marketing Digital');
    if (evaluation.includes('TPV')) services.push('Sistemas TPV');
    return services;
  };

  // Función para enviar cotización por WhatsApp
  const handleSendQuoteViaWhatsApp = useCallback(async () => {
    if (!generatedQuote || !currentLead) return;
    
    const phoneToUse = editedPhone || currentLead.phone;
    if (!phoneToUse) {
      toast({
        title: "❌ Error",
        description: "No hay número de teléfono disponible",
        variant: "destructive",
      });
      return;
    }

    actions.startSending();
    
    try {
      const normalizedPhone = normalizePhoneNumber(phoneToUse);
      
      const quoteMessage = `Hola ${currentLead.name},

Basándome en la evaluación de tu negocio, he preparado una cotización personalizada con las soluciones que mejor se adaptan a tus necesidades.

📋 *Cotización Personalizada:* ${generatedQuote}

Esta propuesta incluye los servicios específicos que identificamos como oportunidades de crecimiento para tu empresa.

¿Te gustaría que conversemos sobre los detalles de implementación?

Saludos,
Equipo HNL-MAR-IA`;

      const response = await fetch('http://localhost:8081/message/sendText/u', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'evolution_api_key_2024'
        },
        body: JSON.stringify({
          number: normalizedPhone,
          text: quoteMessage
        })
      });

      if (response.ok) {
        actions.sendSuccess();
        
        toast({
          title: "✅ Cotización Enviada",
          description: `Cotización enviada exitosamente a ${currentLead.name}`,
          duration: 5000,
        });
        
        setTimeout(() => actions.sendReset(), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar cotización');
      }
      
    } catch (error) {
      console.error('Error sending quote via WhatsApp:', error);
      toast({
        title: "❌ Error",
        description: `Error al enviar cotización: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      actions.sendReset();
    }
  }, [generatedQuote, currentLead, editedPhone, normalizePhoneNumber, actions, toast]);

  // Verificar estado de WhatsApp al abrir modal
  useEffect(() => {
    if (open) {
      checkWhatsAppStatus();
      // Inicializar número editado - SIEMPRE inicializar
      setEditedPhone(currentLead?.phone || '');
    }
  }, [open, currentLead?.phone, checkWhatsAppStatus]);

  // Auto-envío para mensajes de bienvenida
  useEffect(() => {
    if (open && currentActionType === 'welcome' && actionResult && !actionResult.error && 
        hasPhoneNumber && whatsappStatus.connected && !whatsappStatus.autoSent) {
      handleAutoSendWelcomeMessage();
    }
  }, [open, currentActionType, actionResult, hasPhoneNumber, whatsappStatus.connected, whatsappStatus.autoSent, handleAutoSendWelcomeMessage]);

  // Reset timers on unmount
  useEffect(() => {
    return () => {
      actions.resetAll();
    };
  }, [actions]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white border-gray-700">
        {actionResult && actionResult.error ? (
          <>
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-semibold text-white">
                Error al generar contenido
              </DialogTitle>
            </DialogHeader>
            <Separator className="my-4 bg-gray-700" />
            <div className="space-y-4">
              <Alert variant="destructive" className="bg-red-900/20 border-red-700 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error al generar contenido</AlertTitle>
                <AlertDescription className="mt-2">
                  {actionResult.error}
                  {actionResult.error.includes('Status: 500') && (
                    <div className="mt-2 text-sm">
                      <p>Esto suele indicar un problema con el servidor de IA.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/ai/test');
                            const result = await response.json();
                            console.log('AI Test result:', result);
                            alert(response.ok ? 'Conexión AI OK ✅' : `Error AI: ${result.error}`);
                          } catch (error) {
                            console.error('Test failed:', error);
                            alert('Error al probar conexión AI ❌');
                          }
                        }}
                      >
                        Probar Conexión AI
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-gray-600">
                <div className="p-3 rounded-full bg-gray-700 shadow-sm border border-gray-600">
                  {modalIcon}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl font-semibold text-white">
                    {modalTitle}
                  </DialogTitle>
                  <p className="text-sm text-gray-300 mt-1">Resultado impulsado por inteligencia artificial</p>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full font-medium shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  IA
                </div>
              </div>
            </DialogHeader>
            <Separator className="my-4 bg-gray-700" />
            <div className="space-y-4">
              {!state.isEditing && (
                <QuickActions
                  copied={state.copied}
                  isEditing={state.isEditing}
                  onCopy={() => handleCopy()}
                  onStartEdit={handleStartEdit}
                />
              )}

              <ContentView
                actionResult={actionResult}
                isEditing={state.isEditing}
                editedContent={state.editedContent}
                onContentChange={actions.updateContent}
                onSave={actions.saveEdit}
                onCancel={actions.cancelEdit}
                onCopy={handleCopy}
                onWhatsAppSend={handleWhatsAppSend}
                hasPhoneNumber={hasPhoneNumber}
                isSending={state.isSending}
                isLoading={isActionLoading && !actionResult}
              />

              {/* Estado de WhatsApp */}
              <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {whatsappStatus.checking ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : whatsappStatus.connected ? (
                      <Wifi className="h-4 w-4 text-green-400" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-sm font-medium text-white">
                      WhatsApp: {whatsappStatus.checking ? 'Verificando...' : whatsappStatus.connected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkWhatsAppStatus}
                    disabled={whatsappStatus.checking}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Verificar
                  </Button>
                </div>
                
                {/* Auto-envío de mensaje de bienvenida */}
                {currentActionType === 'welcome' && whatsappStatus.connected && hasPhoneNumber && (
                  <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded">
                    <div className="flex items-center gap-2 text-sm">
                      {whatsappStatus.autoSending ? (
                        <>
                          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-blue-300">Enviando mensaje de bienvenida automáticamente...</span>
                        </>
                      ) : whatsappStatus.autoSent ? (
                        <>
                          <Check className="h-3 w-3 text-green-400" />
                          <span className="text-green-300">Mensaje de bienvenida enviado automáticamente ✅</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-3 w-3 text-blue-400" />
                          <span className="text-blue-300">Mensaje de bienvenida se enviará automáticamente</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección especial para evaluaciones de negocio */}
              {actionResult && !actionResult.error && currentActionType === 'evaluate' && (
                <div className="p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-600/50 rounded-lg">
                  <div className="space-y-4">
                    {/* Header para evaluación */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">Evaluación Completada - Siguiente Paso</h4>
                        <p className="text-sm text-gray-300">
                          Genera una cotización personalizada basada en el análisis
                        </p>
                      </div>
                    </div>

                    {/* Botón para generar cotización inteligente */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleGenerateIntelligentQuote}
                        disabled={isGeneratingQuote || quoteGenerated}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-200"
                      >
                        {isGeneratingQuote ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generando Cotización Inteligente...
                          </div>
                        ) : quoteGenerated ? (
                          <div className="flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            Cotización Generada ✓
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                            </svg>
                            Crear Cotización con PandaDoc
                          </div>
                        )}
                      </Button>

                      {/* Mostrar enlace a cotización si está generada */}
                      {quoteGenerated && generatedQuote && (
                        <div className="p-3 bg-green-900/30 border border-green-600/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-600 rounded-lg">
                              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-green-300">Cotización Creada</h5>
                              <a 
                                href={generatedQuote} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-green-200 hover:text-green-100 underline"
                              >
                                Ver Cotización en PandaDoc →
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botón para enviar por WhatsApp (solo habilitado si hay cotización) */}
                      {quoteGenerated && (
                        <Button
                          onClick={handleSendQuoteViaWhatsApp}
                          disabled={state.isSending || !editedPhone}
                          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white transition-all duration-200"
                        >
                          {state.isSending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Enviando Cotización...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.434 3.268"/>
                              </svg>
                              Enviar Cotización por WhatsApp
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {actionResult && !actionResult.error && !state.isEditing && currentActionType !== 'evaluate' && (
                <div className="p-4 bg-gray-800 border-2 border-[#25D366] rounded-lg">
                  <div className="space-y-3">
                    {/* Header con información del destinatario */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#25D366] rounded-lg">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.434 3.268"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">Enviar por WhatsApp usando Evolution API</h4>
                        <p className="text-sm text-gray-300">
                          {state.isSending ? 'Enviando mensaje...' : `Destinatario: ${currentLead?.name || 'Cliente'}`}
                        </p>
                      </div>
                    </div>

                    {/* Sección del número de teléfono editable */}
                    <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Número de WhatsApp:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPhone(!editingPhone)}
                          className="border-gray-500 text-gray-300 hover:bg-gray-600 h-6 px-2 text-xs"
                        >
                          {editingPhone ? 'Guardar' : 'Editar'}
                        </Button>
                      </div>
                      
                      {editingPhone ? (
                        <div className="space-y-2">
                          <input
                            type="tel"
                            value={editedPhone}
                            onChange={(e) => setEditedPhone(e.target.value)}
                            placeholder="Ej: +50612345678 o 12345678"
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setEditingPhone(false);
                              }
                            }}
                          />
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>📱 <strong>Formatos válidos:</strong></p>
                            <p>• <span className="text-green-400">+50612345678</span> (Costa Rica con prefijo)</p>
                            <p>• <span className="text-green-400">12345678</span> (local, se añadirá +506)</p>
                            <p>• <span className="text-green-400">+52155123456</span> (México)</p>
                            <p>• <span className="text-green-400">+1234567890</span> (USA/Canadá)</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-green-400 bg-gray-600 px-3 py-2 rounded text-sm border border-gray-500">
                            {editedPhone ? (
                              `+${normalizePhoneNumber(editedPhone)}`
                            ) : (
                              'No configurado'
                            )}
                          </span>
                          {editedPhone && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>Formato Evolution API</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-2">
                      {/* Información de estado antes del botón */}
                      {(!whatsappStatus.connected || !editedPhone) && (
                        <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-700">
                          {!whatsappStatus.connected && !editedPhone ? (
                            "⚠️ Necesitas conectar WhatsApp y configurar un número de teléfono"
                          ) : !whatsappStatus.connected ? (
                            "⚠️ WhatsApp desconectado. Haz clic en 'Verificar' para conectar"
                          ) : !editedPhone ? (
                            "⚠️ Configura un número de teléfono haciendo clic en 'Editar'"
                          ) : null}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleWhatsAppSend()}
                          disabled={state.isSending || state.justSent || !whatsappStatus.connected || !editedPhone}
                          className="bg-[#25D366] hover:bg-[#128C7E] text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Enviar mensaje por WhatsApp"
                        >
                        {state.isSending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Enviando...
                          </div>
                        ) : state.justSent ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Enviado ✓
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.434 3.268"/>
                            </svg>
                            Enviar via Evolution API
                          </>
                        )}
                        </Button>
                        
                        {!whatsappStatus.connected && (
                          <Button
                            variant="outline"
                            onClick={checkWhatsAppStatus}
                            disabled={whatsappStatus.checking}
                            className="border-gray-500 text-gray-300 hover:bg-gray-600"
                          >
                            {whatsappStatus.checking ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              'Reconectar'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Estado de conexión */}
                    <div className="flex items-center gap-2 text-xs">
                      {whatsappStatus.connected ? (
                        <>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400">Evolution API conectado</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span className="text-red-400">Evolution API desconectado</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <DialogFooter className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Bot className="h-3 w-3" />
              <span>Contenido generado con IA</span>
            </div>
            <div className="flex gap-3">
              <DialogClose asChild>
                <Button variant="outline" className="px-6 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                  Cerrar
                </Button>
              </DialogClose>
              <Button
                onClick={async () => {
                  // Call the API to generate a new evaluation
                  const response = await fetch('/api/ai/evaluate-business', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ leadName: currentLead?.name }), // Pass necessary data
                  });

                  if (response.ok) {
                    const newEvaluation = await response.json();
                    console.log('New evaluation generated:', newEvaluation);
                    // Optionally update the modal state or display the new evaluation
                  } else {
                    const errorData = await response.json();
                    console.error('Error generating new evaluation:', errorData.error);
                    alert('Error generating new evaluation: ' + errorData.error);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Generar Nueva Evaluación
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
