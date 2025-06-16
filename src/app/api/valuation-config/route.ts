import { NextRequest, NextResponse } from 'next/server';
import { authAdmin, firestoreDbAdmin } from '@/lib/firebaseAdmin';
import { ValuationConfig } from '@/types/valuation';
import { DEFAULT_VALUATION_CONFIG } from '@/config/defaultValuationConfig';

const COLLECTION_NAME = 'valuationConfigs';

export async function GET(request: NextRequest) {
  try {
    if (!authAdmin || !firestoreDbAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Obtener configuraciones del usuario
    const configsSnapshot = await firestoreDbAdmin
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const configs: ValuationConfig[] = [];

    configsSnapshot.forEach((doc) => {
      configs.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as ValuationConfig);
    });

    // Si no hay configuraciones, crear una por defecto
    // Esto automáticamente creará la colección si no existe
    if (configs.length === 0) {
      console.log(`Creando configuración por defecto para usuario ${userId} - Colección ${COLLECTION_NAME} será creada automáticamente si no existe`);
      
      const defaultConfig: ValuationConfig = {
        ...DEFAULT_VALUATION_CONFIG,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firestore creará automáticamente la colección al añadir el primer documento
      const docRef = await firestoreDbAdmin.collection(COLLECTION_NAME).add(defaultConfig);
      const createdConfig = {
        id: docRef.id,
        ...defaultConfig,
      };
      configs.push(createdConfig);
      
      console.log(`Configuración por defecto creada con ID: ${docRef.id}`);
    }

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error('Error al obtener configuraciones de valoración:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!authAdmin || !firestoreDbAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    const configData = await request.json();

    // Si es activa, desactivar otras configuraciones del usuario
    if (configData.isActive) {
      const activeConfigsSnapshot = await firestoreDbAdmin
        .collection(COLLECTION_NAME)
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();

      const batch = firestoreDbAdmin.batch();
      activeConfigsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
      });
      await batch.commit();
    }

    // Crear nueva configuración
    const newConfig = {
      ...configData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await firestoreDbAdmin.collection(COLLECTION_NAME).add(newConfig);

    const createdConfig = {
      id: docRef.id,
      ...newConfig,
    } as ValuationConfig;

    return NextResponse.json({ config: createdConfig }, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear configuración de valoración:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!authAdmin || !firestoreDbAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id, ...configData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de configuración requerido' }, { status: 400 });
    }

    // Verificar que la configuración pertenece al usuario
    const configDoc = await firestoreDbAdmin.collection(COLLECTION_NAME).doc(id).get();
    
    if (!configDoc.exists) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
    }

    const configDocData = configDoc.data();
    if (configDocData?.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado para editar esta configuración' }, { status: 403 });
    }

    // Si se está activando, desactivar otras configuraciones
    if (configData.isActive && !configDocData?.isActive) {
      const activeConfigsSnapshot = await firestoreDbAdmin
        .collection(COLLECTION_NAME)
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();

      const batch = firestoreDbAdmin.batch();
      activeConfigsSnapshot.docs.forEach((doc) => {
        if (doc.id !== id) {
          batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
        }
      });
      await batch.commit();
    }

    // Actualizar configuración
    const updatedConfig = {
      ...configData,
      updatedAt: new Date(),
    };

    await firestoreDbAdmin.collection(COLLECTION_NAME).doc(id).update(updatedConfig);

    const finalConfig = {
      id,
      ...configDocData,
      ...updatedConfig,
      createdAt: configDocData?.createdAt?.toDate(),
    } as ValuationConfig;

    return NextResponse.json({ config: finalConfig });
  } catch (error: any) {
    console.error('Error al actualizar configuración de valoración:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!authAdmin || !firestoreDbAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de configuración requerido' }, { status: 400 });
    }

    // Verificar que la configuración pertenece al usuario
    const configDoc = await firestoreDbAdmin.collection(COLLECTION_NAME).doc(id).get();
    
    if (!configDoc.exists) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
    }

    const configData = configDoc.data();
    if (configData?.userId !== userId) {
      return NextResponse.json({ error: 'No autorizado para eliminar esta configuración' }, { status: 403 });
    }

    // No permitir eliminar la configuración activa si es la única
    if (configData?.isActive) {
      const allConfigsSnapshot = await firestoreDbAdmin
        .collection(COLLECTION_NAME)
        .where('userId', '==', userId)
        .get();

      if (allConfigsSnapshot.size === 1) {
        return NextResponse.json({ 
          error: 'No se puede eliminar la única configuración activa' 
        }, { status: 400 });
      }
    }

    // Eliminar configuración
    await firestoreDbAdmin.collection(COLLECTION_NAME).doc(id).delete();

    return NextResponse.json({ message: 'Configuración eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar configuración de valoración:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}