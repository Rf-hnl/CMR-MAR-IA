
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
import NextImage from 'next/image';
import { PlusCircle, PackageSearch, Loader2, Trash2, Edit2, UploadCloud } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp as FirestoreTimestamp, writeBatch } from 'firebase/firestore';
import type { Product as ProductType, LeadImage } from '@/types'; // Ensure LeadImage is correctly typed if used for products
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // For product images

function formatDisplayTimestamp(timestamp: FirestoreTimestamp | string | undefined): string {
  if (!timestamp) return 'N/A';
  let date: Date;

  if (timestamp instanceof FirestoreTimestamp) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && typeof timestamp.seconds === 'number') {
    // This handles Firestore Timestamps that might not be instances of FirestoreTimestamp in some contexts
    date = new Date(timestamp.seconds * 1000 + ((timestamp as any).nanoseconds || 0) / 1000000);
  }
   else {
    return 'Fecha inválida';
  }

  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface BulkProductInput {
  name: string;
  category: string;
  price_usd: string;
  original_price_usd?: string;
  description?: string;
  imageUrl?: string;
}


export default function ProductsPage() {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductType[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);

  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductOriginalPrice, setNewProductOriginalPrice] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(null);

  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [bulkJsonInput, setBulkJsonInput] = useState('');
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const jsonStructureExample = `[
  {
    "name": "Producto Ejemplo 1",
    "category": "Categoría A",
    "price_usd": "99.99",
    "original_price_usd": "120.00",
    "description": "Descripción del producto 1...",
    "imageUrl": "https://placehold.co/400x300.png"
  },
  {
    "name": "Producto Ejemplo 2",
    "category": "Categoría B",
    "price_usd": "49.50",
    "description": "Descripción del producto 2...",
    "imageUrl": "https://placehold.co/400x300.png"
  }
  // ... más productos
]`;


  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoadingProducts(true);
    try {
      const productsCollectionRef = collection(db, 'userProducts');
      const q = query(productsCollectionRef, where("uid", "==", user.uid), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedProducts: ProductType[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: data.uid,
          name: data.name,
          category: data.category,
          description: data.description || undefined,
          price: data.price_usd, // Map Firestore price_usd to Product.price
          original_price: data.original_price_usd || undefined, // Map Firestore original_price_usd to Product.original_price
          createdAt: data.createdAt, 
          updatedAt: data.updatedAt, 
          images: data.images || [], // Ensure images array is initialized
        } as ProductType;
      });
      setProducts(fetchedProducts);
    } catch (error: any) {
      console.error("Error fetching products:", error);
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
                className="underline text-accent hover:text-accent/80 font-semibold"
              >
                haz clic aquí para crearlo
              </a>
            ) : (
              'revisa la consola del navegador para el enlace de creación del índice.'
            )}
            Una vez creado (puede tardar minutos), intenta de nuevo.
          </span>
        );
        toast({ title: "Error al Cargar Productos: Índice Requerido", description: descriptionNode, variant: "destructive", duration: 20000 });
      } else {
        toast({ title: "Error al Cargar Productos", description: descriptionNode, variant: "destructive", duration: 9000 });
      }
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (initialLoadDone && !user && !authLoading) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    } else if (initialLoadDone && !authLoading && !user) {
      setProducts([]);
      setLoadingProducts(false);
    }
  }, [user, initialLoadDone, authLoading, fetchProducts]);

  const resetFormFields = () => {
    setNewProductName('');
    setNewProductCategory('');
    setNewProductDescription('');
    setNewProductPrice('');
    setNewProductOriginalPrice('');
    setEditingProduct(null); 
  };

  const handleOpenAddModal = () => {
    resetFormFields();
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenBulkAddModal = () => {
    setBulkJsonInput('');
    setIsBulkAddModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductType) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setNewProductCategory(product.category);
    setNewProductDescription(product.description || '');
    setNewProductPrice(product.price_usd);
    setNewProductOriginalPrice(product.original_price_usd || '');
    setIsProductModalOpen(true);
  };
  
  const handleSaveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !newProductName || !newProductCategory || !newProductPrice) {
      toast({ title: "Campos Requeridos", description: "Nombre, categoría y precio son obligatorios.", variant: "destructive" });
      return;
    }
    setIsSavingProduct(true);

    const productData: Omit<ProductType, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: any, createdAt?: any } = {
      uid: user.uid,
      name: newProductName,
      category: newProductCategory,
      description: newProductDescription || undefined,
      price_usd: newProductPrice,
      original_price_usd: newProductOriginalPrice || undefined,
      images: editingProduct?.images || [], // Preserve existing images if editing, or init empty
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingProduct && editingProduct.id) {
        const productDocRef = doc(db, 'userProducts', editingProduct.id);
        await updateDoc(productDocRef, productData);
        toast({ title: "Éxito", description: "Producto actualizado correctamente." });
      } else {
        productData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'userProducts'), productData);
        toast({ title: "Éxito", description: "Producto añadido a tu catálogo." });
      }
      
      setIsProductModalOpen(false);
      resetFormFields();
      fetchProducts(); 
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string | undefined) => {
    if (!productId || !user) {
        toast({ title: "Error", description: "No se pudo identificar el producto a eliminar.", variant: "destructive" });
        return;
    }

    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) {
        toast({ title: "Error", description: "Producto no encontrado para eliminar.", variant: "destructive" });
        return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${productToDelete.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setIsDeletingProduct(productId);
    try {
        // TODO: Add logic to delete images from Cloudinary if product.images exist
        await deleteDoc(doc(db, "userProducts", productId));
        toast({ title: "Producto Eliminado", description: `El producto "${productToDelete.name}" ha sido eliminado.` });
        fetchProducts(); 
    } catch (error: any) {
        console.error("Error deleting product:", error);
        toast({ title: "Error al Eliminar", description: `No se pudo eliminar el producto: ${error.message}`, variant: "destructive" });
    } finally {
        setIsDeletingProduct(null);
    }
  };

  const handleBulkSaveProducts = async () => {
    if (!user) {
      toast({ title: "Autenticación Requerida", description: "Debes iniciar sesión para añadir productos.", variant: "destructive" });
      return;
    }
    if (!bulkJsonInput.trim()) {
      toast({ title: "Entrada Vacía", description: "Por favor, pega el JSON de los productos.", variant: "destructive" });
      return;
    }

    setIsBulkSaving(true);
    let productsToSave: BulkProductInput[] = [];
    try {
      productsToSave = JSON.parse(bulkJsonInput);
      if (!Array.isArray(productsToSave)) {
        throw new Error("El JSON debe ser un array de productos.");
      }
    } catch (error: any) {
      toast({ title: "Error de Formato JSON", description: `El JSON no es válido: ${error.message}`, variant: "destructive" });
      setIsBulkSaving(false);
      return;
    }

    let savedCount = 0;
    let errorCount = 0;
    const batch = writeBatch(db);
    const productsCollectionRef = collection(db, 'userProducts');

    for (const productInput of productsToSave) {
      if (!productInput.name || !productInput.category || !productInput.price_usd) {
        console.warn("Producto omitido por falta de campos obligatorios:", productInput);
        errorCount++;
        continue;
      }

      const newProductRef = doc(productsCollectionRef); 
      const newProductData: ProductType = {
        id: newProductRef.id, 
        uid: user.uid,
        name: productInput.name,
        category: productInput.category,
        price_usd: productInput.price_usd,
        original_price_usd: productInput.original_price_usd || undefined,
        description: productInput.description || undefined,
        images: productInput.imageUrl
          ? [{
              secure_url: productInput.imageUrl,
              public_id: `json_imported_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, 
              is_featured: true,
              uploaded_at: new Date().toISOString(),
            }]
          : [],
        createdAt: serverTimestamp() as any, 
        updatedAt: serverTimestamp() as any, 
      };
      batch.set(newProductRef, newProductData);
      savedCount++;
    }

    try {
      await batch.commit();
      if (savedCount > 0) {
        toast({ title: "Éxito", description: `${savedCount} producto(s) añadidos correctamente.` });
      }
      if (errorCount > 0) {
        toast({ title: "Advertencia", description: `${errorCount} producto(s) fueron omitidos debido a formato incorrecto o campos faltantes. Revisa la consola.`, variant: "default" });
      }
      if (savedCount === 0 && errorCount === 0 && productsToSave.length > 0) {
          toast({ title: "Información", description: "No se procesaron productos. El JSON podría estar vacío después de la validación.", variant: "default"});
      }
      
      setIsBulkAddModalOpen(false);
      setBulkJsonInput('');
      fetchProducts(); 
    } catch (error: any) {
      console.error("Error al guardar productos masivamente en Firestore:", error);
      toast({ title: "Error al Guardar Masivamente", description: `No se pudieron guardar los productos: ${error.message}`, variant: "destructive" });
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

  if (!user && initialLoadDone) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground">Redirigiendo al inicio de sesión...</p> <LoadingSpinner size="lg"/>
      </div>
    );
  }
  
  if (!user) {
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
            <PackageSearch className="mr-3 h-7 w-7 text-accent" />
            Mi Catálogo de Productos
          </h1>
          <div className="flex space-x-2">
            <Dialog open={isBulkAddModalOpen} onOpenChange={(isOpen) => {
              setIsBulkAddModalOpen(isOpen);
              if (!isOpen) setBulkJsonInput('');
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenBulkAddModal} variant="outline" className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:text-primary">
                  <UploadCloud className="mr-2 h-5 w-5" /> Añadir Masivamente (JSON)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl bg-popover text-popover-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl text-foreground">Añadir Productos Masivamente con JSON</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Pega un array de objetos JSON con tus productos. Asegúrate de que cada producto tenga al menos 'name', 'category', y 'price_usd'. El campo 'imageUrl' es opcional.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Formato JSON Esperado (Array de productos):</Label>
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
                  <Button onClick={handleBulkSaveProducts} disabled={isBulkSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isBulkSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Guardar Productos
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isProductModalOpen} onOpenChange={(isOpen) => {
              setIsProductModalOpen(isOpen);
              if (!isOpen) resetFormFields(); 
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenAddModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px] bg-popover text-popover-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl text-foreground">
                    {editingProduct ? "Editar Producto" : "Añadir Nuevo Producto"}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {editingProduct ? "Modifica los detalles de tu producto." : "Completa los detalles de tu nuevo producto. La descripción es importante para la IA."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveProduct} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="productName" className="text-right text-sm text-foreground">Nombre</Label>
                    <Input id="productName" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="col-span-3 bg-input text-foreground border-input placeholder:text-muted-foreground" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="productCategory" className="text-right text-sm text-foreground">Categoría</Label>
                    <Input id="productCategory" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} className="col-span-3 bg-input text-foreground border-input placeholder:text-muted-foreground" placeholder="Ej: Software, Hardware" required />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="productDescription" className="text-right text-sm text-foreground pt-2">Descripción</Label>
                    <Textarea
                      id="productDescription"
                      value={newProductDescription}
                      onChange={(e) => setNewProductDescription(e.target.value)}
                      className="col-span-3 min-h-[100px] bg-input text-foreground border-input placeholder:text-muted-foreground"
                      placeholder="Describe el producto, sus beneficios..."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="productPrice" className="text-right text-sm text-foreground">Precio (USD)</Label>
                    <Input id="productPrice" type="text" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} className="col-span-3 bg-input text-foreground border-input placeholder:text-muted-foreground" placeholder="Ej: 29.99" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="productOriginalPrice" className="text-right text-sm text-foreground">Precio Original</Label>
                    <Input id="productOriginalPrice" type="text" value={newProductOriginalPrice} onChange={(e) => setNewProductOriginalPrice(e.target.value)} className="col-span-3 bg-input text-foreground border-input placeholder:text-muted-foreground" placeholder="Opcional (ej: 39.99)" />
                  </div>
                  {/* Image uploader can be added here if functionality is restored */}
                  <DialogFooter>
                     <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)} disabled={isSavingProduct} className="border-muted-foreground text-muted-foreground hover:bg-muted/30">Cancelar</Button>
                    <Button type="submit" disabled={isSavingProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {isSavingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {editingProduct ? "Guardar Cambios" : "Guardar Producto"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Card className="bg-card border-border text-card-foreground">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Lista de Productos</CardTitle>
            <CardDescription className="text-muted-foreground">Aquí puedes ver y gestionar los productos de tu catálogo. Estos se usarán para las recomendaciones de IA.</CardDescription>
          </CardHeader>
          <CardContent className="p-0"> {/* Remove padding for table to span full width */}
            {loadingProducts ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
            ) : products.length === 0 && !loadingProducts ? (
              <p className="text-muted-foreground text-center py-10 px-6">
                No tienes productos en tu catálogo todavía. ¡Añade el primero para potenciar las recomendaciones de IA!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-border hover:bg-muted/10">
                      <TableHead className="text-muted-foreground w-[60px] pl-6">Imagen</TableHead>
                      <TableHead className="text-muted-foreground">Nombre</TableHead>
                      <TableHead className="text-muted-foreground">Categoría</TableHead>
                      <TableHead className="text-muted-foreground">Precio (USD)</TableHead>
                      <TableHead className="text-muted-foreground hidden sm:table-cell">Precio Original</TableHead>
                      <TableHead className="text-muted-foreground hidden md:table-cell">Descripción</TableHead>
                      <TableHead className="text-muted-foreground hidden sm:table-cell">Añadido</TableHead>
                      <TableHead className="text-muted-foreground pr-6 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const featuredImageUrl = product.images?.find(img => img.is_featured)?.secure_url;
                      return (
                      <TableRow key={product.id} className="border-b-border hover:bg-muted/20">
                        <TableCell className="pl-6 py-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={featuredImageUrl} alt={product.name} data-ai-hint="product image" />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {product.name.substring(0,2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium text-foreground py-3">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground py-3">{product.category}</TableCell>
                        <TableCell className="text-muted-foreground py-3">{product.price_usd}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell py-3">{product.original_price_usd || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell text-xs max-w-xs truncate py-3">{product.description || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell py-3">{formatDisplayTimestamp(product.createdAt)}</TableCell>
                        <TableCell className="pr-6 py-3 text-right">
                          <div className="flex space-x-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(product)} title="Editar producto" className="text-muted-foreground hover:text-accent hover:bg-accent/10">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} title="Eliminar producto" className="text-destructive/80 hover:text-destructive hover:bg-destructive/10" disabled={isDeletingProduct === product.id}>
                              {isDeletingProduct === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
