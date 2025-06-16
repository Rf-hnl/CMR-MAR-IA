"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check, Edit3, Send } from 'lucide-react';

interface QuickActionsProps {
  copied: boolean;
  isEditing: boolean;
  onCopy: () => void;
  onStartEdit: () => void;
}

export const QuickActions = ({ copied, isEditing, onCopy, onStartEdit }: QuickActionsProps) => {
  if (isEditing) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-gray-600">
      <div className="flex items-center gap-3">
        <Send className="h-4 w-4 text-blue-400" />
        <div>
          <h4 className="font-medium text-white">Acciones Rápidas</h4>
          <p className="text-sm text-gray-300">Copia, edita o envía directamente</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="bg-gray-700 hover:bg-gray-600 border-gray-500 text-gray-200 hover:text-white"
          aria-label={copied ? "Contenido copiado" : "Copiar contenido al portapapeles"}
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-300" />}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onStartEdit}
          className="bg-gray-700 hover:bg-gray-600 border-gray-500 text-gray-200 hover:text-white"
          aria-label="Editar contenido"
        >
          <Edit3 className="h-4 w-4 text-gray-300" />
          <span>Editar</span>
        </Button>
      </div>
    </div>
  );
};