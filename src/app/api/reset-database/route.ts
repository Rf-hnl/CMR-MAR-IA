import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  if (!firestoreDbAdmin || !authAdmin) {
    return NextResponse.json({ 
      message: 'Error del Servidor: Firebase Admin SDK no inicializado.' 
    }, { status: 500 });
  }

  // Verificar autorización
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
    const { confirmationText } = await request.json();
    
    // Verificar texto de confirmación
    if (confirmationText !== 'RESET DATABASE') {
      return NextResponse.json({ 
        message: 'Texto de confirmación incorrecto.' 
      }, { status: 400 });
    }

    console.log('🔥 INICIANDO RESET COMPLETO DE BASE DE DATOS...');
    
    // Lista de colecciones a eliminar
    const collections = [
      'users',
      'organizations', 
      'organizationInvites',
      'meta-lead-ads',
      'leads', // legacy
      'products',
      'services',
      'general-config',
      'prompt-configs',
      'valuation-configs'
    ];

    // Eliminar todas las colecciones
    for (const collectionName of collections) {
      console.log(`🗑️ Eliminando colección: ${collectionName}`);
      await deleteCollection(collectionName);
    }

    console.log('✅ Todas las colecciones eliminadas');

    // Crear datos de prueba
    await createTestData();

    console.log('🎉 Reset de base de datos completado');

    return NextResponse.json({ 
      message: 'Base de datos reseteada correctamente con datos de prueba.',
      success: true 
    }, { status: 200 });

  } catch (error: any) {
    console.error('💥 Error durante el reset de base de datos:', error);
    return NextResponse.json({ 
      message: 'Error durante el reset de base de datos.',
      error: error.message 
    }, { status: 500 });
  }
}

async function deleteCollection(collectionName: string) {
  const batchSize = 100;
  let deleted = 0;

  while (true) {
    const snapshot = await firestoreDbAdmin!
      .collection(collectionName)
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      break;
    }

    const batch = firestoreDbAdmin!.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deleted += snapshot.size;
    console.log(`   Eliminados ${deleted} documentos de ${collectionName}`);
  }

  console.log(`✅ Colección ${collectionName} eliminada completamente (${deleted} documentos)`);
}

async function createTestData() {
  console.log('🏗️ Creando datos de prueba...');

  // Crear organización de prueba
  const testOrgRef = await firestoreDbAdmin!.collection('organizations').add({
    name: 'Organización de Prueba',
    description: 'Esta es una organización de prueba creada durante el reset de la base de datos',
    ownerId: 'test-user-id',
    memberIds: ['test-user-id'],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    settings: {
      allowMemberInvites: true,
      defaultLeadStage: 'Nuevo',
      timezone: 'America/Mexico_City'
    }
  });

  // Crear leads de prueba
  const testLeads = [
    {
      fullName: 'Juan Pérez',
      email: 'juan.perez@ejemplo.com',
      phoneNumber: '+52 55 1234 5678',
      companyName: 'Restaurante El Buen Sabor',
      campaignName: 'Campaña Meta Ads - Restaurantes',
      adName: 'Anuncio TPV Restaurantes',
      formName: 'Formulario Contacto',
      partnerName: 'Meta',
      platform: 'Facebook',
      source: 'meta_ads',
      stage: 'Nuevo',
      createdTime: new Date().toISOString(),
      businessType: 'Restaurante',
      uid: 'test-user-id',
      organizationId: testOrgRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      fullName: 'María García',
      email: 'maria.garcia@ejemplo.com', 
      phoneNumber: '+52 55 9876 5432',
      companyName: 'Boutique Fashion Style',
      campaignName: 'Campaña Meta Ads - Retail',
      adName: 'Anuncio TPV Retail',
      formName: 'Formulario Contacto',
      partnerName: 'Meta',
      platform: 'Instagram',
      source: 'meta_ads',
      stage: 'Contactado',
      createdTime: new Date().toISOString(),
      businessType: 'Retail',
      uid: 'test-user-id',
      organizationId: testOrgRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      fullName: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@ejemplo.com',
      phoneNumber: '+52 55 5555 1234',
      companyName: 'Clínica Dental Sonrisa',
      source: 'google_places',
      stage: 'Calificado',
      createdTime: new Date().toISOString(),
      businessType: 'Servicios de Salud',
      uid: 'test-user-id',
      organizationId: testOrgRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ];

  for (const lead of testLeads) {
    await firestoreDbAdmin!.collection('meta-lead-ads').add(lead);
  }

  // Crear productos de prueba
  const testProducts = [
    {
      name: 'TPV Básico',
      category: 'Terminal de Punto de Venta',
      price: 299.99,
      original_price: 399.99,
      description: 'Terminal de punto de venta básico ideal para pequeños comercios',
      userId: 'test-user-id',
      organizationId: testOrgRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'TPV Pro',
      category: 'Terminal de Punto de Venta',
      price: 599.99,
      original_price: 799.99,
      description: 'Terminal avanzado con funciones de inventario y reportes',
      userId: 'test-user-id',
      organizationId: testOrgRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ];

  for (const product of testProducts) {
    await firestoreDbAdmin!.collection('products').add(product);
  }

  // Crear configuración de prompts de prueba
  await firestoreDbAdmin!.collection('prompt-configs').add({
    userId: 'test-user-id',
    organizationId: testOrgRef.id,
    globalSettings: {
      temperature: 0.7,
      maxTokens: 1000,
      model: 'gemini-1.5-flash'
    },
    prompts: {
      welcomeMessage: {
        systemPrompt: 'Eres un asistente comercial especializado en generar mensajes de bienvenida personalizados.',
        userPrompt: 'Genera un mensaje de bienvenida para {leadName} que tiene un {businessType}.',
        isActive: true
      },
      evaluateBusiness: {
        systemPrompt: 'Eres un consultor de negocios que evalúa empresas.',
        userPrompt: 'Evalúa el negocio {businessType} de {leadName}.',
        isActive: true
      }
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  console.log('✅ Datos de prueba creados exitosamente');
  console.log(`   - Organización: ${testOrgRef.id}`);
  console.log(`   - ${testLeads.length} leads de prueba`);
  console.log(`   - ${testProducts.length} productos de prueba`);
  console.log('   - Configuración de prompts de prueba');
}