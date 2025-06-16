
"use client";

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import LoadingSpinner from '@/components/LoadingSpinner';
import { PlusCircle, Briefcase, Loader2, Trash2, Edit2, UploadCloud } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp as FirestoreTimestamp, writeBatch } from 'firebase/firestore';
import type { Service } from '@/types';

function formatDisplayTimestamp(timestamp: FirestoreTimestamp | string | undefined): string {
  if (!timestamp) return 'N/A';
  let date: Date;

  if (timestamp instanceof FirestoreTimestamp) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && typeof (timestamp as any).seconds === 'number') {
    date = new Date((timestamp as any).seconds * 1000 + ((timestamp as any).nanoseconds || 0) / 1000000);
  } else {
    return 'Fecha inválida';
  }

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface BulkServiceInput {
  name: string;
  category: string;
  price_usd: string;
  original_price_usd?: string;
  description?: string;
}

export default function ServicesPage() {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceOriginalPrice, setNewServiceOriginalPrice] = useState('');
  const [isSavingService, setIsSavingService] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState<string | null>(null);

  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [bulkJsonInput, setBulkJsonInput] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const jsonStructureExample = `[
  {
    "name": "Servicio Ejemplo 1",
    "category": "Consultoría",
    "price_usd": "150.00",
    "original_price_usd": "200.00",
    "description": "Descripción del servicio 1..."
  },
  {
    "name": "Servicio Ejemplo 2",
    "category": "Desarrollo",
    "price_usd": "75.50",
    "description": "Descripción del servicio 2..."
  }
]`;

  const fetchServices = useCallback(async () => {
    if (!user) return;
    setLoadingServices(true);
    try {
      const servicesCollectionRef = collection(db, 'userServices');
      const q = query(servicesCollectionRef, where("uid", "==", user.uid), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedServices: Service[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: data.uid,
          name: data.name,
          category: data.category,
          description: data.description || undefined,
          price_usd: data.price_usd,
          original_price_usd: data.original_price_usd || undefined,
          createdAt: data.createdAt, 
          updatedAt: data.updatedAt, 
        } as Service;
      });
      setServices(fetchedServices);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      let descriptionNode: React.ReactNode = error.message;
      if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
        const match = error.message.match(/(https:\/\/[^ )]+)/);
        const indexCreationUrl = match ? match[0] : null;
        descriptionNode = (
          <span className="text-sm">
            La consulta requiere un índice de Firestore. Por favor,{' '}
            {indexCreationUrl ? (
              <a 
                href={indexCreationUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline text-primary hover:text-primary/80 font-semibold"
              >
                haz clic aquí para crearlo
              </a>
            ) : (
              'revisa la consola para el enlace.'
            )}
            Una vez creado, intenta de nuevo.
          </span>
        );
        toast({ title: "Error de Índice", description: descriptionNode, variant: "destructive", duration: 20000 });
      } else {
        toast({ title: "Error al Cargar Servicios", description: descriptionNode, variant: "destructive" });
      }
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (initialLoadDone && !user && !authLoading) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, authLoading, router]);

  useEffect(() => {
    if (user && initialLoadDone) {
      fetchServices();
    } else if (initialLoadDone && !authLoading && !user) {
      setServices([]);
      setLoadingServices(false);
    }
  }, [user, initialLoadDone, authLoading, fetchServices]);

  const resetFormFields = () => {
    setNewServiceName('');
    setNewServiceCategory('');
    setNewServiceDescription('');
    setNewServicePrice('');
    setNewServiceOriginalPrice('');
    setEditingService(null); 
  };

  const handleOpenAddModal = () => {
    resetFormFields();
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenBulkAddModal = () => {
    setBulkJsonInput('');
    setIsBulkAddModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditingService(service);
    setNewServiceName(service.name);
    setNewServiceCategory(service.category);
    setNewServiceDescription(service.description || '');
    setNewServicePrice(service.price_usd);
    setNewServiceOriginalPrice(service.original_price_usd || '');
    setIsServiceModalOpen(true);
  };
  
  const handleSaveService = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !newServiceName || !newServiceCategory || !newServicePrice) {
      toast({ title: "Campos Requeridos", description: "Nombre, categoría y precio son obligatorios.", variant: "destructive" });
      return;
    }
    setIsSavingService(true);

    const serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: any, createdAt?: any } = {
      uid: user.uid,
      name: newServiceName,
      category: newServiceCategory,
      description: newServiceDescription || undefined,
      price_usd: newServicePrice,
      original_price_usd: newServiceOriginalPrice || undefined,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingService && editingService.id) {
        const serviceDocRef = doc(db, 'userServices', editingService.id);
        await updateDoc(serviceDocRef, serviceData);
        toast({ title: "Éxito", description: "Servicio actualizado correctamente." });
      } else {
        serviceData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'userServices'), serviceData);
        toast({ title: "Éxito", description: "Servicio añadido a tu catálogo." });
      }
      
      setIsServiceModalOpen(false);
      resetFormFields();
      fetchServices(); 
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string | undefined) => {
    if (!serviceId || !user) {
        toast({ title: "Error", description: "No se pudo identificar el servicio a eliminar.", variant: "destructive" });
        return;
    }
    const serviceToDelete = services.find(s => s.id === serviceId);
    if (!serviceToDelete) {
        toast({ title: "Error", description: "Servicio no encontrado.", variant: "destructive" });
        return;
    }
    if (!confirm(`¿Estás seguro de que quieres eliminar el servicio "${serviceToDelete.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setIsDeletingService(serviceId);
    try {
        await deleteDoc(doc(db, "userServices", serviceId));
        toast({ title: "Servicio Eliminado", description: `El servicio "${serviceToDelete.name}" ha sido eliminado.` });
        fetchServices(); 
    } catch (error: any) {
        console.error("Error deleting service:", error);
        toast({ title: "Error al Eliminar", description: `No se pudo eliminar el servicio: ${error.message}`, variant: "destructive" });
    } finally {
        setIsDeletingService(null);
    }
  };

  const handleBulkSaveServices = async () => {
    if (!user) {
      toast({ title: "Autenticación Requerida", variant: "destructive" });
      return;
    }
    if (!bulkJsonInput.trim()) {
      toast({ title: "Entrada Vacía", description: "Pega el JSON de los servicios.", variant: "destructive" });
      return;
    }
    setIsBulkSaving(true);
    let servicesToSave: BulkServiceInput[] = [];
    try {
      servicesToSave = JSON.parse(bulkJsonInput);
      if (!Array.isArray(servicesToSave)) {
        throw new Error("El JSON debe ser un array de servicios.");
      }
    } catch (error: any) {
      toast({ title: "Error de Formato JSON", description: `JSON no válido: ${error.message}`, variant: "destructive" });
      setIsBulkSaving(false);
      return;
    }

    let savedCount = 0;
    let errorCount = 0;
    const batch = writeBatch(db);
    const servicesCollectionRef = collection(db, 'userServices');

    for (const serviceInput of servicesToSave) {
      if (!serviceInput.name || !serviceInput.category || !serviceInput.price_usd) {
        console.warn("Servicio omitido por falta de campos:", serviceInput);
        errorCount++;
        continue;
      }
      const newServiceRef = doc(servicesCollectionRef); 
      const newServiceData: Service = {
        id: newServiceRef.id, 
        uid: user.uid,
        name: serviceInput.name,
        category: serviceInput.category,
        price_usd: serviceInput.price_usd,
        original_price_usd: serviceInput.original_price_usd || undefined,
        description: serviceInput.description || undefined,
        createdAt: serverTimestamp() as any, 
        updatedAt: serverTimestamp() as any, 
      };
      batch.set(newServiceRef, newServiceData);
      savedCount++;
    }

    try {
      await batch.commit();
      if (savedCount > 0) {
        toast({ title: "Éxito", description: `${savedCount} servicio(s) añadidos.` });
      }
      if (errorCount > 0) {
        toast({ title: "Advertencia", description: `${errorCount} servicio(s) omitidos. Revisa la consola.`, variant: "default" });
      }
      setIsBulkAddModalOpen(false);
      setBulkJsonInput('');
      fetchServices(); 
    } catch (error: any) {
      console.error("Error guardando servicios masivamente:", error);
      toast({ title: "Error Guardado Masivo", description: error.message, variant: "destructive" });
    } finally {
      setIsBulkSaving(false);
    }
  };

  if (authLoading || !initialLoadDone) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!user) { // Should be caught by the redirect in useEffect, but as a fallback
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-0 md:p-0">
      <div className="container mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center">
            <Briefcase className="mr-3 h-7 w-7 text-primary" />
            Mi Catálogo de Servicios
          </h1>
          <div className="flex space-x-2">
            <Dialog open={isBulkAddModalOpen} onOpenChange={(isOpen) => {
              setIsBulkAddModalOpen(isOpen);
              if (!isOpen) setBulkJsonInput('');
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenBulkAddModal} variant="outline" className="bg-card text-primary border-primary hover:bg-primary/10 hover:text-primary">
                  <UploadCloud className="mr-2 h-5 w-5" /> Añadir Masivamente (JSON)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl bg-popover text-popover-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl text-foreground">Añadir Servicios Masivamente con JSON</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Pega un array de objetos JSON. Cada servicio debe tener 'name', 'category', y 'price_usd'.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Formato JSON Esperado:</Label>
                    <pre className="mt-1 p-3 bg-input text-muted-foreground rounded-md text-xs overflow-x-auto max-h-[150px]">
                      <code>{jsonStructureExample}</code>
                    </pre>
                  </div>
                  <Textarea
                    placeholder="Pega aquí tu JSON..."
                    value={bulkJsonInput}
                    onChange={(e) => setBulkJsonInput(e.target.value)}
                    className="min-h-[150px] bg-input text-foreground border-input text-sm placeholder:text-muted-foreground"
                    disabled={isBulkSaving}
                  />
                </div>
                <DialogFooter>
                   <Button type="button" variant="outline" onClick={() => setIsBulkAddModalOpen(false)} disabled={isBulkSaving} className="border-muted-foreground text-muted-foreground hover:bg-muted/30">Cancelar</Button>
                  <Button onClick={handleBulkSaveServices} disabled={isBulkSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isBulkSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Guardar Servicios
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isServiceModalOpen} onOpenChange={(isOpen) => {
              setIsServiceModalOpen(isOpen);
              if (!isOpen) resetFormFields(); 
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenAddModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] bg-popover text-popover-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl text-foreground">
                    {editingService ? "Editar Servicio" : "Añadir Nuevo Servicio"}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {editingService ? "Modifica los detalles de tu servicio." : "Completa los detalles. La descripción es importante para la IA."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveService} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="serviceName" className="text-right text-sm text-foreground">Nombre</Label>
                    <Input id="serviceName" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="col-span-3 bg-input text-foreground border-input placeholder:text-muted-foreground" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="serviceCategory" className="text-right text-sm text-foreground">Categoría</Label>
                    <Input id="serviceCategory" value={newServiceCategory} onChange={(e) => setNewServiceCategory(e.target.value)} className="col-span-3 bg-input text-foreground border-input placeholder:text-muted-foreground" placeholder="Ej: Consultoría, Diseño" required />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="serviceDescription" className="text-right text-sm text-foreground pt-2">Descripción</Label>
                    <Textarea
                      id="serviceDescription"
                      value={newServiceDescription}
                      onChange={(e) => setNewServiceDescription(e.target.value)}
                      className="col-span-3 min-h-[100px] bg-input text-foreground border-input placeholder:text-muted-foreground"
                      placeholder="Describe el servicio, sus beneficios..."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="servicePrice" className="text-right text-sm text-foreground">Precio (USD)</Label>
                    <Input id="servicePrice" type="text" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} className="col-span-3 bg-input text-foreground border-input placeholder:text-muted-foreground" placeholder="Ej: 75.00" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="serviceOriginalPrice" className="text-right text-sm text-foreground">Precio Original</Label>
                    <Input id="serviceOriginalPrice" type="text" value={newServiceOriginalPrice} onChange={(e) => setNewServiceOriginalPrice(e.target.value)} className="col-span-3 bg-input text-foreground border-input placeholder:text-muted-foreground" placeholder="Opcional (ej: 100.00)" />
                  </div>
                  <DialogFooter>
                     <Button type="button" variant="outline" onClick={() => setIsServiceModalOpen(false)} disabled={isSavingService} className="border-muted-foreground text-muted-foreground hover:bg-muted/30">Cancelar</Button>
                    <Button type="submit" disabled={isSavingService} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {isSavingService ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {editingService ? "Guardar Cambios" : "Guardar Servicio"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Card className="bg-card border-border text-card-foreground">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Lista de Servicios</CardTitle>
            <CardDescription className="text-muted-foreground">Gestiona los servicios de tu catálogo. Estos se usarán para recomendaciones de IA.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingServices ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : services.length === 0 && !loadingServices ? (
              <p className="text-muted-foreground text-center py-10 px-6">
                No tienes servicios en tu catálogo. ¡Añade el primero!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-border hover:bg-muted/10">
                      <TableHead className="text-muted-foreground pl-6">Nombre</TableHead>
                      <TableHead className="text-muted-foreground">Categoría</TableHead>
                      <TableHead className="text-muted-foreground">Precio (USD)</TableHead>
                      <TableHead className="text-muted-foreground hidden sm:table-cell">Precio Original</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell">Descripción</TableHead>
                      <TableHead className="text-muted-foreground hidden sm:table-cell">Añadido</TableHead>
                      <TableHead className="text-muted-foreground pr-6 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id} className="border-b-border hover:bg-muted/20">
                        <TableCell className="font-medium text-foreground py-3 pl-6">{service.name}</TableCell>
                        <TableCell className="text-muted-foreground py-3">{service.category}</TableCell>
                        <TableCell className="text-muted-foreground py-3">{service.price_usd}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell py-3">{service.original_price_usd || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell text-xs max-w-xs truncate py-3" title={service.description}>{service.description || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell py-3">{formatDisplayTimestamp(service.createdAt)}</TableCell>
                        <TableCell className="pr-6 py-3 text-right">
                          <div className="flex space-x-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(service)} title="Editar servicio" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)} title="Eliminar servicio" className="text-destructive/80 hover:text-destructive hover:bg-destructive/10" disabled={isDeletingService === service.id}>
                              {isDeletingService === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
