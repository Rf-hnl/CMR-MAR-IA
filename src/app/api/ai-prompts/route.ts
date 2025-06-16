import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { PromptConfig } from '@/types/ai-prompts';

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
    const promptConfigDoc = await firestoreDbAdmin
      .collection('promptConfigs')
      .doc(uid)
      .get();

    if (!promptConfigDoc.exists) {
      return NextResponse.json({ 
        message: 'Configuración no encontrada',
        config: null 
      }, { status: 404 });
    }

    const data = promptConfigDoc.data();
    const config: PromptConfig = {
      id: promptConfigDoc.id,
      userId: data.userId,
      templates: data.templates.map((template: any) => ({
        ...template,
        createdAt: template.createdAt.toDate(),
        updatedAt: template.updatedAt.toDate()
      })),
      globalSettings: data.globalSettings,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };

    return NextResponse.json({ config }, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener configuración de prompts:', error);
    return NextResponse.json({ 
      message: 'Error al obtener la configuración',
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { config }: { config: PromptConfig } = body;

    if (!config || !config.templates || !config.globalSettings) {
      return NextResponse.json({ 
        message: 'Datos de configuración inválidos.' 
      }, { status: 400 });
    }

    // Validate templates
    for (const template of config.templates) {
      if (!template.name || !template.variables || !Array.isArray(template.variables)) {
        return NextResponse.json({ 
          message: 'Plantilla de prompt inválida.' 
        }, { status: 400 });
      }
    }

    const configData = {
      userId: uid,
      templates: config.templates.map(template => ({
        ...template,
        userId: uid,
        updatedAt: new Date()
      })),
      globalSettings: config.globalSettings,
      updatedAt: new Date()
    };

    // Check if config exists
    const existingDoc = await firestoreDbAdmin
      .collection('promptConfigs')
      .doc(uid)
      .get();

    if (existingDoc.exists) {
      // Update existing config
      await firestoreDbAdmin
        .collection('promptConfigs')
        .doc(uid)
        .update(configData);
    } else {
      // Create new config
      await firestoreDbAdmin
        .collection('promptConfigs')
        .doc(uid)
        .set({
          ...configData,
          createdAt: new Date()
        });
    }

    return NextResponse.json({ 
      message: 'Configuración guardada correctamente.' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error al guardar configuración de prompts:', error);
    return NextResponse.json({ 
      message: 'Error al guardar la configuración',
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    await firestoreDbAdmin
      .collection('promptConfigs')
      .doc(uid)
      .delete();

    return NextResponse.json({ 
      message: 'Configuración eliminada correctamente.' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar configuración de prompts:', error);
    return NextResponse.json({ 
      message: 'Error al eliminar la configuración',
      error: error.message 
    }, { status: 500 });
  }
}