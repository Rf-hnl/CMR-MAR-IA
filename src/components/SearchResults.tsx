
"use client";

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from '@/components/LoadingSpinner';
import { Info, Save, Loader2, PackageSearch, Search as SearchIconLucide, Star, MapPin, Phone, Globe, Clock, DollarSign, Building2, Navigation, ExternalLink, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Business {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  international_phone_number?: string;
  formatted_phone_number?: string;
  website?: string;
  business_status?: string;
  url?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface SearchResultsProps {
  searchResults: Business[];
  selectedLeads: Set<string>;
  hasSearched: boolean;
  searchLoading: boolean;
  saveLoading: boolean;
  onToggleLead: (placeId: string) => void;
  onShowDetails: (business: Business) => void;
  onAddToLeads: () => void;
}

// Helper function to generate additional useful links
const generateBusinessLinks = (business: Business) => {
  const links = [];
  
  // WhatsApp link if phone exists
  if (business.international_phone_number || business.formatted_phone_number) {
    const phoneNumber = (business.international_phone_number || business.formatted_phone_number || '')
      .replace(/\s+/g, '')
      .replace(/[^\d+]/g, '');
    if (phoneNumber) {
      links.push({
        url: `https://wa.me/${phoneNumber}`,
        label: 'WhatsApp',
        icon: 'message',
        color: 'text-green-600 hover:text-green-800'
      });
    }
  }
  
  // Search for social media in business name or website
  const businessName = business.name.toLowerCase();
  const searchQuery = encodeURIComponent(`${business.name} ${business.vicinity || business.formatted_address || ''}`);
  
  // Facebook search
  links.push({
    url: `https://www.facebook.com/search/top?q=${searchQuery}`,
    label: 'Buscar en Facebook',
    icon: 'facebook',
    color: 'text-blue-700 hover:text-blue-900'
  });
  
  // Instagram search
  links.push({
    url: `https://www.instagram.com/explore/tags/${encodeURIComponent(businessName.replace(/\s+/g, ''))}`,
    label: 'Buscar en Instagram',
    icon: 'instagram',
    color: 'text-pink-600 hover:text-pink-800'
  });
  
  return links;
};

export default function SearchResults({
  searchResults,
  selectedLeads,
  hasSearched,
  searchLoading,
  saveLoading,
  onToggleLead,
  onShowDetails,
  onAddToLeads,
}: SearchResultsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [failedIframes, setFailedIframes] = useState<Set<string>>(new Set());
  
  const toggleExpanded = (placeId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(placeId)) {
      newExpanded.delete(placeId);
    } else {
      newExpanded.add(placeId);
    }
    setExpandedCards(newExpanded);
  };

  const handleIframeError = (placeId: string) => {
    setFailedIframes(prev => new Set([...prev, placeId]));
  };

  if (searchLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm">Buscando negocios...</p>
      </div>
    );
  }

  if (!hasSearched && !searchLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground p-6">
        <SearchIconLucide className="h-12 w-12 mb-4 text-muted-foreground/30" />
        <h3 className="text-base font-medium text-foreground mb-2">Encuentra Nuevos Leads</h3>
        <p className="text-sm text-muted-foreground">
          Completa los criterios de búsqueda y haz clic en "Buscar Negocios".
        </p>
      </div>
    );
  }

  if (hasSearched && !searchLoading && searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground p-6">
        <PackageSearch className="h-12 w-12 mb-4 text-muted-foreground/30" />
        <h3 className="text-base font-medium text-foreground mb-2">No se Encontraron Resultados</h3>
        <p className="text-sm text-muted-foreground">
          Intenta ajustar tus criterios de búsqueda o usar términos más generales.
        </p>
      </div>
    );
  }

  if (searchResults.length > 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Resultados de Búsqueda</h3>
            <p className="text-sm text-muted-foreground">{searchResults.length} negocios encontrados</p>
          </div>
          {selectedLeads.size > 0 && (
            <Button
              onClick={onAddToLeads}
              disabled={saveLoading}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar ({selectedLeads.size})
                </>
              )}
            </Button>
          )}
        </div>
        <ScrollArea className="flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
            {searchResults.map((business) => (
              <Card
                key={business.place_id}
                className={`group transition-all duration-300 hover:shadow-lg border-2 ${
                  selectedLeads.has(business.place_id)
                    ? 'ring-2 ring-primary shadow-lg border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/30 hover:-translate-y-1'
                }`}
              >
                <CardContent className="p-0">
                  {/* Header with Website Embed or Fallback */}
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 rounded-t-lg overflow-hidden relative">
                      {/* Website Embed - Priority 1 */}
                      {business.website && !failedIframes.has(business.place_id) ? (
                        <>
                          <iframe
                            src={business.website}
                            className="w-full h-full border-0 group-hover:scale-105 transition-all duration-500"
                            loading="lazy"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            onError={() => handleIframeError(business.place_id)}
                            onLoad={(e) => {
                              const target = e.currentTarget;
                              target.style.opacity = '1';
                              // Check if iframe loaded correctly (some sites block embedding)
                              setTimeout(() => {
                                try {
                                  if (!target.contentDocument && !target.contentWindow) {
                                    handleIframeError(business.place_id);
                                  }
                                } catch (error) {
                                  // Cross-origin iframe, that's expected, don't treat as error
                                }
                              }, 2000);
                            }}
                            style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                            title={`Website de ${business.name}`}
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none"></div>
                          
                          {/* Website indicator */}
                          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                            <Globe className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">Web</span>
                          </div>
                          
                          {/* Click overlay to open in new tab */}
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/20 transition-opacity duration-300"
                          >
                            <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-lg">
                              <ExternalLink className="h-5 w-5 text-blue-600" />
                            </div>
                          </a>
                        </>
                      ) : null}
                      
                      {/* Photo Fallback - Priority 2 */}
                      <div className={`photo-fallback ${business.website && !failedIframes.has(business.place_id) ? 'hidden' : ''} w-full h-full`}>
                        {business.photos && business.photos.length > 0 ? (
                          <>
                            {/* <> */}
                          </>
                        ) : (
                          <div className="final-fallback w-full h-full flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100"></div>
                            <div className="absolute inset-0 opacity-10">
                              <div className="absolute top-4 left-4 w-8 h-8 bg-blue-300 rounded-full"></div>
                              <div className="absolute bottom-8 right-8 w-12 h-12 bg-indigo-300 rounded-full"></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-purple-300 rounded-full opacity-50"></div>
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                              <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mb-3">
                                <Building2 className="h-8 w-8 text-blue-600" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-slate-600">
                                  {business.name.split(' ').slice(0, 2).join(' ')}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {business.types?.[0]?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Negocio'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Final Fallback - Priority 3 */}
                      <div className="final-fallback hidden w-full h-full flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100"></div>
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-4 left-4 w-8 h-8 bg-blue-300 rounded-full"></div>
                          <div className="absolute bottom-8 right-8 w-12 h-12 bg-indigo-300 rounded-full"></div>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-purple-300 rounded-full opacity-50"></div>
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mb-3">
                            <Building2 className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">
                              {business.name.split(' ').slice(0, 2).join(' ')}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {business.types?.[0]?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Negocio'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating Checkbox */}
                    <div className="absolute top-3 left-3">
                      <Checkbox
                        id={`lead-search-${business.place_id}`}
                        checked={selectedLeads.has(business.place_id)}
                        onCheckedChange={() => onToggleLead(business.place_id)}
                        className="bg-white shadow-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>

                    {/* Enhanced Status Badge */}
                    {business.opening_hours?.open_now !== undefined && (
                      <div className="absolute top-3 right-3">
                        <div className={`
                          flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md border
                          ${business.opening_hours.open_now 
                            ? 'bg-green-500/90 text-white border-green-400/50 shadow-green-500/25' 
                            : 'bg-red-500/90 text-white border-red-400/50 shadow-red-500/25'
                          }
                        `}>
                          <div className={`
                            w-2 h-2 rounded-full animate-pulse
                            ${business.opening_hours.open_now ? 'bg-green-200' : 'bg-red-200'}
                          `} />
                          <span className="text-xs font-medium tracking-wide">
                            {business.opening_hours.open_now ? 'ABIERTO' : 'CERRADO'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Business Name and Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <Label 
                        htmlFor={`lead-search-${business.place_id}`}
                        className="font-semibold text-lg text-foreground cursor-pointer hover:text-primary line-clamp-2 leading-tight"
                      >
                        {business.name}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onShowDetails(business)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 flex-shrink-0"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Rating and Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {business.rating && (
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-yellow-700">{business.rating}</span>
                            {business.user_ratings_total && (
                              <span className="text-xs text-yellow-600">
                                ({business.user_ratings_total})
                              </span>
                            )}
                          </div>
                        )}
                        {business.price_level && (
                          <div className="flex items-center bg-green-50 px-2 py-1 rounded-full">
                            <span className="text-sm font-semibold text-green-700">
                              {'$'.repeat(business.price_level)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                        {business.vicinity || business.formatted_address || 'Dirección no disponible'}
                      </p>
                    </div>

                    {/* Contact & Action Links */}
                    <div className="grid grid-cols-1 gap-2">
                      {/* Phone Numbers */}
                      {(business.international_phone_number || business.formatted_phone_number) && (
                        <a
                          href={`tel:${business.international_phone_number || business.formatted_phone_number}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors group"
                        >
                          <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">
                            {business.international_phone_number || business.formatted_phone_number}
                          </span>
                        </a>
                      )}
                      
                      {/* Website */}
                      {business.website && (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors group"
                        >
                          <Globe className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Sitio web</span>
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      )}
                      
                      {/* Google Maps Link */}
                      {business.geometry?.location && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${business.geometry.location.lat},${business.geometry.location.lng}&destination_place_id=${business.place_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 hover:underline transition-colors group"
                        >
                          <Navigation className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Cómo llegar</span>
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      )}
                      
                      {/* Google Business Profile */}
                      {business.url && (
                        <a
                          href={business.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 hover:underline transition-colors group"
                        >
                          <Building2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Ver en Google</span>
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      )}
                      
                      {/* WhatsApp Direct Link */}
                      {(business.international_phone_number || business.formatted_phone_number) && (
                        <a
                          href={`https://wa.me/${(business.international_phone_number || business.formatted_phone_number || '').replace(/\s+/g, '').replace(/[^\d+]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 hover:underline transition-colors group"
                        >
                          <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">WhatsApp</span>
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      )}
                    </div>
                    
                    {/* Expandable Social Media Search */}
                    <div className="border-t border-border/50 pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(business.place_id)}
                        className="w-full justify-between h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <span>Buscar en redes sociales</span>
                        {expandedCards.has(business.place_id) ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                      
                      {expandedCards.has(business.place_id) && (
                        <div className="grid grid-cols-2 gap-2 mt-2 animate-in slide-in-from-top-2 duration-200">
                          <a
                            href={`https://www.facebook.com/search/top?q=${encodeURIComponent(`${business.name} ${business.vicinity || business.formatted_address || ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 hover:underline transition-colors p-1 rounded hover:bg-blue-50"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Facebook</span>
                          </a>
                          
                          <a
                            href={`https://www.instagram.com/explore/tags/${encodeURIComponent(business.name.replace(/\s+/g, '').toLowerCase())}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800 hover:underline transition-colors p-1 rounded hover:bg-pink-50"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Instagram</span>
                          </a>
                          
                          <a
                            href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(business.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors p-1 rounded hover:bg-blue-50"
                          >
                            <Globe className="h-3 w-3" />
                            <span>LinkedIn</span>
                          </a>
                          
                          <a
                            href={`https://www.google.com/search?q="${encodeURIComponent(business.name)}" ${encodeURIComponent(business.vicinity || business.formatted_address || '')} redes sociales`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 hover:underline transition-colors p-1 rounded hover:bg-gray-50"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Google</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Business Types */}
                    {business.types && business.types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {business.types.slice(0, 2).map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="text-xs bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ))}
                        {business.types.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-muted/50">
                            +{business.types.length - 2} más
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return null; // Should not be reached if logic above is correct
}
