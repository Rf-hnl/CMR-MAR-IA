"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LoadingComponent from '@/components/LoadingComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, AlertCircle, CheckCircle, FileUp, Database } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const LEAD_STAGES_CLIENT = [
  "Nuevo",
  "Contactado", 
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

type LeadStageClient = typeof LEAD_STAGES_CLIENT[number];

interface ImportedLead {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  stage?: LeadStageClient;
  source?: string;
  notes?: string;
  value?: number;
}

export default function LeadSourcesImportPage() {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();

  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [fileType, setFileType] = useState<'csv' | 'json'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [defaultStage, setDefaultStage] = useState<LeadStageClient>('Nuevo');
  const [defaultSource, setDefaultSource] = useState('import');
  const [previewData, setPreviewData] = useState<ImportedLead[]>([]);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialLoadDone && !user) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, router]);

  const parseCSV = (text: string): ImportedLead[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe tener al menos una línea de encabezados y una de datos');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leads: ImportedLead[] = [];
    const newErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
      
      if (values.length !== headers.length) {
        newErrors.push(`Línea ${i + 1}: Número incorrecto de columnas`);
        continue;
      }

      const lead: ImportedLead = {
        name: '',
        stage: defaultStage,
        source: defaultSource
      };

      headers.forEach((header, index) => {
        const value = values[index];
        
        switch (header) {
          case 'name':
          case 'nombre':
            lead.name = value;
            break;
          case 'email':
          case 'correo':
            lead.email = value;
            break;
          case 'phone':
          case 'telefono':
          case 'teléfono':
            lead.phone = value;
            break;
          case 'company':
          case 'empresa':
            lead.company = value;
            break;
          case 'address':
          case 'direccion':
          case 'dirección':
            lead.address = value;
            break;
          case 'stage':
          case 'etapa':
            if (LEAD_STAGES_CLIENT.includes(value as LeadStageClient)) {
              lead.stage = value as LeadStageClient;
            }
            break;
          case 'source':
          case 'fuente':
            lead.source = value || defaultSource;
            break;
          case 'notes':
          case 'notas':
            lead.notes = value;
            break;
          case 'value':
          case 'valor':
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              lead.value = numValue;
            }
            break;
        }
      });

      if (!lead.name) {
        newErrors.push(`Línea ${i + 1}: El nombre es requerido`);
        continue;
      }

      leads.push(lead);
    }

    setErrors(newErrors);
    return leads;
  };

  const parseJSON = (text: string): ImportedLead[] => {
    try {
      const data = JSON.parse(text);
      const leads: ImportedLead[] = [];
      const newErrors: string[] = [];

      if (!Array.isArray(data)) {
        throw new Error('El JSON debe ser un array de objetos');
      }

      data.forEach((item, index) => {
        if (typeof item !== 'object' || item === null) {
          newErrors.push(`Elemento ${index + 1}: Debe ser un objeto`);
          return;
        }

        if (!item.name && !item.nombre) {
          newErrors.push(`Elemento ${index + 1}: El nombre es requerido`);
          return;
        }

        const lead: ImportedLead = {
          name: item.name || item.nombre || '',
          email: item.email || item.correo || '',
          phone: item.phone || item.telefono || item.teléfono || '',
          company: item.company || item.empresa || '',
          address: item.address || item.direccion || item.dirección || '',
          stage: LEAD_STAGES_CLIENT.includes(item.stage || item.etapa) 
            ? (item.stage || item.etapa) 
            : defaultStage,
          source: item.source || item.fuente || defaultSource,
          notes: item.notes || item.notas || '',
          value: typeof item.value === 'number' ? item.value : 
                 typeof item.valor === 'number' ? item.valor : undefined,
        };

        leads.push(lead);
      });

      setErrors(newErrors);
      return leads;
    } catch (error) {
      throw new Error(`Error parsing JSON: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        let leads: ImportedLead[] = [];
        
        if (file.name.endsWith('.csv') || fileType === 'csv') {
          leads = parseCSV(text);
        } else if (file.name.endsWith('.json') || fileType === 'json') {
          leads = parseJSON(text);
        } else {
          throw new Error('Formato de archivo no soportado');
        }
        
        setPreviewData(leads);
        toast({
          title: "Archivo procesado",
          description: `${leads.length} leads encontrados para importar`
        });
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Error procesando archivo']);
        setPreviewData([]);
      }
    };
    
    reader.readAsText(file);
  };

  const handleTextProcess = () => {
    if (!textInput.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa datos para procesar",
        variant: "destructive"
      });
      return;
    }

    try {
      let leads: ImportedLead[] = [];
      
      if (fileType === 'csv') {
        leads = parseCSV(textInput);
      } else {
        leads = parseJSON(textInput);
      }
      
      setPreviewData(leads);
      toast({
        title: "Datos procesados",
        description: `${leads.length} leads encontrados para importar`
      });
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Error procesando datos']);
      setPreviewData([]);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para importar",
        variant: "destructive"
      });
      return;
    }

    if (!user || !currentOrganization) {
      toast({
        title: "Error de Autenticación",
        description: "Por favor, inicia sesión para importar leads.",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leads: previewData.map(lead => ({
            fullName: lead.name,
            email: lead.email,
            phoneNumber: lead.phone,
            companyName: lead.company,
            address: lead.address,
            currentStage: lead.stage,
            source: lead.source,
            notes: lead.notes,
            estimatedValue: lead.value,
          })),
          organizationId: currentOrganization.id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al importar leads');
      }

      const savedCount = result.saved || 0;
      const totalCount = result.total || 0;

      toast({
        title: "Importación Exitosa",
        description: `${savedCount} de ${totalCount} leads importados correctamente`
      });

      // Clear data after successful import
      setPreviewData([]);
      setSelectedFile(null);
      setTextInput('');
      setErrors([]);

    } catch (error: any) {
      console.error("Error importing leads:", error);
      toast({
        title: "Error en Importación",
        description: error.message || "Error desconocido al importar leads",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  if (authLoading || orgLoading || !initialLoadDone) {
    return <LoadingComponent message="Cargando importación..." />;
  }

  if (!user && initialLoadDone) {
    return <LoadingComponent message="Redirigiendo al inicio de sesión..." size="small" />;
  }
  
  if (!user || !currentOrganization) {
     return <LoadingComponent message="Cargando organización..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-background border-b border-border flex-shrink-0">
        <div className="p-4 sm:p-6 lg:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Importar CSV/JSON</h1>
              <p className="text-muted-foreground mt-1">
                Importa leads desde archivos CSV o JSON a tu base de datos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Import Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Configuración de Importación
                </CardTitle>
                <CardDescription>
                  Configura los parámetros para importar tus leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Import Method */}
                <div className="space-y-2">
                  <Label>Método de Importación</Label>
                  <Select value={importMethod} onValueChange={(value: 'file' | 'text') => setImportMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">Subir Archivo</SelectItem>
                      <SelectItem value="text">Pegar Texto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File Type */}
                <div className="space-y-2">
                  <Label>Formato de Datos</Label>
                  <Select value={fileType} onValueChange={(value: 'csv' | 'json') => setFileType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Values */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Etapa por Defecto</Label>
                    <Select value={defaultStage} onValueChange={(value: LeadStageClient) => setDefaultStage(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STAGES_CLIENT.map(stage => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuente por Defecto</Label>
                    <Select value={defaultSource} onValueChange={setDefaultSource}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="import">Import</SelectItem>
                        <SelectItem value="csv_upload">CSV Upload</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="other">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* File Upload or Text Input */}
                {importMethod === 'file' ? (
                  <div className="space-y-2">
                    <Label>Seleccionar Archivo</Label>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileChange}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Pegar Datos ({fileType.toUpperCase()})</Label>
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={
                        fileType === 'csv' 
                          ? "name,email,phone,company\nJuan Pérez,juan@email.com,123456789,Empresa ABC"
                          : '[{"name":"Juan Pérez","email":"juan@email.com","phone":"123456789","company":"Empresa ABC"}]'
                      }
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleTextProcess} variant="outline" className="w-full">
                      Procesar Datos
                    </Button>
                  </div>
                )}

                {/* Format Examples */}
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Campos soportados:</strong> name/nombre, email/correo, phone/telefono, 
                    company/empresa, address/direccion, stage/etapa, source/fuente, notes/notas, value/valor
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Preview and Results */}
          <div className="space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Errores encontrados:</strong>
                    {errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-sm">• {error}</div>
                    ))}
                    {errors.length > 5 && (
                      <div className="text-sm">... y {errors.length - 5} errores más</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Vista Previa
                  </span>
                  {previewData.length > 0 && (
                    <Badge variant="secondary">{previewData.length} leads</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Revisa los datos antes de importar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileUp className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p>No hay datos para mostrar</p>
                    <p className="text-sm mt-1">Sube un archivo o pega datos para ver la preview</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {previewData.slice(0, 10).map((lead, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{lead.name}</h4>
                            <div className="text-xs text-muted-foreground space-y-1 mt-1">
                              {lead.email && <div>📧 {lead.email}</div>}
                              {lead.phone && <div>📱 {lead.phone}</div>}
                              {lead.company && <div>🏢 {lead.company}</div>}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs mb-1">
                              {lead.stage}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {lead.source}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {previewData.length > 10 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... y {previewData.length - 10} leads más
                      </div>
                    )}
                  </div>
                )}

                {previewData.length > 0 && (
                  <div className="flex justify-end pt-4 border-t border-border mt-4">
                    <Button
                      onClick={handleImport}
                      disabled={importing || errors.length > 0}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {importing ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                          Importando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Importar {previewData.length} Leads
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}