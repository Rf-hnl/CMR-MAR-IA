"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Edit3, 
  Save, 
  X, 
  RotateCcw, 
  Copy, 
  Eye, 
  Code, 
  Info,
  AlertTriangle,
  CheckCircle2,
  Hash,
  Lightbulb
} from 'lucide-react';
import { PromptTemplate } from '@/types/ai-prompts';

interface PromptEditorProps {
  template: PromptTemplate;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (template: PromptTemplate) => void;
  onCancel: () => void;
  onReset: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
}

export default function PromptEditor({
  template,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onReset,
  onDuplicate,
  onPreview
}: PromptEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<PromptTemplate>(template);
  const [promptText, setPromptText] = useState('');
  const [showVariables, setShowVariables] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setEditedTemplate(template);
    setPromptText(template.customPrompt || template.defaultPrompt);
    validatePrompt(template.customPrompt || template.defaultPrompt);
  }, [template]);

  const validatePrompt = (prompt: string) => {
    const newErrors: string[] = [];
    
    // Check for required variables
    template.variables.filter(v => v.required).forEach(variable => {
      const patterns = [
        `{{{${variable.name}}}`, // Handlebars syntax
        `{{${variable.name}}}`,   // Simple syntax
        `{{#if ${variable.name}}}` // Conditional syntax
      ];
      
      const hasVariable = patterns.some(pattern => prompt.includes(pattern));
      if (!hasVariable) {
        newErrors.push(`Variable requerida "${variable.name}" no encontrada en el prompt`);
      }
    });

    // Check for orphaned variables
    const variablePattern = /{{{?(\w+)}}}?/g;
    const matches = prompt.match(variablePattern);
    if (matches) {
      matches.forEach(match => {
        const varName = match.replace(/{|}/g, '');
        const exists = template.variables.some(v => v.name === varName);
        if (!exists && !['#if', '#each', '/if', '/each', 'this'].some(keyword => varName.includes(keyword))) {
          newErrors.push(`Variable "${varName}" no está definida en el esquema`);
        }
      });
    }

    setErrors(newErrors);
  };

  const handlePromptChange = (value: string) => {
    setPromptText(value);
    validatePrompt(value);
  };

  const insertVariable = (variableName: string) => {
    const textarea = document.querySelector('textarea[placeholder="Escribe tu prompt aquí..."]') as HTMLTextAreaElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textToInsert = `{{${variableName}}}`;
    const newText = promptText.slice(0, cursorPos) + textToInsert + promptText.slice(cursorPos);
    
    setPromptText(newText);
    validatePrompt(newText);
    
    // Reset cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + textToInsert.length, cursorPos + textToInsert.length);
    }, 0);
  };

  const insertText = (text: string) => {
    const textarea = document.querySelector('textarea[placeholder="Escribe tu prompt aquí..."]') as HTMLTextAreaElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const newText = promptText.slice(0, cursorPos) + text + promptText.slice(cursorPos);
    
    setPromptText(newText);
    validatePrompt(newText);
    
    // Reset cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
    }, 0);
  };

  const handleSave = () => {
    const updatedTemplate: PromptTemplate = {
      ...editedTemplate,
      customPrompt: promptText !== template.defaultPrompt ? promptText : undefined,
      updatedAt: new Date()
    };
    onSave(updatedTemplate);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(promptText);
  };

  const getContextualTips = (templateName: string) => {
    const tips = {
      'Mensaje de Bienvenida': [
        'Mantén un tono cálido y profesional',
        'Personaliza con el nombre del negocio',
        'Incluye una propuesta de valor clara',
        'Haz preguntas abiertas para generar diálogo'
      ],
      'Evaluación de Negocio': [
        'Sé objetivo y basado en datos',
        'Estructura la evaluación en puntos claros',
        'Incluye tanto fortalezas como oportunidades',
        'Usa un lenguaje técnico pero comprensible'
      ],
      'Recomendaciones de Ventas': [
        'Enfócate en beneficios, no solo características',
        'Adapta las recomendaciones al tipo de negocio',
        'Incluye justificaciones sólidas',
        'Proporciona opciones y alternativas'
      ],
      'Email de Configuración TPV': [
        'Usa un tono técnico pero accesible',
        'Incluye todos los detalles de configuración',
        'Proporciona pasos claros y ordenados',
        'Añade información de contacto para soporte'
      ]
    };
    
    return tips[templateName as keyof typeof tips] || [
      'Sé específico y claro en las instrucciones',
      'Define el rol de la IA al inicio',
      'Usa ejemplos cuando sea posible',
      'Especifica el formato de salida deseado'
    ];
  };

  const isModified = promptText !== (template.customPrompt || template.defaultPrompt) || 
                   editedTemplate.isActive !== template.isActive ||
                   editedTemplate.name !== template.name ||
                   editedTemplate.description !== template.description;

  const currentPrompt = template.customPrompt || template.defaultPrompt;
  const isUsingCustom = !!template.customPrompt;
  const wordCount = promptText.trim().split(/\s+/).length;
  const charCount = promptText.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                {isEditing ? (
                  <Input
                    value={editedTemplate.name}
                    onChange={(e) => setEditedTemplate({...editedTemplate, name: e.target.value})}
                    className="font-semibold text-lg h-8 border-none p-0 focus-visible:ring-0"
                  />
                ) : (
                  template.name
                )}
              </CardTitle>
              {isEditing ? (
                <Input
                  value={editedTemplate.description}
                  onChange={(e) => setEditedTemplate({...editedTemplate, description: e.target.value})}
                  className="text-sm text-muted-foreground h-6 border-none p-0 focus-visible:ring-0"
                  placeholder="Descripción del prompt..."
                />
              ) : (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isUsingCustom && (
                <Badge variant="outline" className="bg-primary/10">
                  Personalizado
                </Badge>
              )}
              <Badge variant={template.isActive ? "default" : "secondary"}>
                {template.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editedTemplate.isActive}
                  onCheckedChange={(checked) => setEditedTemplate({...editedTemplate, isActive: checked})}
                  disabled={!isEditing}
                />
                <Label className="text-sm">Activo</Label>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVariables(!showVariables)}
              >
                <Hash className="h-4 w-4 mr-2" />
                Variables ({template.variables.length})
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={onDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </Button>
                  <Button variant="outline" size="sm" onClick={onPreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Vista Previa
                  </Button>
                  <Button size="sm" onClick={onEdit}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={onCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onReset}
                    disabled={!isUsingCustom}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={errors.length > 0 || !isModified}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Variables Panel */}
        {showVariables && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Variables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                {template.variables.map((variable) => (
                  <div key={variable.name} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono">
                        {`{{{${variable.name}}}}`}
                      </code>
                      {variable.required && (
                        <Badge variant="destructive" className="text-xs">
                          Requerida
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {variable.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {variable.type}
                      </Badge>
                      {variable.example && (
                        <span>Ej: {variable.example}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Sintaxis:</strong><br />
                      • <code>{`{{variable}}`}</code> - Variable simple<br />
                      • <code>{`{{#if variable}}`}</code> - Condicional<br />
                      • <code>{`{{#each array}}`}</code> - Iteración
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>💡 Consejos para "{template.name}":</strong><br />
                      {getContextualTips(template.name).map((tip, index) => (
                        <span key={index}>• {tip}<br /></span>
                      ))}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Prompt Editor */}
        <div className={showVariables ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Editor de Prompt</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{wordCount} palabras</span>
                  <span>{charCount} caracteres</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {errors.length === 0 && isModified && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Prompt válido y listo para guardar.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Variable Palette */}
                {isEditing && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <Label className="text-sm font-medium mb-2 block">
                      Variables Disponibles (Click para insertar)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <Button
                          key={variable.name}
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable.name)}
                          className="text-xs h-7 px-2"
                        >
                          <Hash className="h-3 w-3 mr-1" />
                          {variable.name}
                          {variable.required && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertText('{{#if }}\n\n{{/if}}')}
                        className="text-xs h-7 px-2 text-blue-600"
                      >
                        <Code className="h-3 w-3 mr-1" />
                        if
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertText('{{#each }}\n\n{{/each}}')}
                        className="text-xs h-7 px-2 text-green-600"
                      >
                        <Code className="h-3 w-3 mr-1" />
                        each
                      </Button>
                    </div>
                  </div>
                )}
                
                <Textarea
                  value={promptText}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  disabled={!isEditing}
                  className="min-h-[400px] font-mono text-sm resize-none"
                  placeholder="Escribe tu prompt aquí..."
                />
                
                {isUsingCustom && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800 dark:text-amber-200">
                        Usando prompt personalizado
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPromptText(template.defaultPrompt);
                        validatePrompt(template.defaultPrompt);
                      }}
                      disabled={!isEditing}
                    >
                      Ver original
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}