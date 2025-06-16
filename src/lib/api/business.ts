import { collection, addDoc, serverTimestamp, where, query, getDocs, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast'; // Assuming useToast can be used in a non-React context or you have a way to access toast
import { BusinessDetail } from '@/components/BusinessDetailsModal'; // Import the interface if needed
import { LOCAL_FALLBACK_SOURCE } from '@/hooks/useBusinessFinder'; // Assuming these constants are needed

export interface Business {
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

const LEAD_STAGES_CLIENT = [
  "Nuevo",
  "Contactado",
  "Calificado",
  "Propuesta Enviada",
  "Negociación",
  "Ganado",
  "Perdido",
] as const;

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


interface FindBusinessesParams {
  country?: string;
  place?: string;
  type?: string;
  keywords?: string;
}

const LOCAL_STORAGE_LEADS_KEY_PREFIX = 'leadsia_leads_';

const getLocalStorageKey = (userId: string) => {
    return `${LOCAL_STORAGE_LEADS_KEY_PREFIX}${userId}`;
};


export async function findBusinesses(params: FindBusinessesParams): Promise<Business[]> {
  const queryParams = new URLSearchParams();
  if (params.country) queryParams.append('country', params.country);
  if (params.place) queryParams.append('place', params.place);
  if (params.type) queryParams.append('type', params.type);
  if (params.keywords) queryParams.append('keywords', params.keywords);

  const response = await fetch(`/api/findBusinesses?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al buscar negocios.');
  }
  const data = await response.json();
  return data.results || [];
}

export async function getPlaceDetails(placeId: string): Promise<BusinessDetail | null> {
  const response = await fetch(`/api/getPlaceDetails?placeId=${placeId}`);
  if (!response.ok) {
    // It's acceptable to return null or throw a specific error if details can't be loaded
    console.error(`Error fetching details for placeId ${placeId}:`, response.statusText);
    return null;
    // const errorData = await response.json();
    // throw new Error(errorData.message || 'Error al cargar detalles del negocio.');
  }
  const data = await response.json();
  return data.result || null;
}

export async function saveLeads(leadsToSave: Business[], userId: string) {
  let savedCount = 0;
  const localLeadsToSave: LeadClient[] = [];
  const currentTimestampISO = new Date().toISOString();
  const localStorageKey = getLocalStorageKey(userId);


  const leadsDataToSaveFormatted = leadsToSave
      .map(b => ({
        uid: userId,
        placeId: b.place_id,
        name: b.name,
        address: b.formatted_address || b.vicinity || null,
        phone: b.international_phone_number || null,
        website: b.website || null,
        businessType: b.types && b.types.length > 0 ? b.types[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null,
        source: 'google_places_search',
        stage: 'Nuevo' as LeadStageClient,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        images: [],
      }));


  for (const leadData of leadsDataToSaveFormatted) {
    try {
      const leadsCollectionRef = collection(db, 'leads');
      // Check for duplicates before adding
      const q = query(leadsCollectionRef, where("uid", "==router", userId), where("placeId", "==", leadData.placeId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(leadsCollectionRef, leadData as any); // Cast to any to satisfy Firestore type if serverTimestamp causes issues client-side
        savedCount++;
      } else {
        console.log(`Lead ${leadData.name} (Place ID: ${leadData.placeId}) ya existe para este usuario. Omitiendo.`);
        // Optionally, provide a toast for already existing leads if desired.
      }
    } catch (error: any) {
      console.error("Error al guardar lead en Firestore:", error);
      toast({ title: "Error al Guardar Lead", description: `El lead ${leadData.name} no se pudo guardar. Guardando localmente.`, variant: "default" });

      if (localStorageKey) {
        // Prepare for local storage
        localLeadsToSave.push({
          id: `local_${leadData.placeId}_${Date.now()}`, // Unique local ID
          uid: leadData.uid,
          placeId: leadData.placeId,
          name: leadData.name,
          address: leadData.address,
          phone: leadData.phone,
          website: leadData.website,
          businessType: leadData.businessType,
          source: LOCAL_FALLBACK_SOURCE,
          stage: 'Nuevo' as LeadStageClient,
          createdAt: currentTimestampISO, // ISO string for local storage
          updatedAt: currentTimestampISO, // ISO string for local storage
        });
      }
    }
  }

  if (savedCount > 0) {
    toast({ title: "Éxito", description: `¡${savedCount} lead(s) guardados correctamente!` });
  } else if (leadsToSave.length > 0 && savedCount === 0 && localLeadsToSave.length === 0) {
     toast({ title: "Información", description: "Todos los leads seleccionados ya existían o no se pudieron guardar." });
  }


  if (localLeadsToSave.length > 0) {
    if (localStorageKey) {
      try {
        const existingLocalLeadsString = localStorage.getItem(localStorageKey);
        let allLocalLeads: LeadClient[] = [];
        if (existingLocalLeadsString) {
          allLocalLeads = JSON.parse(existingLocalLeadsString);
        }
        // Ensure no duplicates are added to local storage based on placeId for local_source
        const leadsToAddFiltered = localLeadsToSave.filter(newLead =>
          !allLocalLeads.some(existingLead => existingLead.placeId === newLead.placeId && existingLead.id.startsWith('local_'))
        );

        const updatedLocalLeads = [...allLocalLeads, ...leadsToAddFiltered];
        localStorage.setItem(localStorageKey, JSON.stringify(updatedLocalLeads));

        if (leadsToAddFiltered.length > 0) {
          toast({ title: "Guardado Localmente", description: `${leadsToAddFiltered.length} lead(s) guardados localmente debido a error con servidor.` });
        } else {
           toast({ title: "Información Local", description: "Algunos leads ya estaban guardados localmente o no se añadieron nuevos.", variant: "default" });
        }
      } catch (localSaveError: any) {
        toast({ title: "Error en Guardado Local", description: `No se pudieron guardar los leads localmente: ${localSaveError.message}`, variant: "destructive" });
      }
    }
  }

  return { savedCount, localSavedCount: localLeadsToSave.length };
}