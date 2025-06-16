"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, AlertTriangle, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

export default function DatabaseResetSection() {
  const { user, authInstance } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleDatabaseReset = async () => {
    if (!user || !authInstance) {
      toast({
        title: "Error",
        description: "Usuario no autenticado.",
        variant: "destructive"
      });
      return;
    }

    if (confirmationText !== 'RESET DATABASE') {
      toast({
        title: "Error",
        description: "Texto de confirmación incorrecto.",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);

    try {
      // Obtener token de autenticación
      const token = await user.getIdToken();

      const response = await fetch('/api/reset-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmationText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error durante el reset');
      }

      // Reset exitoso
      setIsResetDialogOpen(false);
      setConfirmationText('');
      setShowSuccessDialog(true);

    } catch (error: any) {
      console.error('Error durante el reset:', error);
      toast({
        title: "Error durante el reset",
        description: error.message || "No se pudo completar el reset de la base de datos.",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogoutAndRedirect = async () => {
    try {
      if (authInstance) {
        await signOut(authInstance);
      }
      setShowSuccessDialog(false);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/login');
    }
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Database className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription className="text-red-700">
            Acciones irreversibles que afectan toda la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-100 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">Reset Completo de Base de Datos</h4>
                <p className="text-sm text-red-700 mb-3">
                  Esta acción eliminará <strong>TODOS</strong> los datos de la aplicación incluyendo:
                </p>
                <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
                  <li>Todos los usuarios y organizaciones</li>
                  <li>Todos los leads y datos de Meta Ads</li>
                  <li>Todos los productos y servicios</li>
                  <li>Todas las configuraciones y prompts</li>
                  <li>Historial y datos de análisis</li>
                </ul>
                <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Se crearán datos de prueba</strong> para validar que la estructura funciona correctamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Resetear Base de Datos Completa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  ¿Resetear Base de Datos?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    Esta acción <strong>eliminará permanentemente TODOS los datos</strong> de la aplicación.
                  </p>
                  <p>
                    Después del reset serás redirigido al login para crear una nueva cuenta de usuario.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">
                      Para confirmar, escribe exactamente: <strong>RESET DATABASE</strong>
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="py-4">
                <Label htmlFor="confirmation">Texto de confirmación</Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="RESET DATABASE"
                  className="mt-2"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setConfirmationText('');
                  setIsResetDialogOpen(false);
                }}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDatabaseReset}
                  disabled={confirmationText !== 'RESET DATABASE' || isResetting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Reseteando...
                    </>
                  ) : (
                    'Confirmar Reset'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Database className="h-5 w-5" />
              Reset Completado
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                La base de datos ha sido reseteada exitosamente y se han creado datos de prueba.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-medium text-blue-800 mb-2">Datos de prueba creados:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 1 Organización de prueba</li>
                  <li>• 3 Leads de ejemplo (Meta Ads y Google Places)</li>
                  <li>• 2 Productos de ejemplo</li>
                  <li>• Configuración de prompts básica</li>
                </ul>
              </div>
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 text-sm">
                Ahora debes crear una nueva cuenta de usuario para acceder a los datos de prueba.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleLogoutAndRedirect} className="w-full">
              Ir al Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}