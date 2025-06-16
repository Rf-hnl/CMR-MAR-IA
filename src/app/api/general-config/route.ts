import { NextRequest, NextResponse } from 'next/server';
import { authAdmin, firestoreDbAdmin } from '@/lib/firebaseAdmin';
import { GeneralConfig } from '@/types/general-config';

const COLLECTION_NAME = 'generalConfigs';

// GET - Obtener configuración general del usuario
export async function GET(request: NextRequest) {
  try {
    if (!authAdmin || !firestoreDbAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Buscar configuración del usuario
    const configsSnapshot = await firestoreDbAdmin
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (configsSnapshot.empty) {
      // No hay configuración, crear una por defecto
      // Esto automáticamente creará la colección si no existe
      console.log(`Creando configuración general por defecto para usuario ${userId} - Colección ${COLLECTION_NAME} será creada automáticamente si no existe`);
      
      const defaultConfig = {
        currency: {
          code: 'EUR',
          symbol: '€',
          position: 'after'
        },
        theme: {
          mode: 'system',
          primaryColor: '#3b82f6',
          accentColor: '#8b5cf6'
        },
        locale: {
          language: 'es',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          timezone: 'Europe/Madrid'
        },
        notifications: {
          email: true,
          browser: true,
          sound: false,
          leadUpdates: true,
          systemAlerts: true
        },
        app: {
          companyName: 'MAR-IA',
          sidebarCollapsed: false,
          defaultDashboard: '/business-finder',
          itemsPerPage: 20
        },
        data: {
          autoSave: true,
          backupFrequency: 'daily',
          dataRetention: 365
        },
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firestore creará automáticamente la colección al añadir el primer documento
      const docRef = await firestoreDbAdmin.collection(COLLECTION_NAME).add(defaultConfig);
      
      const createdConfig = {
        id: docRef.id,
        ...defaultConfig,
      };
      
      console.log(`Configuración general por defecto creada con ID: ${docRef.id}`);
      return NextResponse.json({ config: createdConfig });
    }

    const configDoc = configsSnapshot.docs[0];
    const config = {
      id: configDoc.id,
      ...configDoc.data(),
      createdAt: configDoc.data().createdAt?.toDate(),
      updatedAt: configDoc.data().updatedAt?.toDate(),
    } as GeneralConfig;

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('Error al obtener configuración general:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Crear nueva configuración general
export async function POST(request: NextRequest) {
  try {
    if (!authAdmin || !firestoreDbAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    const configData = await request.json();

    // Verificar si ya existe una configuración
    const existingConfigSnapshot = await firestoreDbAdmin
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingConfigSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Ya existe una configuración para este usuario. Use PUT para actualizar.' 
      }, { status: 409 });
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
    } as GeneralConfig;

    return NextResponse.json({ config: createdConfig }, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear configuración general:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Actualizar configuración general
export async function PUT(request: NextRequest) {
  try {
    if (!authAdmin || !firestoreDbAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    const configData = await request.json();

    // Buscar configuración existente
    const configsSnapshot = await firestoreDbAdmin
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (configsSnapshot.empty) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
    }

    const configDoc = configsSnapshot.docs[0];
    
    // Actualizar configuración
    const updatedConfig = {
      ...configData,
      userId,
      updatedAt: new Date(),
    };

    await firestoreDbAdmin.collection(COLLECTION_NAME).doc(configDoc.id).update(updatedConfig);

    const finalConfig = {
      id: configDoc.id,
      ...updatedConfig,
      createdAt: configDoc.data().createdAt?.toDate(),
    } as GeneralConfig;

    return NextResponse.json({ config: finalConfig });
  } catch (error: any) {
    console.error('Error al actualizar configuración general:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Eliminar configuración general (resetear a valores por defecto)
export async function DELETE(request: NextRequest) {
  try {
    if (!authAdmin || !firestoreDbAdmin) {
      return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Buscar y eliminar configuración
    const configsSnapshot = await firestoreDbAdmin
      .collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .get();

    const batch = firestoreDbAdmin.batch();
    configsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ message: 'Configuración eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar configuración general:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}