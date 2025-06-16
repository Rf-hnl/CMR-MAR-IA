
"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Chrome, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import LoadingComponent from '@/components/LoadingComponent';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, initialLoadDone, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialLoadDone && user) {
      router.replace('/');
    }
  }, [user, initialLoadDone, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await signIn(email.trim(), password);
      
      if (result.success) {
        router.push('/');
      } else {
        let message = "Error al iniciar sesión. Por favor, revisa tus credenciales.";
        if (result.error?.includes('user-not-found') || result.error?.includes('wrong-password') || result.error?.includes('invalid-credential')) {
          message = "Email o contraseña incorrectos.";
        } else if (result.error?.includes('invalid-email')) {
          message = "Por favor, introduce una dirección de email válida.";
        } else if (result.error?.includes('too-many-requests')) {
          message = "Demasiados intentos fallidos. Inténtalo más tarde.";
        }
        
        toast({
          title: "Error de autenticación",
          description: message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        router.push('/');
      } else {
        toast({
          title: "Error de autenticación",
          description: result.error || "No se pudo iniciar sesión con Google.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading || (initialLoadDone && user)) {
    return (
      <LoadingComponent message="Verificando sesión..." />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">¡Bienvenido de Nuevo!</CardTitle>
          <CardDescription>
            Inicia sesión en tu cuenta para continuar
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            variant="outline"
            className="w-full"
          >
            {isSubmitting ? (
              "Conectando..."
            ) : (
              <>
                <Chrome className="mr-2 h-4 w-4" />
                Continuar con Google
              </>
            )}
          </Button>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-2 text-muted-foreground text-sm">o</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link 
                href="/reset-password"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                "Iniciando sesión..."
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link 
                href="/register"
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
