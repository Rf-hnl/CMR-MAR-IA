
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cable } from "lucide-react";

export default function ChannelsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center">
            <Cable className="mr-3 h-7 w-7 text-primary" />
            Configuración de Canales de Captura
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra cómo los leads entran a tu CRM desde diferentes fuentes.
          </p>
        </header>

        <Card className="bg-card shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Próximamente</CardTitle>
            <CardDescription className="text-muted-foreground">
              Esta sección te permitirá configurar formularios web, widgets de chat (incluyendo menús interactivos), y otras integraciones para capturar leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-muted-foreground">
              <p>La funcionalidad para configurar canales de captura de leads estará disponible aquí.</p>
              <p className="mt-2 text-sm">Podrás:</p>
              <ul className="list-disc list-inside text-left inline-block mt-1 text-sm">
                <li>Crear y personalizar formularios de contacto.</li>
                <li>Configurar widgets de chat para tu sitio web.</li>
                <li>Diseñar menús interactivos para la cualificación inicial de leads.</li>
                <li>Y más...</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
