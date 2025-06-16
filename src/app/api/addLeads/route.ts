
import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { LeadFormatterFactory, type GooglePlacesLeadData } from '@/types/formatters/formatter-factory';


export async function POST(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    console.error("Firebase Admin SDK not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_JSON environment variable is correctly set.");
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado. Verifica la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON en la configuración del servidor.' 
    }, { status: 500 });
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'No autorizado: Token faltante o inválido.' }, { status: 401 });
  }
  const token = authorizationHeader.split('Bearer ')[1];

  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(token);
  } catch (error) {
    console.error('Error al verificar el token de ID de Firebase:', error);
    return NextResponse.json({ message: 'No autorizado: Token inválido.' }, { status: 401 });
  }

  const uid = decodedToken.uid;
  if (!uid) {
    return NextResponse.json({ message: 'No autorizado: UID no encontrado en el token.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leads, organizationId } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ message: 'No se proporcionaron leads o el formato es inválido.' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ message: 'organizationId es requerido.' }, { status: 400 });
    }

    console.log(`Attempting to save ${leads.length} leads for UID: ${uid}, Organization: ${organizationId}`);

    const batch = firestoreDbAdmin.batch();
    const metaLeadsCollection = firestoreDbAdmin.collection('meta-lead-ads');
    let savedCount = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        // Convert Google Places lead to MetaLeadAdsModel format
        const googlePlacesData: GooglePlacesLeadData = {
          place_id: lead.place_id,
          name: lead.name,
          vicinity: lead.vicinity,
          formatted_address: lead.formatted_address,
          international_phone_number: lead.phone,
          website: lead.website,
          types: lead.types || [],
          rating: lead.rating,
          business_status: lead.business_status
        };

        const formatResult = LeadFormatterFactory.formatGooglePlacesLead(
          googlePlacesData,
          uid,
          organizationId
        );

        if (!formatResult.success) {
          errors.push(`Error formatting lead ${lead.name}: ${formatResult.error}`);
          continue;
        }

        // Check for duplicates based on leadId or platformId
        const existingLeadQuery = await firestoreDbAdmin
          .collection('meta-lead-ads')
          .where('organizationId', '==', organizationId)
          .where('platformId', '==', lead.place_id)
          .limit(1)
          .get();

        if (!existingLeadQuery.empty) {
          console.log(`Lead ${lead.name} (Place ID: ${lead.place_id}) already exists. Skipping.`);
          continue;
        }

        const leadDocRef = metaLeadsCollection.doc();
        const metaLeadData = {
          ...formatResult.data,
          uid,
          organizationId,
          stage: 'Nuevo',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };

        console.log(`Preparing to save lead: ${JSON.stringify(metaLeadData)}`);
        batch.set(leadDocRef, metaLeadData);
        savedCount++;
      } catch (error: any) {
        errors.push(`Error processing lead ${lead.name}: ${error.message}`);
      }
    }

    if (savedCount > 0) {
      await batch.commit();
      console.log(`Successfully saved ${savedCount} leads for UID: ${uid}`);
    }

    const response: any = { 
      message: `¡${savedCount} lead(s) guardados correctamente!`,
      saved: savedCount,
      total: leads.length
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.message += ` (${errors.length} errores)`;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error al guardar leads en Firestore:', error);
    let requestBodyForLog;
    try {
      requestBodyForLog = await request.json(); // This might fail if body already read
    } catch (e) {
      requestBodyForLog = "Could not re-parse request body for logging. Check original body if available.";
    }
    console.error('Input data that caused error:', JSON.stringify(requestBodyForLog, null, 2));
    return NextResponse.json({ message: 'Falló al guardar los leads.', error: error.message || 'Error desconocido de Firestore' }, { status: 500 });
  }
}
