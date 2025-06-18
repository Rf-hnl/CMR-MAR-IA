'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';
import { FlowBuilder } from '@/components/conex/FlowBuilder';
import { Plus, Edit, Trash2, Play, Pause, Workflow, Clock, Zap, Webhook, TestTube } from 'lucide-react';
import { Flow, CreateFlowRequest } from '@/types/conex';

export default function FlowsPage() {
  const { user } = useAuth();
  const { currentOrganization: organization } = useOrganization();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [testingFlow, setTestingFlow] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateFlowRequest>({
    name: '',
    description: '',
    icon: 'Workflow',
    trigger: {
      type: 'manual_lead_action',
      config: {}
    },
    definition: { nodes: [], edges: [] },
    isEnabled: true
  });

  useEffect(() => {
    if (user && organization) {
      fetchFlows();
    }
  }, [user, organization]);

  const createDemoFlow = async () => {
    setSaving(true);
    try {
      const token = await user.getIdToken();
      
      const demoFlowData = {
        name: "Generar Cotización con API Externa (Demo)",
        description: "Crea cotización automática usando API externa basada en datos del lead",
        icon: 'FileText',
        trigger: {
          type: 'manual_lead_action',
          config: {}
        },
        definition: {
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              position: { x: 50, y: 200 },
              data: {
                name: 'Lead Trigger',
                config: {}
              }
            },
            {
              id: 'generate-quote-1',
              type: 'api_call',
              position: { x: 300, y: 100 },
              data: {
                name: 'Generar Cotización IA',
                config: {
                  connectionId: 'internal-api',
                  method: 'POST',
                  url: '/api/ai/generate-quote',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: {
                    leadName: '{{trigger.input.leadName}}',
                    leadEmail: '{{trigger.input.leadEmail}}',
                    businessType: '{{trigger.input.leadIndustry}}',
                    leadValue: '{{trigger.input.leadValue}}',
                    leadStage: '{{trigger.input.leadStage}}'
                  }
                }
              }
            },
            {
              id: 'create-document-1',
              type: 'api_call',
              position: { x: 600, y: 100 },
              data: {
                name: 'Crear Documento Profesional',
                config: {
                  connectionId: 'external-api',
                  method: 'POST',
                  url: 'https://api.ejemplo.com/documents',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer {{connections.external.token}}'
                  },
                  body: {
                    title: 'Cotización para {{trigger.input.leadName}}',
                    template_id: 'tu-template-id-aqui',
                    client: {
                      email: '{{trigger.input.leadEmail}}',
                      name: '{{trigger.input.leadName}}',
                      industry: '{{trigger.input.leadIndustry}}'
                    },
                    data: {
                      client_name: '{{trigger.input.leadName}}',
                      quote_total: '{{step_generate-quote-1.resumen_financiero.precio_recomendado}}',
                      quote_details: '{{step_generate-quote-1}}'
                    }
                  }
                }
              }
            },
            {
              id: 'save-quote-1',
              type: 'api_call',
              position: { x: 900, y: 100 },
              data: {
                name: 'Guardar Cotización',
                config: {
                  connectionId: 'internal-api',
                  method: 'POST',
                  url: '/api/quotes',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: {
                    quoteData: '{{step_generate-quote-1}}',
                    leadName: '{{trigger.input.leadName}}',
                    businessType: '{{trigger.input.leadIndustry}}',
                    organizationId: '{{trigger.input.organizationId}}',
                    documentId: '{{step_create-document-1.id}}'
                  }
                }
              }
            },
            {
              id: 'transform-1',
              type: 'data_transform',
              position: { x: 600, y: 300 },
              data: {
                name: 'Formatear Resultado',
                config: {
                  transformations: [
                    {
                      type: 'map',
                      source: 'step_create-document-1',
                      target: 'quoteResult',
                      mapping: {
                        'documentId': 'id',
                        'documentName': 'name',
                        'status': 'status',
                        'shareLink': 'share_link',
                        'clientName': 'recipients[0].first_name',
                        'clientEmail': 'recipients[0].email'
                      }
                    }
                  ]
                }
              }
            }
          ],
          edges: [
            {
              id: 'e1-2',
              source: 'trigger-1',
              target: 'generate-quote-1',
              type: 'smoothstep'
            },
            {
              id: 'e2-3',
              source: 'generate-quote-1',
              target: 'create-pandadoc-1',
              type: 'smoothstep'
            },
            {
              id: 'e3-4',
              source: 'create-pandadoc-1',
              target: 'save-quote-1',
              type: 'smoothstep'
            },
            {
              id: 'e3-5',
              source: 'create-pandadoc-1',
              target: 'transform-1',
              type: 'smoothstep'
            }
          ]
        },
        isEnabled: true
      };

      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(demoFlowData)
      });

      if (!response.ok) {
        throw new Error('Failed to create demo flow');
      }

      const newFlow = await response.json();
      setFlows(prev => [newFlow, ...prev]);
      
      toast({
        title: '📄 Demo creado',
        description: 'Flujo de cotización con API externa creado exitosamente'
      });
    } catch (error) {
      console.error('Error creating demo flow:', error);
      toast({
        title: 'Error',
        description: 'Error al crear el flujo demo',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchFlows = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/flows', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flows');
      }

      const data = await response.json();
      setFlows(data.flows);
    } catch (error) {
      console.error('Error fetching flows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flows',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create flow');
      }

      const newFlow = await response.json();
      setFlows(prev => [newFlow, ...prev]);
      setDialogOpen(false);
      resetForm();
      
      toast({
        title: 'Success',
        description: 'Flow created successfully'
      });
    } catch (error) {
      console.error('Error creating flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to create flow',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFlow = async (flowId: string, updates: Partial<Flow>) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/flows?id=${flowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update flow');
      }

      const updatedFlow = await response.json();
      setFlows(prev => prev.map(flow => flow.id === flowId ? updatedFlow : flow));
      
      toast({
        title: 'Success',
        description: 'Flow updated successfully'
      });
    } catch (error) {
      console.error('Error updating flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flow',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/flows?id=${flowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete flow');
      }

      setFlows(prev => prev.filter(flow => flow.id !== flowId));
      
      toast({
        title: 'Success',
        description: 'Flow deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete flow',
        variant: 'destructive'
      });
    }
  };

  const handleSaveFlowDefinition = async (flowData: { nodes: any[]; edges: any[] }) => {
    if (!editingFlow) return;

    setSaving(true);
    try {
      await handleUpdateFlow(editingFlow.id, { definition: flowData });
      setShowBuilder(false);
      setEditingFlow(null);
    } catch (error) {
      // Error already handled in handleUpdateFlow
    } finally {
      setSaving(false);
    }
  };

  const testFlow = async (flowId: string) => {
    setTestingFlow(flowId);
    try {
      const token = await user.getIdToken();
      
      // Datos de prueba para el demo - usar diferentes casos de negocio
      const testBusinesses = [
        { name: 'TechStart Solutions', industry: 'Technology', value: 15000 },
        { name: 'Marketing Pro Agency', industry: 'Marketing', value: 25000 },
        { name: 'Green Energy Corp', industry: 'Energy', value: 50000 },
        { name: 'Health Plus Clinic', industry: 'Healthcare', value: 30000 },
        { name: 'Finance Solutions Ltd', industry: 'Finance', value: 40000 }
      ];
      const randomBusiness = testBusinesses[Math.floor(Math.random() * testBusinesses.length)];
      
      const testPayload = {
        leadName: randomBusiness.name,
        leadEmail: `contacto@${randomBusiness.name.toLowerCase().replace(/\s+/g, '')}.com`,
        leadPhone: '+1234567890',
        leadStage: 'Interested',
        leadSource: 'API Demo',
        leadIndustry: randomBusiness.industry,
        leadValue: randomBusiness.value,
        organizationId: organization.id
      };

      const response = await fetch(`/api/flows/run/${flowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-organization-id': organization.id
        },
        body: JSON.stringify({ inputPayload: testPayload })
      });

      if (!response.ok) {
        throw new Error('Failed to test flow');
      }

      const result = await response.json();
      
      toast({
        title: `📄 Cotización para ${randomBusiness.name} Generada`,
        description: `Flujo ejecutado exitosamente. Revisa la consola para ver los detalles.`,
      });
      
      // Mostrar resultado detallado en consola
      console.log('🎯 RESULTADO DEL FLUJO PANDADOC:', {
        business: randomBusiness.name,
        industry: randomBusiness.industry,
        value: randomBusiness.value,
        executionId: result.executionId,
        status: result.status,
        fullResults: result
      });
      
      // Si hay resultados de transformación, mostrarlos de forma organizada
      if (result.results && Object.keys(result.results).length > 0) {
        console.log('📊 DATOS TRANSFORMADOS:');
        Object.entries(result.results).forEach(([stepId, stepResult]: [string, any]) => {
          console.log(`\n🔸 ${stepId}:`, stepResult);
          
          // Si este paso tiene datos de cotización, mostrarlo destacado
          if (stepResult?.quoteResult) {
            console.log('📄 COTIZACIÓN CREADA:', {
              documentId: stepResult.quoteResult.documentId,
              documentName: stepResult.quoteResult.documentName,
              status: stepResult.quoteResult.status,
              shareLink: stepResult.quoteResult.shareLink,
              clientName: stepResult.quoteResult.clientName,
              clientEmail: stepResult.quoteResult.clientEmail
            });
          }
          
          // Si este paso tiene datos de generación de IA, mostrarlo
          if (stepResult?.resumen_financiero) {
            console.log('💰 RESUMEN FINANCIERO:', {
              precioRecomendado: stepResult.resumen_financiero.precio_recomendado,
              titulo: stepResult.titulo,
              paqueteSugerido: stepResult.paquetes_sugeridos?.[0]?.nombre
            });
          }
          
          // Si este paso es un monitor, mostrar los datos capturados
          if (stepResult?.consoleLog) {
            console.group(stepResult.consoleLog.title);
            
            if (stepResult.consoleLog.timestamp) {
              console.log('⏰ Timestamp:', stepResult.consoleLog.timestamp);
            }
            
            switch (stepResult.consoleLog.format) {
              case 'table':
                console.log('📋 Datos en formato tabla:');
                console.log(stepResult.formattedOutput);
                break;
              case 'list':
                console.log('📝 Datos en formato lista:');
                console.log(stepResult.formattedOutput);
                break;
              case 'json':
              default:
                console.log('📦 Datos capturados:');
                console.log(stepResult.consoleLog.data);
                break;
            }
            
            console.groupEnd();
          }
        });
      }
      
    } catch (error) {
      console.error('Error testing flow:', error);
      toast({
        title: 'Error en prueba',
        description: error instanceof Error ? error.message : 'Error al probar el flujo',
        variant: 'destructive'
      });
    } finally {
      setTestingFlow(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Workflow',
      trigger: {
        type: 'manual_lead_action',
        config: {}
      },
      definition: { nodes: [], edges: [] },
      isEnabled: true
    });
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'manual_lead_action':
        return <Zap className="h-4 w-4" />;
      case 'schedule':
        return <Clock className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      default:
        return <Workflow className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels = {
      manual_lead_action: 'Manual',
      schedule: 'Scheduled',
      webhook: 'Webhook',
      event: 'Event'
    };
    return labels[triggerType as keyof typeof labels] || triggerType;
  };

  if (showBuilder) {
    return (
      <div className="h-screen">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">Flow Builder</h1>
            <p className="text-muted-foreground">
              {editingFlow ? `Editing: ${editingFlow.name}` : 'Create new flow'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowBuilder(false)}>
            Back to Flows
          </Button>
        </div>
        <div className="h-[calc(100vh-80px)]">
          <FlowBuilder
            onSave={handleSaveFlowDefinition}
            initialFlowData={editingFlow?.definition}
            loading={saving}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading flows...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Flujos Visuales</h1>
          <p className="text-muted-foreground mt-2">
            Diseña workflows arrastrando y conectando nodos visuales. Todo integrado en una sola vista.
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Flow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Flow</DialogTitle>
              <DialogDescription>
                Create a new automated workflow
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Flow Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Generate PandaDoc Quote"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this flow does..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Workflow">Workflow</SelectItem>
                    <SelectItem value="FileText">Document</SelectItem>
                    <SelectItem value="Mail">Email</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="Zap">Automation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select 
                  value={formData.trigger.type} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    trigger: { ...prev.trigger, type: value as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_lead_action">Manual (Lead Action)</SelectItem>
                    <SelectItem value="schedule">Scheduled</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                />
                <Label htmlFor="isEnabled">Enable flow</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFlow} disabled={saving}>
                {saving ? 'Creating...' : 'Create Flow'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full p-6 mb-6">
              <Workflow className="h-16 w-16 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-center">Crea tu Primer Flujo Visual</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md leading-relaxed">
              Arrastra nodos al canvas, configúralos y conéctalos. Todo en una sola vista visual sin código.
            </p>
            
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <Plus className="h-5 w-5 mr-2" />
                    Crear Primer Flujo
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-blue-600/50 text-blue-300 hover:bg-blue-700/20"
                onClick={createDemoFlow}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                    Creando Demo...
                  </>
                ) : (
                  <>
                    <span className="text-lg mr-2">📄</span>
                    Crear Flujo Demo API
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-1 gap-3 w-full">
                <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <p className="text-sm font-medium text-blue-200">Demo Integrado</p>
                  </div>
                  <p className="text-xs text-blue-300">
                    Flujo completo con API Call pre-configurado
                  </p>
                </div>
                
                <div className="bg-green-950/30 border border-green-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-sm font-medium text-green-200">Paso 1</p>
                  </div>
                  <p className="text-xs text-green-300">
                    Arrastra nodos PandaDoc al canvas visual
                  </p>
                </div>
                
                <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <p className="text-sm font-medium text-purple-200">Paso 2</p>
                  </div>
                  <p className="text-xs text-purple-300">
                    Configura API key y template directamente en el nodo
                  </p>
                </div>
                
                <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <p className="text-sm font-medium text-amber-200">Paso 3</p>
                  </div>
                  <p className="text-xs text-amber-300">
                    Conecta nodos y prueba desde acciones de IA en leads
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <Card key={flow.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Workflow className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{flow.name}</CardTitle>
                      <CardDescription>{flow.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testFlow(flow.id)}
                      disabled={testingFlow === flow.id}
                      title="Probar flujo"
                    >
                      {testingFlow === flow.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                      ) : (
                        <TestTube className="h-4 w-4 text-green-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFlow(flow);
                        setShowBuilder(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Flow</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{flow.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteFlow(flow.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTriggerIcon(flow.trigger.type)}
                      <Badge variant="outline">
                        {getTriggerLabel(flow.trigger.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={flow.isEnabled}
                        onCheckedChange={(checked) => handleUpdateFlow(flow.id, { isEnabled: checked })}
                        size="sm"
                      />
                      <span className="text-sm text-muted-foreground">
                        {flow.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Updated {new Date(flow.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}