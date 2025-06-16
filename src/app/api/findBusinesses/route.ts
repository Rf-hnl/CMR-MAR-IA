
import {NextRequest, NextResponse} from 'next/server';
import {Client} from '@googlemaps/google-maps-services-js';

const client = new Client({});
const GOOGLE_PLACES_API_KEY = "AIzaSyCdAibVnXQdNG4oRizcWCI1fXijx4mBLGY";

// Helper function to get coordinates for a location
async function getLocationCoordinates(location: string): Promise<{lat: number, lng: number} | null> {
  try {
    const response = await client.geocode({
      params: {
        address: location,
        key: GOOGLE_PLACES_API_KEY,
      },
    });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch (error) {
    console.error('Error geocoding location:', error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ message: 'La clave API para Google Places no está configurada.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const place = searchParams.get('place');
  const businessApiType = searchParams.get('type');
  const keywords = searchParams.get('keywords');

  // Validación: Se requiere al menos palabras clave, tipo de negocio o lugar.
  if (!keywords && !businessApiType && !place) {
    return NextResponse.json({ message: 'Se requiere al menos palabras clave, tipo de negocio o lugar para la búsqueda.' }, { status: 400 });
  }

  // Build location string for geocoding
  let locationString = '';
  if (place && country) {
    locationString = `${place}, ${country}`;
  } else if (place) {
    locationString = place;
  } else if (country) {
    locationString = country;
  }

  console.log('Location string for geocoding:', locationString);

  try {
    let apiResponse;
    
    // Try to use location-based search if we have a specific place
    if (locationString) {
      const coordinates = await getLocationCoordinates(locationString);
      console.log('Geocoded coordinates:', coordinates);
      
      if (coordinates) {
        // Use nearbySearch for more accurate location-based results
        const nearbyParams: any = {
          location: coordinates,
          radius: 50000, // 50km radius
          key: GOOGLE_PLACES_API_KEY,
        };

        // Add type if specified
        if (businessApiType) {
          nearbyParams.type = businessApiType.toLowerCase();
        }

        // Add keyword if specified
        if (keywords) {
          nearbyParams.keyword = keywords;
        }

        console.log('Nearby search params:', nearbyParams);
        apiResponse = await client.placesNearby({ params: nearbyParams });
        
        // If nearby search doesn't yield good results, fall back to text search
        if (apiResponse.data.status !== 'OK' || (apiResponse.data.results && apiResponse.data.results.length < 5)) {
          console.log('Nearby search yielded few results, falling back to text search');
          apiResponse = null; // Will trigger text search below
        }
      }
    }

    // Fallback to text search if nearby search wasn't used or didn't work well
    if (!apiResponse) {
      let queryForApi = '';
      if (keywords) queryForApi += `${keywords} `;
      if (businessApiType) queryForApi += `${businessApiType} `;
      if (place) queryForApi += `in ${place} `;
      if (country) queryForApi += `in ${country} `;
      
      queryForApi = queryForApi.trim();

      const textParams: any = {
        query: queryForApi,
        key: GOOGLE_PLACES_API_KEY,
      };

      // Add region bias for country
      if (country && country.length === 2) {
        textParams.region = country.toUpperCase();
      }

      console.log('Text search params:', textParams);
      apiResponse = await client.textSearch({ params: textParams });
    }

    if (apiResponse.data.status === 'OK') {
      let results = apiResponse.data.results || [];
      
      // Additional filtering by location if we have coordinates
      if (locationString && results.length > 0) {
        const targetCoordinates = await getLocationCoordinates(locationString);
        if (targetCoordinates) {
          // Filter results by distance (keep only results within reasonable distance)
          results = results.filter(result => {
            if (result.geometry?.location) {
              const distance = getDistanceFromLatLonInKm(
                targetCoordinates.lat,
                targetCoordinates.lng,
                result.geometry.location.lat,
                result.geometry.location.lng
              );
              return distance <= 100; // Within 100km
            }
            return true; // Keep results without coordinates
          });
        }
      }
      
      return NextResponse.json({ results }, { status: 200 });
    } else if (apiResponse.data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ results: [] }, { status: 200 });
    } else {
      console.error('Error de Google Places API:', apiResponse.data.status, apiResponse.data.error_message);
      return NextResponse.json({ message: apiResponse.data.error_message || `Error de Google Places API: ${apiResponse.data.status}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error al llamar a Google Places API:', error);
    return NextResponse.json({ message: 'Falló la obtención de datos de Google Places API.', error: error.message }, { status: 500 });
  }
}

// Helper function to calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
