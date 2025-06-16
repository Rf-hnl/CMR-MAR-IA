
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Mail, Settings, Save, Loader2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EmailConfig {
  senderEmail: string;
  senderName: string;
}

interface EmailConfigDocument extends EmailConfig {
  uid: string;
  updatedAt: Timestamp;
}

export default function EmailCampaignsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    senderEmail: "",
    senderName: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmailConfig = async () => {
      if (user) {
        setIsLoadingConfig(true);
        try {
          const configDocRef = doc(db, "userEmailConfigurations", user.uid);
          const docSnap = await getDoc(configDocRef);
          if (docSnap.exists()) {
            const configData = docSnap.data() as EmailConfigDocument;
            setEmailConfig({
              senderEmail: configData.senderEmail,
              senderName: configData.senderName,
            });
          }
        } catch (error) {
          console.error("Error fetching email configuration:", error);
          toast({
            title: "Error al Cargar Configuración",
            description: "No se pudo cargar la configuración de envío guardada.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingConfig(false);
        }
      } else if (!authLoading) {
        // If no user and auth is done loading, stop loading config
        setIsLoadingConfig(false);
      }
    };

    if (!authLoading) {
      fetchEmailConfig();
    }
  }, [user, authLoading, toast]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailConfig({ ...emailConfig, [e.target.name]: e.target.value });
  };

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Usuario no autenticado",
        description: "Por favor, inicia sesión para guardar la configuración.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);

    if (!emailConfig.senderEmail || !emailConfig.senderName) {
      toast({
        title: "Campos Requeridos",
        description: "Por favor, completa el Email y Nombre del Remitente.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(emailConfig.senderEmail)) {
      toast({
        title: "Email Inválido",
        description: "Por favor, introduce una dirección de email válida.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    try {
      const configDocRef = doc(db, "userEmailConfigurations", user.uid);
      await setDoc(configDocRef, {
        ...emailConfig,
        uid: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true }); // Use merge true if you want to only update these fields

      toast({
        title: "Configuración Guardada",
        description: "La configuración de envío de email se ha guardado en Firebase.",
      });
      setIsConfigModalOpen(false);
    } catch (error) {
      console.error("Error saving email configuration:", error);
      toast({
        title: "Error al Guardar",
        description: "No se pudo guardar la configuración en Firebase.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-0 md:p-0">
      <div className="container mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center">
            <Mail className="mr-3 h-7 w-7 text-primary" />
            Campañas de Email
          </h1>
          <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-card text-card-foreground hover:bg-muted">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Configuración de Envío
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-popover text-popover-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-xl text-foreground flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Configuración de Envío de Email
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-1">
                  Configura la dirección y nombre del remitente para tus campañas. Esta información se guardará para tu usuario.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveConfig}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="senderEmailModal" className="text-sm font-medium text-foreground">
                      Email Remitente
                    </Label>
                    <Input
                      id="senderEmailModal"
                      name="senderEmail"
                      type="email"
                      placeholder="tu@emailvalido.com"
                      value={emailConfig.senderEmail}
                      onChange={handleConfigChange}
                      className="bg-input text-foreground placeholder:text-muted-foreground"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Este email aparecerá como el remitente.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="senderNameModal" className="text-sm font-medium text-foreground">
                      Nombre Remitente
                    </Label>
                    <Input
                      id="senderNameModal"
                      name="senderName"
                      type="text"
                      placeholder="El Nombre de tu Empresa"
                      value={emailConfig.senderName}
                      onChange={handleConfigChange}
                      className="bg-input text-foreground placeholder:text-muted-foreground"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Este nombre aparecerá junto al email remitente.</p>
                  </div>
                  <Separator className="my-2 bg-border" />
                  <div className="space-y-1">
                     <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Nota Importante:</strong> Para enviar correos de forma efectiva, necesitarás integrar un Proveedor de Servicios de Email (ESP) como SendGrid, Mailgun, o AWS SES. Esta configuración se conectaría con dicho servicio.
                    </p>
                  </div>
                </div>
                <DialogFooter className="sm:justify-end gap-2 sm:gap-0">
                  <DialogClose asChild>
                     <Button type="button" variant="outline" className="border-muted-foreground text-muted-foreground hover:bg-muted/30">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar Configuración
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-4">
          <Card className="bg-card shadow-sm border-border min-h-[calc(100vh-250px)]">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-xl text-foreground">Mis Campañas</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Aquí verás la lista de tus campañas de email creadas y su rendimiento.
                  </CardDescription>
                </div>
                <Button variant="outline" className="bg-card text-primary border-primary hover:bg-primary/10 hover:text-primary w-full sm:w-auto" disabled>
                  <PlusCircle className="mr-2 h-5 w-5" /> Crear Nueva Campaña (Próximamente)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-20 text-muted-foreground">
                <Mail className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">Aún no has creado ninguna campaña.</p>
                <p className="text-sm mt-1">Haz clic en "Crear Nueva Campaña" para empezar.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
