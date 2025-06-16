
import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import type { Timestamp } from 'firebase-admin/firestore';

interface LeadDocument {
  id: string;
  uid: string;
  organizationId?: string;
  placeId: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  company: string | null;
  businessType: string | null;
  source: string;
  stage: string;
  notes: string | null;
  metaAdData?: any; // Meta Ads specific data
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export async function GET(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return NextResponse.json({ message: 'Error del Servidor: Firebase Admin SDK no inicializado.' }, { status: 500 });
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
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Query leads by organization first, fallback to uid for backward compatibility
    let leadsSnapshot;
    if (organizationId) {
      leadsSnapshot = await firestoreDbAdmin
        .collection('leads')
        .where('organizationId', '==', organizationId)
        .orderBy('updatedAt', 'desc')
        .get();
    } else {
      leadsSnapshot = await firestoreDbAdmin
        .collection('leads')
        .where('uid', '==', uid)
        .orderBy('updatedAt', 'desc')
        .get();
    }

    interface FirestoreLeadData {
      uid: string;
      organizationId?: string;
      placeId: string | null;
      name: string;
      address?: string;
      phone?: string;
      website?: string;
      email?: string;
      company?: string;
      businessType?: string;
      source: string;
      stage: string;
      notes?: string;
      metaAdData?: any;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }

    interface FirestoreLeadDoc {
      id: string;
      data: FirestoreLeadData;
    }

    const leads: LeadDocument[] = leadsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot<FirestoreLeadData>): LeadDocument => {
      const data: FirestoreLeadData = doc.data();
      const createdAt: string = data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : (data.createdAt?.toDate?.() || new Date()).toISOString();
      const updatedAt: string = data.updatedAt instanceof Date
        ? data.updatedAt.toISOString()
        : (data.updatedAt?.toDate?.() || new Date()).toISOString();

      return {
        id: doc.id,
        uid: data.uid,
        organizationId: data.organizationId,
        placeId: data.placeId || null,
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        website: data.website || null,
        email: data.email || null,
        company: data.company || null,
        businessType: data.businessType || null,
        source: data.source,
        stage: data.stage,
        notes: data.notes || null,
        metaAdData: data.metaAdData || null,
        createdAt,
        updatedAt,
      } as LeadDocument;
    });

    return NextResponse.json({ leads }, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener leads de Firestore:', error);
    return NextResponse.json({ message: 'Falló al obtener los leads.', error: error.message }, { status: 500 });
  }
}
