"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Eye, 
  Code, 
  Wand2, 
  Copy, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Save,
  Upload,
  Trash2,
  Plus,
  Database
} from 'lucide-react';
import { PromptTemplate, PromptVariable } from '@/types/ai-prompts';
import { useToast } from '@/hooks/use-toast';

interface PromptPreviewProps {
  template: PromptTemplate;
  globalSettings: {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

interface TestData {
  [key: string]: string;
}

interface TestCase {
  id: string;
  name: string;
  data: TestData;
  createdAt: Date;
}

export default function PromptPreview({ template, globalSettings }: PromptPreviewProps) {
  const { toast } = useToast();
  const [testData, setTestData] = useState<TestData>({});
  const [processedPrompt, setProcessedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTokens, setEstimatedTokens] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [currentTestCase, setCurrentTestCase] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTestCaseName, setNewTestCaseName] = useState('');

  // Initialize test data with examples
  useEffect(() => {
    const initialData: TestData = {};
    template.variables.forEach(variable => {
      initialData[variable.name] = variable.example || '';
    });
    setTestData(initialData);
  }, [template]);

  // Process prompt with test data
  useEffect(() => {
    try {
      let processed = template.customPrompt || template.defaultPrompt;
      
      // Simple handlebars-like processing
      Object.entries(testData).forEach(([key, value]) => {
        // Replace {{{variable}}} with value
        processed = processed.replace(new RegExp(`{{{${key}}}}`, 'g'), value || '');
        // Replace {{variable}} with value
        processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        
        // Handle conditional blocks {{#if variable}}...{{/if}}
        if (value && value.trim()) {
          processed = processed.replace(
            new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g'),
            '$1'
          );
        } else {
          processed = processed.replace(
            new RegExp(`{{#if ${key}}}[\\s\\S]*?{{/if}}`, 'g'),
            ''
          );
        }
      });
      
      // Clean up any remaining handlebars syntax
      processed = processed.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, '');
      processed = processed.replace(/{{[^}]*}}/g, '[VARIABLE NO DEFINIDA]');
      processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n'); // Clean multiple newlines
      
      setProcessedPrompt(processed);
      setError(null);
    } catch (err) {
      setError('Error procesando el prompt');
      setProcessedPrompt('');
    }
  }, [testData, template]);

  const handleTestDataChange = (variableName: string, value: string) => {
    setTestData(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  // Estimate tokens and cost
  const estimateTokensAndCost = (text: string) => {
    // Rough estimation: 1 token ≈ 4 characters for English/Spanish mixed text
    const estimatedTokenCount = Math.ceil(text.length / 4);
    
    // Gemini pricing (approximate): $0.075 per 1M input tokens for Flash model
    const pricePerToken = 0.000000075; // $0.075 / 1,000,000
    const estimatedCostValue = estimatedTokenCount * pricePerToken;
    
    setEstimatedTokens(estimatedTokenCount);
    setEstimatedCost(estimatedCostValue);
  };

  // Update estimates when processed prompt changes
  useEffect(() => {
    if (processedPrompt) {
      estimateTokensAndCost(processedPrompt);
    }
  }, [processedPrompt]);

  // Test case management functions
  const saveCurrentTestCase = () => {
    if (!newTestCaseName.trim()) return;
    
    const newTestCase: TestCase = {
      id: `test_${Date.now()}`,
      name: newTestCaseName.trim(),
      data: { ...testData },
      createdAt: new Date()
    };
    
    setTestCases(prev => [...prev, newTestCase]);
    setCurrentTestCase(newTestCase.id);
    setNewTestCaseName('');
    setShowSaveDialog(false);
    
    toast({
      title: "Caso de prueba guardado",
      description: `"${newTestCase.name}" ha sido guardado correctamente.`
    });
  };

  const loadTestCase = (testCaseId: string) => {
    const testCase = testCases.find(tc => tc.id === testCaseId);
    if (testCase) {
      setTestData(testCase.data);
      setCurrentTestCase(testCaseId);
      toast({
        title: "Caso de prueba cargado",
        description: `"${testCase.name}" ha sido cargado.`
      });
    }
  };

  const deleteTestCase = (testCaseId: string) => {
    const testCase = testCases.find(tc => tc.id === testCaseId);
    if (testCase) {
      setTestCases(prev => prev.filter(tc => tc.id !== testCaseId));
      if (currentTestCase === testCaseId) {
        setCurrentTestCase(null);
      }
      toast({
        title: "Caso de prueba eliminado",
        description: `"${testCase.name}" ha sido eliminado.`
      });
    }
  };

  const clearCurrentData = () => {
    setTestData({});
    setCurrentTestCase(null);
    setGeneratedResult(null);
    setError(null);
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Check if all required variables have values
      const missingRequired = template.variables
        .filter(v => v.required && (!testData[v.name] || !testData[v.name].trim()))
        .map(v => v.name);
      
      if (missingRequired.length > 0) {
        throw new Error(`Variables requeridas faltantes: ${missingRequired.join(', ')}`);
      }

      // Create input based on template name
      let input: any = {};
      template.variables.forEach(variable => {
        const value = testData[variable.name];
        if (value && value.trim()) {
          if (variable.type === 'array') {
            try {
              input[variable.name] = JSON.parse(value);
            } catch {
              input[variable.name] = []; // Default to empty array if parsing fails
            }
          } else {
            input[variable.name] = value;
          }
        }
      });

      // Map template name to API endpoint
      const endpointMap: Record<string, string> = {
        'Mensaje de Bienvenida': '/api/ai/welcome-message',
        'Evaluación de Negocio': '/api/ai/evaluate-business',
        'Recomendaciones de Ventas': '/api/ai/sales-recommendations',
        'Email de Configuración TPV': '/api/ai/generate-solution-email'
      };

      const endpoint = endpointMap[template.name];
      if (!endpoint) {
        throw new Error('Endpoint no disponible para este template');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error del servidor (${response.status})`);
      }

      const result = await response.json();
      
      // Extract the relevant content based on template type
      let content = '';
      if (result.message) content = result.message;
      else if (result.evaluation) content = result.evaluation;
      else if (result.recommendations) content = JSON.stringify(result.recommendations, null, 2);
      else if (result.asunto && result.cuerpo) content = `ASUNTO: ${result.asunto}\n\nCUERPO:\n${result.cuerpo}`;
      else content = JSON.stringify(result, null, 2);

      setGeneratedResult(content);
      
      toast({
        title: "Éxito",
        description: "Contenido generado correctamente con IA.",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(processedPrompt);
    toast({
      title: "Copiado",
      description: "Prompt copiado al portapapeles.",
    });
  };

  const handleCopyResult = () => {
    if (generatedResult) {
      navigator.clipboard.writeText(generatedResult);
      toast({
        title: "Copiado",
        description: "Resultado copiado al portapapeles.",
      });
    }
  };

  const canGenerate = template.variables
    .filter(v => v.required)
    .every(v => testData[v.name] && testData[v.name].trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Vista Previa - {template.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Prueba tu prompt con datos de ejemplo antes de usarlo en producción
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {globalSettings.model}
              </Badge>
              <Badge variant="outline">
                Temp: {globalSettings.temperature}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          {/* Test Data */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Casos de Prueba
                </CardTitle>
                <div className="flex items-center gap-2">
                  {currentTestCase && (
                    <Badge variant="secondary" className="text-xs">
                      {testCases.find(tc => tc.id === currentTestCase)?.name}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={Object.keys(testData).length === 0}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                </div>
              </div>
              
              {/* Test Case Management */}
              {testCases.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Casos guardados:</Label>
                  <div className="flex flex-wrap gap-2">
                    {testCases.map((testCase) => (
                      <div key={testCase.id} className="flex items-center gap-1">
                        <Button
                          variant={currentTestCase === testCase.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => loadTestCase(testCase.id)}
                          className="text-xs h-7"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {testCase.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTestCase(testCase.id)}
                          className="h-7 w-7 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCurrentData}
                    className="text-xs text-muted-foreground"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Nuevo caso
                  </Button>
                </div>
              )}
              
              {/* Save Dialog */}
              {showSaveDialog && (
                <div className="border rounded-lg p-3 bg-muted/50">
                  <Label className="text-sm">Nombre del caso de prueba:</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newTestCaseName}
                      onChange={(e) => setNewTestCaseName(e.target.value)}
                      placeholder="Ej: Cliente ejemplo, Caso complejo..."
                      className="text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && saveCurrentTestCase()}
                    />
                    <Button size="sm" onClick={saveCurrentTestCase} disabled={!newTestCaseName.trim()}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {template.variables.map((variable) => (
                <div key={variable.name} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {variable.name}
                    {variable.required && (
                      <Badge variant="destructive" className="text-xs">
                        Requerida
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {variable.type}
                    </Badge>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {variable.description}
                  </p>
                  {variable.type === 'array' ? (
                    <Textarea
                      value={testData[variable.name] || ''}
                      onChange={(e) => handleTestDataChange(variable.name, e.target.value)}
                      placeholder={variable.example || 'Ingresa datos en formato JSON array'}
                      className="font-mono text-sm"
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={testData[variable.name] || ''}
                      onChange={(e) => handleTestDataChange(variable.name, e.target.value)}
                      placeholder={variable.example || `Ingresa ${variable.name}`}
                    />
                  )}
                </div>
              ))}
              
              <Separator />
              
              {estimatedTokens > 2000 && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Prompt largo detectado:</strong> ~{estimatedTokens.toLocaleString()} tokens estimados 
                    (costo aprox. ${estimatedCost.toFixed(4)}). Considere acortar el prompt para reducir costos.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {template.variables.filter(v => v.required && testData[v.name]?.trim()).length} / {template.variables.filter(v => v.required).length} requeridas completadas
                  </div>
                  {estimatedTokens > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Estimación: {estimatedTokens.toLocaleString()} tokens • ${estimatedCost.toFixed(6)}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={!canGenerate || isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isGenerating ? 'Generando...' : 'Generar con IA'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="space-y-6">
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prompt">Prompt Procesado</TabsTrigger>
              <TabsTrigger value="result">Resultado IA</TabsTrigger>
            </TabsList>
            
            <TabsContent value="prompt" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Prompt Final</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {processedPrompt || 'Complete los datos de prueba para ver el prompt procesado'}
                        </pre>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{processedPrompt.split(/\s+/).length} palabras</span>
                          <span>{processedPrompt.length} caracteres</span>
                        </div>
                        
                        {estimatedTokens > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              ~{estimatedTokens.toLocaleString()} tokens
                            </Badge>
                            <Badge variant="outline" className="text-xs text-green-600">
                              ~${estimatedCost.toFixed(6)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="result" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Resultado de IA</CardTitle>
                    {generatedResult && (
                      <Button variant="outline" size="sm" onClick={handleCopyResult}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">Generando contenido con IA...</p>
                      </div>
                    </div>
                  ) : generatedResult ? (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Contenido generado exitosamente con el modelo {globalSettings.model}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {generatedResult}
                        </pre>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{generatedResult.split(/\s+/).length} palabras</span>
                        <span>{generatedResult.length} caracteres</span>
                      </div>
                    </div>
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Complete los datos requeridos y haga clic en "Generar con IA"
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}