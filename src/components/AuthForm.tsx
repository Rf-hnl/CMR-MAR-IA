
"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, KeyRound, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
  title: string;
  buttonText: string;
  alternateActionText: string;
  alternateActionLink: string;
}

export default function AuthForm({
  mode,
  onSubmit,
  title,
  buttonText,
  alternateActionText,
  alternateActionLink,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!email || !password) {
      setError("Se requiere email y contraseña.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email, password);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted p-4"> {/* Changed background to muted for contrast */}
      <Card className="w-full max-w-md bg-card text-card-foreground border-border"> {/* Card specific bg and text, with border */}
        <CardHeader className="text-center">
          <div className="inline-flex justify-center items-center mb-4">
            {mode === 'login' ? <KeyRound className="h-10 w-10 text-accent" /> : <UserPlus className="h-10 w-10 text-accent" />}
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {mode === 'login' ? "Accede a tu cuenta de LeadsIA." : "Crea una nueva cuenta para empezar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base bg-input text-foreground placeholder:text-muted-foreground" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="text-base bg-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
            <Button type="submit" className="w-full text-lg py-3 bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {buttonText}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {alternateActionText}{' '}
            <Link href={alternateActionLink} className="font-medium text-accent hover:underline">
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
