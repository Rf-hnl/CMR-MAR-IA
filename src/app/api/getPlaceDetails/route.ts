
import {NextRequest, NextResponse} from 'next/server';
import {Client, PlaceData, Language} from '@googlemaps/google-maps-services-js';

const client = new Client({});
const GOOGLE_PLACES_API_KEY = "AIzaSyCdAibVnXQdNG4oRizcWCI1fXijx4mBLGY"; // Asegúrate que esta clave esté aquí o se cargue de forma segura

export async function GET(request: NextRequest) {
  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ message: 'La clave API para Google Places no está configurada.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ message: 'Se requiere el ID del lugar (placeId).' }, { status: 400 });
  }

  try {
    const apiResponse = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'international_phone_number', 'formatted_phone_number', 'website', 'opening_hours', 'types', 'rating', 'place_id', 'vicinity', 'url', 'utc_offset', 'photos', 'price_level', 'user_ratings_total', 'reviews', 'geometry'],
        key: GOOGLE_PLACES_API_KEY,
        language: Language.es, // Opcional: para obtener resultados en español si están disponibles
      },
    });

    if (apiResponse.data.status === 'OK') {
      return NextResponse.json({ result: apiResponse.data.result as Partial<PlaceData> }, { status: 200 });
    } else {
      console.error('Error de Google Places API (Place Details):', apiResponse.data.status, apiResponse.data.error_message);
      return NextResponse.json({ message: apiResponse.data.error_message || `Error de Google Places API: ${apiResponse.data.status}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error al llamar a Google Places API (Place Details):', error);
    return NextResponse.json({ message: 'Falló la obtención de detalles del lugar desde Google Places API.', error: error.message }, { status: 500 });
  }
}
