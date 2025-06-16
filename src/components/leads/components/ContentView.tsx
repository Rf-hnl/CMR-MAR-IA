"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Save, RotateCcw, Sparkles, Bot, Mail, Target, Copy } from 'lucide-react';
import { ActionResult } from '@/types/actionResult';
import { AILoadingSkeleton } from '@/components/ui/ai-loading';

interface ContentViewProps {
  actionResult: ActionResult;
  isEditing: boolean;
  editedContent: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onCopy?: (text: string) => void;
  onWhatsAppSend?: (text: string) => void;
  hasPhoneNumber?: boolean;
  isSending?: boolean;
  isLoading?: boolean;
}

const CARD_STYLES = "border border-gray-700 p-6 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-sm";
const AI_HEADER_STYLES = "flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-gray-600";
const AI_BADGE_STYLES = "inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full font-medium";
const CONTENT_SECTION_STYLES = "p-4 rounded-lg border border-gray-600 bg-gray-800 shadow-sm";

// WhatsApp SVG Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.434 3.268"/>
  </svg>
);

export const ContentView = ({ 
  actionResult, 
  isEditing, 
  editedContent, 
  onContentChange, 
  onSave, 
  onCancel,
  onCopy,
  onWhatsAppSend,
  hasPhoneNumber,
  isSending,
  isLoading
}: ContentViewProps) => {
  if (!actionResult || 'error' in actionResult) return null;

  // Show loading skeleton while AI is processing
  if (isLoading) {
    return <AILoadingSkeleton lines={4} />;
  }

  return (
    <div className={CARD_STYLES}>
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Editando Contenido
            </h3>
            <div className="flex gap-2">
              {onCopy && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCopy(editedContent)}
                  className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              )}
              {hasPhoneNumber && onWhatsAppSend && (
                <Button
                  size="sm"
                  onClick={() => onWhatsAppSend(editedContent)}
                  disabled={isSending}
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                >
                  {isSending ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  ) : (
                    <WhatsAppIcon className="h-4 w-4 mr-1" />
                  )}
                  WhatsApp
                </Button>
              )}
              <Button
                size="sm"
                onClick={onSave}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
          <Textarea
            value={editedContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[200px] text-sm leading-relaxed bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            placeholder="Edita el contenido aquí..."
          />
        </div>
      ) : (
        <div className="space-y-4">
      

          {'message' in actionResult && actionResult.message && (
            <div className={CONTENT_SECTION_STYLES}>
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-blue-400" />
                <h4 className="font-medium text-white">Mensaje de Bienvenida</h4>
              </div>
              <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-sm">
                {actionResult.message}
              </div>
            </div>
          )}
          
          {'evaluation' in actionResult && actionResult.evaluation && (
            <div className={CONTENT_SECTION_STYLES}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-green-400" />
                <h4 className="font-medium text-white">Evaluación del Negocio</h4>
              </div>
              <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-sm">
                {actionResult.evaluation}
              </div>
            </div>
          )}

          {'email_subject' in actionResult && actionResult.email_subject && actionResult.email_body && (
            <div className="space-y-4">
              <div className={CONTENT_SECTION_STYLES}>
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-purple-400" />
                  <h4 className="font-medium text-white">Email de Configuración de Solución</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-200 mb-1 text-sm">Asunto:</h5>
                    <p className="text-gray-300 text-sm bg-gray-700 p-2 rounded border-l-3 border-l-purple-500">{actionResult.email_subject}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-200 mb-1 text-sm">Mensaje:</h5>
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-sm bg-gray-700 p-3 rounded border-l-3 border-l-purple-500">
                      {actionResult.email_body}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {'recommendations' in actionResult && actionResult.recommendations && (
            <div className={CONTENT_SECTION_STYLES}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-orange-400" />
                <h4 className="font-medium text-white">Recomendaciones de Ventas</h4>
              </div>
              <div className="space-y-3">
                {actionResult.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-orange-900/30 to-yellow-900/30 border border-orange-700">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-white mb-1 text-sm">{rec.area}</h5>
                        <p className="text-gray-300 text-sm leading-relaxed">{rec.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};