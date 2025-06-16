"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, MapPin, Building2, Tag, Search as SearchIcon, Loader2, Lightbulb, Filter, Sparkles, Wand2, RefreshCw, Brain } from "lucide-react";
import AIKeywordsModal from "./AIKeywordsModal";

interface SearchFormProps {
  country: string;
  place: string;
  businessTypeInput: string;
  keywords: string;
  loading: boolean;
  onCountryChange: (v: string) => void;
  onPlaceChange: (v: string) => void;
  onBusinessTypeChange: (v: string) => void;
  onKeywordsChange: (v: string) => void;
  onSubmit: (e?: FormEvent) => void;
}

export default function SearchForm({
  country,
  place,
  businessTypeInput,
  keywords,
  loading,
  onCountryChange,
  onPlaceChange,
  onBusinessTypeChange,
  onKeywordsChange,
  onSubmit,
}: SearchFormProps) {
  const [minRating, setMinRating] = useState("all");
  const [priceLevel, setPriceLevel] = useState("all");
  const [openNow, setOpenNow] = useState("all");
  
  // AI Keyword suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Países comunes
  const countries = [
    { code: "PA", name: "Panamá" },
    { code: "US", name: "Estados Unidos" },
    { code: "MX", name: "México" },
    { code: "ES", name: "España" },
    { code: "CO", name: "Colombia" },
    { code: "CR", name: "Costa Rica" },
    { code: "AR", name: "Argentina" },
  ];

  // Tipos de negocio sugeridos
  const businessTypes = [
    "restaurante", "café", "hotel", "gimnasio", "farmacia", "banco", 
    "supermercado", "tienda", "barbería", "spa", "clínica", "escuela",
    "ferretería", "panadería", "lavandería", "taller", "oficina", "bar"
  ];

  // Función para generar sugerencias IA
  const generateAISuggestions = async () => {
    if (!businessTypeInput || businessTypeInput === 'todos') {
      alert('Por favor selecciona un tipo de negocio primero');
      return;
    }

    setLoadingAI(true);
    try {
      const response = await fetch('/api/ai/keyword-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest',
          businessType: businessTypeInput,
          location: place,
          context: `País: ${country}`
        })
      });

      if (!response.ok) throw new Error('Error al generar sugerencias');

      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
      setShowAISuggestions(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar sugerencias. Intenta de nuevo.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Función para corregir palabras clave existentes
  const correctKeywords = async () => {
    if (!keywords.trim() || !businessTypeInput || businessTypeInput === 'todos') {
      alert('Por favor ingresa palabras clave y selecciona un tipo de negocio');
      return;
    }

    setLoadingAI(true);
    try {
      const response = await fetch('/api/ai/keyword-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'correct',
          keywords,
          businessType: businessTypeInput,
          location: place
        })
      });

      if (!response.ok) throw new Error('Error al corregir palabras clave');

      const data = await response.json();
      onKeywordsChange(data.corrected);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al corregir palabras clave. Intenta de nuevo.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Función para agregar sugerencia a las palabras clave
  const addKeywordSuggestion = (suggestion: string) => {
    const currentKeywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (!currentKeywords.includes(suggestion)) {
      const newKeywords = [...currentKeywords, suggestion].join(', ');
      onKeywordsChange(newKeywords);
    }
  };

  // Función para manejar keywords seleccionadas del modal IA
  const handleAIKeywordsSelected = (selectedKeywords: string[]) => {
    const currentKeywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    const newKeywords = [...currentKeywords];
    
    selectedKeywords.forEach(keyword => {
      if (!newKeywords.includes(keyword)) {
        newKeywords.push(keyword);
      }
    });
    
    onKeywordsChange(newKeywords.join(', '));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground flex items-center">
          <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
          País
        </Label>
        <Select value={country} onValueChange={onCountryChange} defaultValue="PA">
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Seleccionar país" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="place" className="text-sm font-medium text-foreground flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
          Ciudad/Región
        </Label>
        <Input
          id="place"
          value={place}
          onChange={e => onPlaceChange(e.target.value)}
          placeholder="Madrid, Barcelona..."
          className="h-10 border-input bg-background focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground flex items-center">
          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
          Tipo de Negocio
        </Label>
        
        {/* Selector con opciones predefinidas */}
        <Select value={businessTypeInput} onValueChange={onBusinessTypeChange}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Seleccionar tipo de negocio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {businessTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Input manual adicional */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center">
            <Lightbulb className="mr-1 h-3 w-3" />
            O escribe manualmente
          </Label>
          <Input
            value={businessTypeInput}
            onChange={e => onBusinessTypeChange(e.target.value)}
            placeholder="ej: restaurante vegano, boutique de ropa, clínica dental..."
            className="h-10 border-input bg-background focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground flex items-center justify-between">
          <span className="flex items-center">
            <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
            Palabras Clave
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setShowAIModal(true)}
              disabled={loadingAI || !businessTypeInput || businessTypeInput === 'todos'}
              className="h-7 px-2 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loadingAI ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Brain className="h-3 w-3" />
              )}
              IA
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateAISuggestions}
              disabled={loadingAI || !businessTypeInput || businessTypeInput === 'todos'}
              className="h-7 px-2 text-xs"
            >
              {loadingAI ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Rápido
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={correctKeywords}
              disabled={loadingAI || !keywords.trim() || !businessTypeInput || businessTypeInput === 'todos'}
              className="h-7 px-2 text-xs"
            >
              {loadingAI ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
              Corregir
            </Button>
          </div>
        </Label>
        <Input
          id="keywords"
          value={keywords}
          onChange={e => onKeywordsChange(e.target.value)}
          placeholder="vegano, 24h, centro, delivery..."
          className="h-10 border-input bg-background focus:border-primary focus:ring-1 focus:ring-primary"
        />
        
        {/* AI Suggestions Panel */}
        {showAISuggestions && aiSuggestions.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                Sugerencias IA
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAISuggestions(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {aiSuggestions.slice(0, 12).map((suggestion, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addKeywordSuggestion(suggestion)}
                  className="h-6 px-2 text-xs hover:bg-primary hover:text-primary-foreground"
                >
                  + {suggestion}
                </Button>
              ))}
            </div>
            {aiSuggestions.length > 12 && (
              <p className="text-xs text-muted-foreground mt-2">
                +{aiSuggestions.length - 12} sugerencias más...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filtros Avanzados */}
      <div className="border-t pt-4 space-y-4">
        <Label className="text-sm font-medium text-foreground flex items-center">
          <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
          Filtros Avanzados
        </Label>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Rating Mínimo</Label>
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="4">4+ estrellas</SelectItem>
                <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                <SelectItem value="3">3+ estrellas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nivel de Precios</Label>
            <Select value={priceLevel} onValueChange={setPriceLevel}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="1">$ Económico</SelectItem>
                <SelectItem value="2">$$ Moderado</SelectItem>
                <SelectItem value="3">$$$ Caro</SelectItem>
                <SelectItem value="4">$$$$ Muy caro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={openNow} onValueChange={setOpenNow}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="true">Abierto ahora</SelectItem>
                <SelectItem value="false">Incluir cerrados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-10 mt-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            <SearchIcon className="mr-2 h-4 w-4" />
            Buscar Negocios
          </>
        )}
      </Button>

      {/* Modal de IA para generar keywords */}
      <AIKeywordsModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        onKeywordsSelected={handleAIKeywordsSelected}
        businessType={businessTypeInput}
        location={place}
        country={country}
      />
    </form>
  );
}