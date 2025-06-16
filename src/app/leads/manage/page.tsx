"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, FileUp, Upload, Type, User, Phone, Mail, MapPin, Building2, Calendar, DollarSign, Star, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

const LeadManagePage = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

  // Manual form state
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
    source: 'manual',
    stage: 'nuevo',
    priority: 'medium',
    estimatedValue: ''
  });

  // Import state
  const [importData, setImportData] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'file' | 'text'>('file');
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.email || !manualForm.phone) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa nombre, email y teléfono.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear lead');
      }

      toast({
        title: "Lead creado",
        description: "El lead se ha creado exitosamente."
      });

      // Reset form
      setManualForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        notes: '',
        source: 'manual',
        stage: 'nuevo',
        priority: 'medium',
        estimatedValue: ''
      });

      // Redirect to leads flow
      router.push('/leads');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportData(content);
        const fileType = file.name.endsWith('.json') ? 'json' : 
                        file.name.endsWith('.xml') ? 'xml' : 'csv';
        parseImportData(content, fileType);
      };
      reader.readAsText(file);
    }
  };

  const parseImportData = (data: string, fileType: 'json' | 'xml' | 'csv') => {
    try {
      let parsed: any[] = [];
      
      if (fileType === 'json') {
        const jsonData = JSON.parse(data);
        parsed = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else if (fileType === 'xml') {
        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        
        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          throw new Error('Invalid XML format');
        }
        
        // Look for common lead elements (lead, record, item, etc.)
        const leadElements = xmlDoc.querySelectorAll('lead, record, item, row, entry');
        
        if (leadElements.length === 0) {
          // If no common elements found, try to get all direct children of root
          const rootChildren = xmlDoc.documentElement?.children;
          if (rootChildren && rootChildren.length > 0) {
            for (let i = 0; i < rootChildren.length; i++) {
              const element = rootChildren[i];
              const obj: any = {};
              
              // Get all child elements as properties
              for (let j = 0; j < element.children.length; j++) {
                const child = element.children[j];
                obj[child.tagName] = child.textContent || '';
              }
              
              // Also get attributes
              for (let k = 0; k < element.attributes.length; k++) {
                const attr = element.attributes[k];
                obj[attr.name] = attr.value;
              }
              
              if (Object.keys(obj).length > 0) {
                parsed.push(obj);
              }
            }
          }
        } else {
          // Process found lead elements
          leadElements.forEach((element) => {
            const obj: any = {};
            
            // Get all child elements as properties
            for (let i = 0; i < element.children.length; i++) {
              const child = element.children[i];
              obj[child.tagName] = child.textContent || '';
            }
            
            // Also get attributes
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];
              obj[attr.name] = attr.value;
            }
            
            if (Object.keys(obj).length > 0) {
              parsed.push(obj);
            }
          });
        }
      } else {
        // Parse CSV
        const lines = data.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        parsed = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      }
      
      setPreviewData(parsed.slice(0, 5)); // Show first 5 for preview
    } catch (error) {
      toast({
        title: "Error de formato",
        description: `No se pudo procesar el archivo ${fileType.toUpperCase()}. Verifica el formato.`,
        variant: "destructive"
      });
    }
  };

  const handleTextImport = () => {
    if (!importData.trim()) {
      toast({
        title: "Datos requeridos",
        description: "Por favor ingresa los datos a importar.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Auto-detect format
      const trimmedData = importData.trim();
      let fileType: 'json' | 'xml' | 'csv' = 'csv';
      
      if (trimmedData.startsWith('{') || trimmedData.startsWith('[')) {
        fileType = 'json';
      } else if (trimmedData.startsWith('<')) {
        fileType = 'xml';
      }
      
      parseImportData(importData, fileType);
    } catch (error) {
      toast({
        title: "Error de formato",
        description: "Verifica que los datos estén en formato CSV, JSON o XML válido.",
        variant: "destructive"
      });
    }
  };

  const handleImportSubmit = async () => {
    if (previewData.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay datos válidos para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: previewData })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al importar leads');
      }

      const result = await response.json();
      toast({
        title: "Importación completada",
        description: `${result.imported} leads importados exitosamente.`
      });

      // Reset import state
      setImportData('');
      setImportFile(null);
      setPreviewData([]);
      
      // Redirect to leads flow
      router.push('/leads');
    } catch (error: any) {
      toast({
        title: "Error en importación",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agregar Leads</h1>
          <p className="text-muted-foreground">
            Crea leads manualmente o importa desde archivos CSV/JSON/XML
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Importar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Crear Lead Manual
              </CardTitle>
              <CardDescription>
                Completa los datos del nuevo lead. Los campos marcados con * son obligatorios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({...manualForm, email: e.target.value})}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({...manualForm, phone: e.target.value})}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={manualForm.company}
                      onChange={(e) => setManualForm({...manualForm, company: e.target.value})}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Etapa</Label>
                    <Select value={manualForm.stage} onValueChange={(value) => setManualForm({...manualForm, stage: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuevo">Nuevo</SelectItem>
                        <SelectItem value="contactado">Contactado</SelectItem>
                        <SelectItem value="calificado">Calificado</SelectItem>
                        <SelectItem value="propuesta">Propuesta</SelectItem>
                        <SelectItem value="negociacion">Negociación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select value={manualForm.priority} onValueChange={(value) => setManualForm({...manualForm, priority: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedValue">Valor Estimado</Label>
                    <Input
                      id="estimatedValue"
                      type="number"
                      value={manualForm.estimatedValue}
                      onChange={(e) => setManualForm({...manualForm, estimatedValue: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={manualForm.address}
                      onChange={(e) => setManualForm({...manualForm, address: e.target.value})}
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({...manualForm, notes: e.target.value})}
                    placeholder="Información adicional sobre el lead..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => router.push('/leads')}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creando...' : 'Crear Lead'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Importar Leads
              </CardTitle>
              <CardDescription>
                Importa múltiples leads desde archivos CSV, JSON o XML, o pega los datos directamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={importMode} onValueChange={(value) => setImportMode(value as 'file' | 'text')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Subir Archivo
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Pegar Datos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-foreground">
                            Selecciona un archivo CSV, JSON o XML
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Máximo 10MB - CSV, JSON, XML
                          </span>
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv,.json,.xml"
                          onChange={handleFileUpload}
                          className="sr-only"
                        />
                      </div>
                    </div>
                  </div>
                  {importFile && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{importFile.name}</span>
                      <Badge variant="secondary">{importFile.size} bytes</Badge>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-data">Datos CSV, JSON o XML</Label>
                    <Textarea
                      id="import-data"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Pega aquí tus datos en formato CSV, JSON o XML..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button onClick={handleTextImport} variant="outline">
                    Procesar Datos
                  </Button>
                </TabsContent>
              </Tabs>

              {previewData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Vista Previa</h3>
                    <Badge variant="secondary">{previewData.length} leads</Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(previewData[0] || {}).map(key => (
                              <th key={key} className="px-4 py-2 text-left font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((item, index) => (
                            <tr key={index} className="border-t">
                              {Object.values(item).map((value: any, idx) => (
                                <td key={idx} className="px-4 py-2 max-w-[200px] truncate">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setPreviewData([]);
                        setImportData('');
                        setImportFile(null);
                      }}
                    >
                      Limpiar
                    </Button>
                    <Button onClick={handleImportSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Importando...' : 'Importar Leads'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadManagePage;