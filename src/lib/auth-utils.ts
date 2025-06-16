import { NextRequest } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export interface AuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string;
    organizationId?: string;
  };
  error?: string;
}

export async function verifyAuthToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Token de autorización requerido'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken) {
      return {
        success: false,
        error: 'Token inválido'
      };
    }

    // Get user data from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();

    const userData = userDoc.data();

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        organizationId: userData?.organizationId
      }
    };

  } catch (error) {
    console.error('Error verifying auth token:', error);
    return {
      success: false,
      error: 'Error al verificar token de autenticación'
    };
  }
}

export async function getOrganizationFromUser(userId: string): Promise<string | null> {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return userData?.organizationId || null;
  } catch (error) {
    console.error('Error getting organization from user:', error);
    return null;
  }
}

export async function validateUserAccess(userId: string, organizationId: string): Promise<boolean> {
  try {
    const userOrganizationId = await getOrganizationFromUser(userId);
    return userOrganizationId === organizationId;
  } catch (error) {
    console.error('Error validating user access:', error);
    return false;
  }
}