
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { authAdmin } from '@/lib/firebaseAdmin'; // Using Firebase Admin for auth check

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Cloudinary configuration environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not fully set on the server.");
  // Note: This check runs at module load time. If variables are dynamically set later, this might be too early.
  // However, for most hosting platforms, they are available at startup.
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  if (!authAdmin) {
    return NextResponse.json({ message: 'Error del Servidor: Firebase Admin SDK no inicializado.' }, { status: 500 });
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return NextResponse.json({ message: 'Error del Servidor: Configuración de Cloudinary incompleta en el servidor.' }, { status: 500 });
  }

  const authorizationHeader = request.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'No autorizado: Token faltante o inválido.' }, { status: 401 });
  }
  const token = authorizationHeader.split('Bearer ')[1];

  try {
    await authAdmin.verifyIdToken(token); // Verify user is authenticated
  } catch (error) {
    console.error('Error al verificar el token de ID de Firebase para la firma:', error);
    return NextResponse.json({ message: 'No autorizado: Token inválido.' }, { status: 401 });
  }

  try {
    // const body = await request.json(); // contextId is not strictly needed for signature itself unless used in folder/tags
    // const { contextId } = body; // e.g., leadId or 'new_product'

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Parameters to sign. You can add more parameters here if needed for your upload preset or direct call
    // For example, if you want to specify a folder:
    // const paramsToSign = { timestamp, folder: `your_folder/${contextId || 'general'}` };
    const paramsToSign = { timestamp };


    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      CLOUDINARY_API_SECRET! // Non-null assertion as we checked above
    );

    return NextResponse.json({ signature, timestamp }, { status: 200 });
  } catch (error: any) {
    console.error('Error al generar la firma para Cloudinary:', error);
    return NextResponse.json({ message: 'Falló al generar la firma para la subida.', error: error.message }, { status: 500 });
  }
}
