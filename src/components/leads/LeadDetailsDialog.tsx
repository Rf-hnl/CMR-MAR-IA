"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Phone, MessageSquareText, Globe, Mail, MapPin, 
  Building, Briefcase, Calendar, Clock, Edit2, Save, X, AlertCircle, 
  Image, User, FileText, History, CheckCircle2, 
  ExternalLink, Sparkles, Target, Users, Car, Home, 
  Tag, Hash, Database, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ExtendedLead as Lead, LeadImage, UnifiedLead } from '@/types';
import ImageUploader from '@/components/ImageUploader';
import { useToast } from '@/hooks/use-toast';
import { LEAD_STAGES, type LeadStage, stageColors, isFieldMissing, LOCAL_FALLBACK_SOURCE } from '@/lib/leads-utils';
import { useValuationConfig } from '@/hooks/useValuationConfig';
import { calculateLeadValuation, formatCurrency } from '@/lib/valuation-calculator';

interface LeadDetailsDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onUploadImages: (leadId: string, images: LeadImage[]) => Promise<void>;
  onDeleteImage: (leadId: string, imageId: string) => Promise<void>;
  onSetFeaturedImage: (leadId: string, imageId: string) => Promise<void>;
  isUploadingImages?: boolean;
  isDeletingImage?: string | null;
  isSettingFeaturedImage?: string | null;
}

const InfoField = ({ 
  icon: Icon, 
  label, 
  value, 
  isEditing, 
  editComponent, 
  isLink = false,
  className = "" 
}: {
  icon: any;
  label: string;
  value: string | null | undefined;
  isEditing: boolean;
  editComponent?: React.ReactNode;
  isLink?: boolean;
  className?: string;
}) => {
  const isEmpty = isFieldMissing(value);
  
  return (
    <div className={`group relative ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1 p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </Label>
          {isEditing && editComponent ? (
            editComponent
          ) : (
            <div className={`${isEmpty ? "text-muted-foreground italic" : ""}`}>
              {isEmpty ? (
                <span className="text-sm">No disponible</span>
              ) : isLink ? (
                <a 
                  href={value || undefined} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm font-medium"
                >
                  {value}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-sm font-medium">{value}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function LeadDetailsDialog({
  lead,
  open,
  onOpenChange,
  onUpdate,
  onUploadImages,
  onDeleteImage,
  onSetFeaturedImage,
  isUploadingImages = false,
  isDeletingImage = null,
  isSettingFeaturedImage = null
}: LeadDetailsDialogProps) {
  const { toast } = useToast();
  const { activeConfig } = useValuationConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (lead) {
      setEditedLead({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        website: lead.website,
        businessType: lead.businessType,
        notes: lead.notes,
        stage: lead.stage
      });
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = async () => {
    try {
      await onUpdate(lead.id, editedLead);
      setIsEditing(false);
      toast({
        title: "✅ Lead actualizado",
        description: "Los cambios se han guardado correctamente."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditedLead({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      website: lead.website,
      businessType: lead.businessType,
      notes: lead.notes,
      stage: lead.stage
    });
    setIsEditing(false);
  };

  const featuredImage = lead.images?.find(img => img.is_featured)?.secure_url;
  const isImported = lead.source === 'xml_import_ia' || lead.source === 'csv_import_ia';
  const isImportedIncomplete = isImported && (
    isFieldMissing(lead.address) ||
    isFieldMissing(lead.businessType) ||
    isFieldMissing(lead.company) ||
    isFieldMissing(lead.website)
  );
  const isLocal = lead.source === LOCAL_FALLBACK_SOURCE || (lead.source.includes('_import_ia') && !lead.placeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
                  <AvatarImage src={featuredImage} alt={lead.name} />
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {lead.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  {isEditing ? (
                    <Input
                      value={editedLead.name}
                      onChange={(e) => setEditedLead({...editedLead, name: e.target.value})}
                      className="text-2xl font-bold bg-background/80 backdrop-blur"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      {lead.name}
                      {isLocal && <Badge variant="secondary" className="text-xs">Local</Badge>}
                      {isImportedIncomplete && (
                        <div className="group relative">
                          <AlertCircle className="h-5 w-5 text-orange-400" />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Información incompleta
                          </span>
                        </div>
                      )}
                    </h2>
                  )}
                  {!isFieldMissing(lead.company) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      {isEditing ? (
                        <Input
                          value={editedLead.company || ''}
                          onChange={(e) => setEditedLead({...editedLead, company: e.target.value})}
                          placeholder="Empresa"
                          className="h-7 text-sm"
                        />
                      ) : (
                        <span className="text-sm">{lead.company}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${stageColors[lead.stage as LeadStage]} shadow-sm`}>
                      <Sparkles className="h-3 w-3 mr-1" />
                      {lead.stage}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {lead.source}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} className="shadow-sm">
                      <Save className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="shadow-sm">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <ScrollArea className="flex-1 px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
              <TabsTrigger value="overview" className="text-xs">
                <User className="h-4 w-4 mr-1" />
                General
              </TabsTrigger>
              <TabsTrigger value="business" className="text-xs">
                <Briefcase className="h-4 w-4 mr-1" />
                Negocio
              </TabsTrigger>
              <TabsTrigger value="marketing" className="text-xs">
                <Target className="h-4 w-4 mr-1" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs">
                <Image className="h-4 w-4 mr-1" />
                Media
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                <History className="h-4 w-4 mr-1" />
                Actividad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField
                      icon={Phone}
                      label="Teléfono"
                      value={lead.phone}
                      isEditing={isEditing}
                      editComponent={
                        <Input
                          value={editedLead.phone || ''}
                          onChange={(e) => setEditedLead({...editedLead, phone: e.target.value})}
                          placeholder="Número de teléfono"
                          className="text-sm"
                        />
                      }
                    />
                    
                    <InfoField
                      icon={Mail}
                      label="Email"
                      value={lead.email}
                      isEditing={isEditing}
                      editComponent={
                        <Input
                          type="email"
                          value={editedLead.email || ''}
                          onChange={(e) => setEditedLead({...editedLead, email: e.target.value})}
                          placeholder="Correo electrónico"
                          className="text-sm"
                        />
                      }
                    />
                    
                    <InfoField
                      icon={Globe}
                      label="Sitio Web"
                      value={lead.website}
                      isEditing={isEditing}
                      isLink={true}
                      editComponent={
                        <Input
                          value={editedLead.website || ''}
                          onChange={(e) => setEditedLead({...editedLead, website: e.target.value})}
                          placeholder="URL del sitio web"
                          className="text-sm"
                        />
                      }
                    />
                    
                    <InfoField
                      icon={MapPin}
                      label="Dirección"
                      value={lead.address}
                      isEditing={isEditing}
                      editComponent={
                        <Input
                          value={editedLead.address || ''}
                          onChange={(e) => setEditedLead({...editedLead, address: e.target.value})}
                          placeholder="Dirección"
                          className="text-sm"
                        />
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Valor Unitario Card */}
              {activeConfig && (
                <Card className="border shadow-sm bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      Valoración del Lead
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const valuation = calculateLeadValuation(lead, activeConfig);
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/30 backdrop-blur-sm">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Valor Unitario (VU)</p>
                              <p className="text-xs text-muted-foreground/70">Proyección basada en etapa actual</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{valuation.formattedValue}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1 p-2 bg-muted/30 rounded border border-border/20">
                              <p className="font-medium text-muted-foreground">Valor Base</p>
                              <p className="font-semibold text-foreground">{formatCurrency(valuation.baseValue)}</p>
                            </div>
                            <div className="space-y-1 p-2 bg-muted/30 rounded border border-border/20">
                              <p className="font-medium text-muted-foreground">Multiplicador Etapa</p>
                              <p className="font-semibold text-accent">{Math.round(valuation.stageMultiplier * 100)}%</p>
                            </div>
                            <div className="space-y-1 p-2 bg-muted/30 rounded border border-border/20">
                              <p className="font-medium text-muted-foreground">Bonus Datos</p>
                              <p className="font-semibold text-green-400">+{formatCurrency(valuation.completenessBonus)}</p>
                            </div>
                            <div className="space-y-1 p-2 bg-muted/30 rounded border border-border/20">
                              <p className="font-medium text-muted-foreground">Bonus IA</p>
                              <p className="font-semibold text-purple-400">+{formatCurrency(valuation.aiBonus)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    Información del Negocio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoField
                    icon={Briefcase}
                    label="Tipo de Negocio"
                    value={lead.businessType}
                    isEditing={isEditing}
                    editComponent={
                      <Input
                        value={editedLead.businessType || ''}
                        onChange={(e) => setEditedLead({...editedLead, businessType: e.target.value})}
                        placeholder="Tipo de negocio"
                        className="text-sm"
                      />
                    }
                  />

                  {/* Interest Information */}
                  {(!isFieldMissing(lead.vehicle) || !isFieldMissing(lead.homeListing)) && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Interés Específico
                        </h4>
                        
                        {!isFieldMissing(lead.vehicle) && (
                          <InfoField
                            icon={Car}
                            label="Vehículo de Interés"
                            value={lead.vehicle}
                            isEditing={false}
                          />
                        )}
                        
                        {!isFieldMissing(lead.homeListing) && (
                          <InfoField
                            icon={Home}
                            label="Propiedad de Interés"
                            value={lead.homeListing}
                            isEditing={false}
                          />
                        )}

                        {lead.visitRequest === 'yes' && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <Home className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Solicita visita</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Notas
                      </Label>
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={editedLead.notes || ''}
                        onChange={(e) => setEditedLead({...editedLead, notes: e.target.value})}
                        placeholder="Agregar notas sobre este lead..."
                        rows={6}
                        className="resize-none text-sm"
                      />
                    ) : (
                      <div className={`p-4 rounded-lg bg-muted/30 ${isFieldMissing(lead.notes) ? "text-muted-foreground italic" : ""}`}>
                        <p className="whitespace-pre-wrap text-sm">
                          {isFieldMissing(lead.notes) ? "Sin notas" : lead.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="marketing" className="space-y-4 mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    Información de Marketing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField
                      icon={Target}
                      label="Campaña"
                      value={lead.campaignName}
                      isEditing={false}
                    />
                    
                    <InfoField
                      icon={Users}
                      label="Conjunto de Anuncios"
                      value={lead.adSetName}
                      isEditing={false}
                    />
                    
                    <InfoField
                      icon={Tag}
                      label="Anuncio"
                      value={lead.adName}
                      isEditing={false}
                    />
                    
                    <InfoField
                      icon={Building}
                      label="Socio/Fuente"
                      value={lead.partnerName}
                      isEditing={false}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoField
                      icon={Hash}
                      label="ID de Campaña"
                      value={lead.campaignId}
                      isEditing={false}
                    />
                    
                    <InfoField
                      icon={Hash}
                      label="ID de Conjunto"
                      value={lead.adSetId}
                      isEditing={false}
                    />
                    
                    <InfoField
                      icon={Hash}
                      label="ID de Lead"
                      value={lead.leadId}
                      isEditing={false}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField
                      icon={Database}
                      label="ID de Formulario"
                      value={lead.formId}
                      isEditing={false}
                    />
                    
                    <InfoField
                      icon={Database}
                      label="ID de Plataforma"
                      value={lead.platformId}
                      isEditing={false}
                    />
                  </div>

                  {!isFieldMissing(lead.retailerItemId) && (
                    <InfoField
                      icon={Tag}
                      label="ID de Artículo Retailer"
                      value={lead.retailerItemId}
                      isEditing={false}
                    />
                  )}

                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <div className={`w-3 h-3 rounded-full ${lead.isOrganic === 'true' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <span className="text-sm font-medium">
                      Tipo: {lead.isOrganic === 'true' ? 'Orgánico' : 'Pagado'}
                    </span>
                  </div>

                  {!isFieldMissing(lead.customDisclaimerResponses) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Respuestas Personalizadas
                        </Label>
                        <div className="p-4 rounded-lg bg-muted/30">
                          <p className="whitespace-pre-wrap text-sm">{lead.customDisclaimerResponses}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <Image className="h-4 w-4 text-primary" />
                    </div>
                    Gestión de Imágenes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    onUploadSuccess={uploadResult => onUploadImages(lead.id, [{
                      public_id: uploadResult.public_id,
                      secure_url: uploadResult.secure_url,
                      is_featured: !lead.images || lead.images.length === 0,
                      uploaded_at: new Date().toISOString()
                    }])}
                    contextId={lead.id}
                  />
                  
                  {lead.images && lead.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {lead.images.map((image) => (
                        <div key={image.public_id} className="relative group rounded-lg overflow-hidden shadow-sm">
                          <img 
                            src={image.secure_url} 
                            alt="Lead image"
                            className="w-full h-32 object-cover"
                          />
                          {image.is_featured && (
                            <Badge className="absolute top-2 left-2 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Principal
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <History className="h-4 w-4 text-primary" />
                    </div>
                    Historial y Actividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Original Meta Lead Creation Date */}
                    {!isFieldMissing(lead.dateCreated) && (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Fecha de creación del lead (Meta)</p>
                            <p className="text-xs text-blue-600">
                              {(() => {
                                try {
                                  return format(new Date(lead.dateCreated), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
                                } catch {
                                  return lead.dateCreated;
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* System Creation Date */}
                    {lead.createdAt && (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Fecha de importación al sistema</p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                lead.createdAt instanceof Date
                                  ? lead.createdAt
                                  : (typeof lead.createdAt === "object" && "toDate" in lead.createdAt)
                                    ? (lead.createdAt as any).toDate()
                                    : new Date(lead.createdAt),
                                "d 'de' MMMM, yyyy 'a las' HH:mm",
                                { locale: es }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* System Update Date */}
                    {lead.updatedAt && (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Última actualización del sistema</p>
                            <p className="text-xs text-muted-foreground">
                              {(() => {
                                try {
                                  let date;
                                  if (lead.updatedAt instanceof Date) {
                                    date = lead.updatedAt;
                                  } else if (typeof lead.updatedAt === "object" && "toDate" in lead.updatedAt) {
                                    date = (lead.updatedAt as any).toDate();
                                  } else if (typeof lead.updatedAt === 'string') {
                                    // Try to parse as ISO string or Meta format
                                    date = new Date(lead.updatedAt);
                                  } else {
                                    date = new Date(lead.updatedAt);
                                  }
                                  return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
                                } catch {
                                  return String(lead.updatedAt);
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lead Source Information */}
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Información de Origen
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/20 border">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Fuente</p>
                          <p className="text-sm font-medium">{lead.source}</p>
                        </div>
                        
                        {lead.placeId && (
                          <div className="p-3 rounded-lg bg-muted/20 border">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Place ID</p>
                            <p className="text-sm font-medium font-mono">{lead.placeId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <DialogFooter className="px-6 py-4">
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}