import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import type { Timestamp } from 'firebase-admin/firestore';
import { convertMetaLeadToExtended } from '@/lib/lead-converter';
import type { MetaLeadAdsModel } from '@/types/meta-lead-ads';
import type { ExtendedLead } from '@/types';

export async function GET(request: NextRequest) {
  if (!authAdmin || !firestoreDbAdmin) {
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      message: 'No autorizado: Token faltante o inválido.' 
    }, { status: 401 });
  }
  
  const token = authorizationHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await authAdmin.verifyIdToken(token);
  } catch (error) {
    console.error('Error al verificar el token de ID de Firebase:', error);
    return NextResponse.json({ 
      message: 'No autorizado: Token inválido.' 
    }, { status: 401 });
  }

  const uid = decodedToken.uid;
  if (!uid) {
    return NextResponse.json({ 
      message: 'No autorizado: UID no encontrado en el token.' 
    }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    console.log('organizationId:', organizationId);
    const source = searchParams.get('source'); // Filter by source
    const search = searchParams.get('search'); // Search term
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    // Build query
    let query = firestoreDbAdmin
      .collection('meta-lead-ads')
      .where('organizationId', '==', organizationId);

    // Add source filter if provided
    if (source && source !== 'all') {
      // Map UI source to partner name patterns
      const sourceMapping: { [key: string]: string } = {
        'meta_ads': 'Meta',
        'google_places': 'Google',
        'xml_import': 'XML',
        'csv_import': 'CSV',
        'manual': 'Manual'
      };
      
      if (sourceMapping[source]) {
        query = query.where('partnerName', '>=', sourceMapping[source])
                    .where('partnerName', '<', sourceMapping[source] + '\uf8ff');
      }
    }

    // Order by updated date
    query = query.orderBy('updatedAt', 'desc');

    // Apply pagination
    if (offset > 0) {
      query = query.offset(offset);
    }
    query = query.limit(limit);

    const snapshot = await query.get();

    interface FirestoreMetaLead {
      id: string;
      data: MetaLeadAdsModel & {
        uid: string;
        organizationId: string;
        stage?: string;
        createdAt: Timestamp;
        updatedAt: Timestamp;
      };
    }

    let metaLeads = snapshot.docs.map((doc): FirestoreMetaLead => ({
      id: doc.id,
      data: doc.data() as FirestoreMetaLead['data']
    }));

    // Apply search filter if provided (client-side filtering for flexibility)
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase();
      metaLeads = metaLeads.filter(({ data }) => 
        data.fullName?.toLowerCase().includes(searchTerm) ||
        data.email?.toLowerCase().includes(searchTerm) ||
        data.phoneNumber?.toLowerCase().includes(searchTerm) ||
        data.companyName?.toLowerCase().includes(searchTerm) ||
        data.campaignName?.toLowerCase().includes(searchTerm) ||
        data.adName?.toLowerCase().includes(searchTerm)
      );
    }

    // Convert to ExtendedLead format for UI compatibility
    const extendedLeads: ExtendedLead[] = metaLeads.map(({ id, data }) => {
      const metaLeadWithId = { ...data, id };
      return convertMetaLeadToExtended(
        metaLeadWithId,
        data.uid,
        data.organizationId,
        data.stage || 'Nuevo'
      );
    });

    // Get total count for pagination
    const totalQuery = firestoreDbAdmin
      .collection('meta-lead-ads')
      // .where('organizationId', '==', organizationId);
    
    const totalSnapshot = await totalQuery.count().get();
    const totalCount = totalSnapshot.data().count;

    return NextResponse.json({ 
      leads: extendedLeads,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al obtener leads de meta-lead-ads:', error);
    return NextResponse.json({ 
      message: 'Error al obtener los leads.',
      error: error.message 
    }, { status: 500 });
  }
}