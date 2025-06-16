// src/hooks/use-business-finder.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth'; import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, where, query, getDocs, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { BusinessDetail } from '@/components/BusinessDetailsModal'; // Import the interface

const LEAD_STAGES_CLIENT = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

import { findBusinesses, getPlaceDetails, saveLeads } from '@/lib/api/business';
type LeadStageClient = typeof LEAD_STAGES_CLIENT[number];

interface LeadClient {
  id: string;
  uid: string;
  name: string;
  address: string | null;
  stage: LeadStageClient;
  createdAt: FirestoreTimestamp | string;
  updatedAt: FirestoreTimestamp | string;
  placeId: string;
  source: string;
  phone?: string | null;
  website?: string | null;
  businessType?: string | null;
}

interface Business {
  place_id: string;
  name: string;
  vicinity?: string;
  types?: string[];
  rating?: number;
  formatted_address?: string;
  international_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  email?: string;
}




export const useBusinessFinder = () => {
  const { user, loading: authLoading, initialLoadDone } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [country, setCountry] = useState('');
  const [place, setPlace] = useState('');
  const [businessTypeInput, setBusinessTypeInput] = useState('');
  const [keywords, setKeywords] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedBusinessDetail, setSelectedBusinessDetail] = useState<BusinessDetail | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalDetailsLoading, setModalDetailsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialLoadDone && !user) {
      router.replace('/login');
    }
  }, [user, initialLoadDone, router]);


  const handleSearch = async () => {
    if (!user) {
      toast({ title: "Error de Autenticación", description: "Por favor, inicia sesión para buscar.", variant: "destructive" });
      return;
    }
    setSearchLoading(true);
    setSearchResults([]);
    setSelectedBusinessDetail(null);
    setSelectedLeads(new Set());
    setHasSearched(true);
    try {
      const data = await findBusinesses({ country, place, type: businessTypeInput, keywords });
      setSearchResults(data || []); // Assuming findBusinesses returns array directly
 if (!data || data.length === 0) {
        toast({ title: "Sin Resultados", description: "No se encontraron negocios que coincidan con tus criterios." });
      }
    } catch (error: any) {
      toast({ title: "Error de Búsqueda", description: error.message, variant: "destructive" });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCheckboxChange = (placeId: string) => {
    setSelectedLeads(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(placeId)) {
        newSelected.delete(placeId);
      } else {
        newSelected.add(placeId);
      }
      return newSelected;
    });
  };

  const handleShowDetails = async (business: Business) => {
     // Cast Business to BusinessDetail for initial state
    setSelectedBusinessDetail(business as BusinessDetail);
    setIsDetailsModalOpen(true);
    setModalDetailsLoading(true);
    try {
      const data = await getPlaceDetails(business.place_id);
      const enrichedBusinessData: BusinessDetail = {
         ...business, // Keep original data as fallback
        ...data, // Override with detailed data
        place_id: business.place_id, // Ensure place_id is consistent
        name: data.name || business.name // Ensure name is consistent
      };
      setSelectedBusinessDetail(enrichedBusinessData);
       // Update the item in searchResults as well to reflect new details if user re-opens
      setSearchResults(prevResults =>
        prevResults.map(b => b.place_id === business.place_id ? enrichedBusinessData as Business : b) // Cast back to Business for searchResults state
      );
    } catch (error: any) {
       toast({ title: "Error al Cargar Detalles", description: error.message, variant: "destructive" });
       setSelectedBusinessDetail(business as BusinessDetail); // Fallback to basic info
    } finally {
      setModalDetailsLoading(false);
    }
  };

  const handleAddToLeads = async () => {
     if (!user) {
      toast({ title: "Error de Autenticación", description: "Por favor, inicia sesión para guardar leads.", variant: "destructive" });
      return;
    }
    if (selectedLeads.size === 0) {
      toast({ title: "No Hay Leads Seleccionados", description: "Por favor, selecciona negocios para guardar.", variant: "destructive" });
      return;
    }

    setSaveLoading(true);
    const leadsDataToSave = searchResults
      .filter(business => selectedLeads.has(business.place_id))
      .map(b => ({
        uid: user.uid,
        placeId: b.place_id,
        name: b.name,
        address: b.formatted_address || b.vicinity || null,
        phone: b.international_phone_number || null,
        website: b.website || null,
        businessType: b.types && b.types.length > 0 ? b.types[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null,
        source: 'google_places_search',
        stage: 'Nuevo' as LeadStageClient,

         images: [],
      }));

    try {
      const { savedCount, localFallback } = await saveLeads(leadsDataToSave, user.uid);

      if (savedCount > 0) {
        toast({ title: "Éxito", description: `¡${savedCount} lead(s) guardados correctamente!` });
      }

      if (localFallback.length > 0) {
        toast({ title: "Guardado Localmente", description: `${localFallback.length} lead(s) guardados localmente debido a error con servidor.` });
      } else if (savedCount === 0 && leadsDataToSave.length > 0) {
         toast({ title: "Información", description: "Todos los leads seleccionados ya existían o no se pudieron guardar en este momento." });
      }

    } catch (error: any) {
      console.error("Error al guardar leads:", error);
      toast({ title: "Error al Guardar Leads", description: error.message || "Ocurrió un error al intentar guardar los leads.", variant: "destructive" });
    } finally {
      setSelectedLeads(new Set());
      setSaveLoading(false);
    }
  };


  return {
    country,
    setCountry,
    place,
    setPlace,
    businessTypeInput,
    setBusinessTypeInput,
    keywords,
    setKeywords,
    searchResults,
    selectedLeads,
    handleCheckboxChange,
    handleShowDetails,
    handleAddToLeads,
    searchLoading,
    saveLoading,
    selectedBusinessDetail,
    isDetailsModalOpen,
    setIsDetailsModalOpen,
    modalDetailsLoading,
    handleSearch,
    hasSearched,
  };
};