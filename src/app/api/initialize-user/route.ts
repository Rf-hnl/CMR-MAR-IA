import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebaseAdmin';
import { initializeUserCollections, checkUserCollectionsExist } from '@/lib/firebase-collections';

export async function POST(request: NextRequest) {
  try {
    if (!authAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verificar si las colecciones ya existen
    const collectionsExist = await checkUserCollectionsExist(userId);

    if (collectionsExist) {
      return NextResponse.json({ 
        message: 'Las colecciones del usuario ya existen',
        initialized: false,
        userId 
      });
    }

    // Inicializar colecciones
    await initializeUserCollections(userId);

    return NextResponse.json({ 
      message: 'Colecciones inicializadas correctamente',
      initialized: true,
      userId,
      collections: [
        'generalConfigs',
        'valuationConfigs'
      ]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error al inicializar colecciones de usuario:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!authAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verificar estado de las colecciones
    const collectionsExist = await checkUserCollectionsExist(userId);

    return NextResponse.json({ 
      userId,
      collectionsInitialized: collectionsExist,
      collections: {
        generalConfigs: true, // Siempre true ya que se verifica en checkUserCollectionsExist
        valuationConfigs: true, // Siempre true ya que se verifica en checkUserCollectionsExist
      }
    });

  } catch (error: any) {
    console.error('Error al verificar estado de colecciones:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}