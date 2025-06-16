"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Bell, Handshake, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ExtendedLead as Lead } from '@/types';

interface LeadStatsProps {
  leads: Lead[];
}

export default function LeadStats({ leads }: LeadStatsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const stats = {
    total: leads.length,
    nuevo: leads.filter(l => l.stage === 'Nuevo').length,
    contactado: leads.filter(l => l.stage === 'Contactado').length,
    calificado: leads.filter(l => l.stage === 'Calificado').length,
    propuesta: leads.filter(l => l.stage === 'Propuesta Enviada').length,
    negociacion: leads.filter(l => l.stage === 'Negociación').length,
    ganado: leads.filter(l => l.stage === 'Ganado').length,
    perdido: leads.filter(l => l.stage === 'Perdido').length,
  };

  const conversionRate = stats.total > 0 
    ? ((stats.ganado / stats.total) * 100).toFixed(1)
    : '0.0';

  const handleGenerateReport = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
    // Preparar datos del informe
    const reportData = {
      metadata: {
        title: 'Informe de Estado de Leads',
        generatedAt: new Date().toLocaleString('es-ES'),
        totalLeads: stats.total,
        conversionRate: conversionRate
      },
      summary: {
        nuevo: stats.nuevo,
        contactado: stats.contactado,
        calificado: stats.calificado,
        propuesta: stats.propuesta,
        negociacion: stats.negociacion,
        ganado: stats.ganado,
        perdido: stats.perdido
      },
      details: leads.map(lead => ({
        id: lead.id,
        name: lead.name || lead.company || 'Sin nombre',
        email: lead.email || 'Sin email',
        phone: lead.phone || 'Sin teléfono',
        stage: lead.stage,
        source: lead.source,
        createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('es-ES') : 'Sin fecha',
        value: lead.value || 0
      }))
    };

    // Generar CSV
    const csvContent = generateCSVReport(reportData);
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `informe-leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mostrar mensaje de éxito
    console.log('✅ Informe generado exitosamente');
    
    } catch (error) {
      console.error('❌ Error al generar el informe:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCSVReport = (data: any) => {
    const headers = [
      'ID',
      'Nombre/Empresa',
      'Email',
      'Teléfono', 
      'Etapa',
      'Fuente',
      'Fecha Creación',
      'Valor Estimado'
    ];

    // Resumen al inicio del CSV
    let csvContent = '=== RESUMEN DEL INFORME ===\n';
    csvContent += `Título:,${data.metadata.title}\n`;
    csvContent += `Generado:,${data.metadata.generatedAt}\n`;
    csvContent += `Total Leads:,${data.metadata.totalLeads}\n`;
    csvContent += `Tasa de Conversión:,${data.metadata.conversionRate}%\n`;
    csvContent += '\n=== ESTADÍSTICAS POR ETAPA ===\n';
    csvContent += `Nuevo:,${data.summary.nuevo}\n`;
    csvContent += `Contactado:,${data.summary.contactado}\n`;
    csvContent += `Calificado:,${data.summary.calificado}\n`;
    csvContent += `Propuesta Enviada:,${data.summary.propuesta}\n`;
    csvContent += `Negociación:,${data.summary.negociacion}\n`;
    csvContent += `Ganado:,${data.summary.ganado}\n`;
    csvContent += `Perdido:,${data.summary.perdido}\n`;
    csvContent += '\n=== DETALLE DE LEADS ===\n';
    
    // Headers para la tabla de detalles
    csvContent += headers.join(',') + '\n';
    
    // Datos de cada lead
    data.details.forEach((lead: any) => {
      const row = [
        lead.id,
        `"${lead.name}"`,
        lead.email,
        lead.phone,
        lead.stage,
        lead.source,
        lead.createdAt,
        lead.value
      ];
      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  };

  return (
    <div className="space-y-6">
      {/* Header with Report Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estadísticas de Leads</h2>
          <p className="text-muted-foreground">
            Vista general del estado de tus leads y métricas de conversión
          </p>
        </div>
        <div className="relative">
          <button 
            onClick={handleGenerateReport} 
            disabled={isGenerating || leads.length === 0}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            title={leads.length === 0 ? "No hay leads para generar informe" : "Generar y descargar informe CSV con estadísticas detalladas"}
          >
          {isGenerating ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generando Informe...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Crear Informe de Estado de Leads
            </>
          )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold leading-none mb-2">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Todos los leads registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold leading-none mb-2">{stats.nuevo}</div>
            <p className="text-xs text-muted-foreground">
              Leads sin contactar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold leading-none mb-2">
              {stats.contactado + stats.calificado + stats.propuesta + stats.negociacion}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads activos en el embudo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold leading-none mb-2">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.ganado} de {stats.total} leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Distribución por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Nuevo', value: stats.nuevo, fill: '#007bff' },
              { name: 'Contactado', value: stats.contactado, fill: '#ffc107' },
              { name: 'Calificado', value: stats.calificado, fill: '#fd7e14' },
              { name: 'Propuesta Enviada', value: stats.propuesta, fill: '#0dcaf0' },
              { name: 'Negociación', value: stats.negociacion, fill: '#6f42c1' },
              { name: 'Ganado', value: stats.ganado, fill: '#198754' },
              { name: 'Perdido', value: stats.perdido, fill: '#dc3545' },
            ]}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
