import { firestoreDbAdmin } from '@/lib/firebaseAdmin';
import { DEFAULT_VALUATION_CONFIG } from '@/config/defaultValuationConfig';

/**
 * Inicializa las colecciones necesarias en Firestore para un usuario
 * Firestore crea automáticamente las colecciones cuando se añade el primer documento
 * Esta función asegura que las configuraciones por defecto existan
 */
export async function initializeUserCollections(userId: string) {
  if (!firestoreDbAdmin) {
    throw new Error('Firebase Admin no inicializado');
  }

  const collections = [
    {
      name: 'generalConfigs',
      checkExistence: async () => {
        const snapshot = await firestoreDbAdmin
          .collection('generalConfigs')
          .where('userId', '==', userId)
          .limit(1)
          .get();
        return !snapshot.empty;
      },
      createDefault: async () => {
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

        await firestoreDbAdmin.collection('generalConfigs').add(defaultConfig);
        console.log(`✅ Configuración general por defecto creada para usuario ${userId}`);
      }
    },
    {
      name: 'valuationConfigs',
      checkExistence: async () => {
        const snapshot = await firestoreDbAdmin
          .collection('valuationConfigs')
          .where('userId', '==', userId)
          .limit(1)
          .get();
        return !snapshot.empty;
      },
      createDefault: async () => {
        const defaultConfig = {
          ...DEFAULT_VALUATION_CONFIG,
          userId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await firestoreDbAdmin.collection('valuationConfigs').add(defaultConfig);
        console.log(`✅ Configuración de valoración por defecto creada para usuario ${userId}`);
      }
    }
  ];

  console.log(`🔄 Inicializando colecciones para usuario ${userId}...`);

  for (const collection of collections) {
    try {
      const exists = await collection.checkExistence();
      
      if (!exists) {
        console.log(`📦 Creando configuración por defecto para colección: ${collection.name}`);
        await collection.createDefault();
      } else {
        console.log(`✓ Colección ${collection.name} ya existe para usuario ${userId}`);
      }
    } catch (error) {
      console.error(`❌ Error al inicializar colección ${collection.name}:`, error);
      // No lanzamos el error para no interrumpir el proceso completo
    }
  }

  console.log(`✅ Inicialización de colecciones completada para usuario ${userId}`);
}

/**
 * Verifica si todas las colecciones necesarias existen para un usuario
 */
export async function checkUserCollectionsExist(userId: string): Promise<boolean> {
  if (!firestoreDbAdmin) {
    return false;
  }

  try {
    const [generalConfigExists, valuationConfigExists] = await Promise.all([
      firestoreDbAdmin
        .collection('generalConfigs')
        .where('userId', '==', userId)
        .limit(1)
        .get()
        .then(snapshot => !snapshot.empty),
      
      firestoreDbAdmin
        .collection('valuationConfigs')
        .where('userId', '==', userId)
        .limit(1)
        .get()
        .then(snapshot => !snapshot.empty)
    ]);

    return generalConfigExists && valuationConfigExists;
  } catch (error) {
    console.error('Error al verificar existencia de colecciones:', error);
    return false;
  }
}

/**
 * Función para inicializar automáticamente las colecciones al primer login
 */
export async function ensureUserCollections(userId: string) {
  const collectionsExist = await checkUserCollectionsExist(userId);
  
  if (!collectionsExist) {
    console.log(`🚀 Usuario ${userId} accediendo por primera vez, inicializando colecciones...`);
    await initializeUserCollections(userId);
  }
}