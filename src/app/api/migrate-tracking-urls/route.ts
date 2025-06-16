import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const dryRun = searchParams.get('dryRun') === 'true';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔧 ${dryRun ? 'Simulación' : 'Migración'} de tracking URLs para organizationId: ${organizationId}`);

    // Obtener todos los tracking links de la organización
    const trackingLinksSnapshot = await db
      .collection('organizations')
      .doc(organizationId)
      .collection('tracking-links')
      .get();

    let updatedCount = 0;
    let skippedCount = 0;
    const updates: any[] = [];

    for (const doc of trackingLinksSnapshot.docs) {
      const data = doc.data();
      const currentUrl = data.trackingUrl;

      // Verificar si la URL tiene el puerto incorrecto
      if (currentUrl && currentUrl.includes('localhost:3000')) {
        const newUrl = currentUrl.replace('localhost:3000', 'localhost:3047');
        
        updates.push({
          id: doc.id,
          currentUrl,
          newUrl,
          title: data.title,
          leadId: data.leadId
        });

        if (!dryRun) {
          // Actualizar el documento
          await doc.ref.update({
            trackingUrl: newUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            migrationNote: 'URL actualizada de puerto 3000 a 3047'
          });
        }

        updatedCount++;
        console.log(`✅ ${dryRun ? 'Sería actualizado' : 'Actualizado'}: ${doc.id} - ${data.title}`);
      } else {
        skippedCount++;
        console.log(`⏭️ Omitido: ${doc.id} - ${data.title} (URL ya correcta o no es localhost)`);
      }
    }

    const result = {
      success: true,
      dryRun,
      organizationId,
      totalLinks: trackingLinksSnapshot.docs.length,
      updatedCount,
      skippedCount,
      updates: dryRun ? updates : updates.map(u => ({ id: u.id, title: u.title, newUrl: u.newUrl })),
      message: dryRun 
        ? `Simulación completa: ${updatedCount} links serían actualizados, ${skippedCount} omitidos`
        : `Migración completa: ${updatedCount} links actualizados, ${skippedCount} omitidos`
    };

    console.log(`🎯 ${result.message}`);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error en migración de tracking URLs:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}