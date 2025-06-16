import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-utils';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { 
      leadId, 
      organizationId, 
      newStatus, 
      contactMethod, 
      responseStatus, 
      notes, 
      timestamp 
    } = body;

    // Validar datos requeridos
    if (!leadId || !organizationId || !newStatus) {
      return NextResponse.json(
        { error: 'leadId, organizationId y newStatus son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tenga acceso a la organización
    if (authResult.user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta organización' },
        { status: 403 }
      );
    }

    const db = admin.firestore();
    
    // Obtener referencia del lead
    const leadRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('leads')
      .doc(leadId);

    // Verificar que el lead existe
    const leadDoc = await leadRef.get();
    if (!leadDoc.exists) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      status: newStatus,
      lastContactedAt: timestamp || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Agregar información específica de contacto si se proporciona
    if (contactMethod) {
      updateData.lastContactMethod = contactMethod;
    }

    if (responseStatus) {
      updateData.responseStatus = responseStatus;
      
      // Si el responseStatus es 'visito_catalogo', agregar timestamp específico
      if (responseStatus === 'visito_catalogo') {
        updateData.catalogVisitedAt = admin.firestore.FieldValue.serverTimestamp();
      }
    }

    if (notes) {
      // Agregar nota al historial de actividades
      const currentData = leadDoc.data();
      const currentNotes = currentData?.notes || [];
      
      updateData.notes = [
        ...currentNotes,
        {
          id: Date.now().toString(),
          text: notes,
          timestamp: timestamp || new Date().toISOString(),
          type: 'status_change',
          userId: authResult.user.uid,
          metadata: {
            previousStatus: currentData?.status,
            newStatus,
            contactMethod,
            responseStatus
          }
        }
      ];
    }

    // Actualizar el lead
    await leadRef.update(updateData);

    console.log(`✅ Lead ${leadId} actualizado a estado: ${newStatus}`);

    return NextResponse.json({
      success: true,
      message: 'Estado del lead actualizado exitosamente',
      leadId,
      newStatus,
      timestamp: timestamp || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}