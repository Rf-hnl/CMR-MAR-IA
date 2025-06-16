import { NextRequest, NextResponse } from 'next/server';
import { firestoreDbAdmin, authAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { LeadFormatterFactory, LeadSource } from '@/types/formatters/formatter-factory';

/**
 * Migration endpoint to convert old 'leads' collection to new 'meta-lead-ads' format
 * This is a one-time migration utility
 */
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
    const { organizationId, dryRun = true } = body;

    if (!organizationId) {
      return NextResponse.json({ 
        message: 'organizationId es requerido.' 
      }, { status: 400 });
    }

    console.log(`Starting migration for organization: ${organizationId} (dry run: ${dryRun})`);

    // Get all leads from old collection
    const oldLeadsSnapshot = await firestoreDbAdmin
      .collection('leads')
      .where('organizationId', '==', organizationId)
      .get();

    if (oldLeadsSnapshot.empty) {
      return NextResponse.json({
        message: 'No se encontraron leads en la colección antigua para migrar.',
        migrated: 0,
        skipped: 0,
        errors: []
      }, { status: 200 });
    }

    const oldLeads = oldLeadsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${oldLeads.length} old leads to migrate`);

    // Check which leads already exist in meta-lead-ads
    const metaLeadsSnapshot = await firestoreDbAdmin
      .collection('meta-lead-ads')
      .where('organizationId', '==', organizationId)
      .get();

    const existingMetaLeadIds = new Set(
      metaLeadsSnapshot.docs.map(doc => doc.data().platformId || doc.data().leadId)
    );

    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const migrationResults: any[] = [];

    if (!dryRun) {
      const batch = firestoreDbAdmin.batch();
      const metaLeadsCollection = firestoreDbAdmin.collection('meta-lead-ads');

      for (const lead of oldLeads) {
        try {
          // Skip if already migrated (check by placeId or leadId)
          if (existingMetaLeadIds.has(lead.placeId) || existingMetaLeadIds.has(lead.id)) {
            skippedCount++;
            continue;
          }

          // Determine source and format accordingly
          let formatResult;
          
          if (lead.source?.includes('google_places')) {
            // Format as Google Places lead
            const googlePlacesData = {
              place_id: lead.placeId || `migrated_${lead.id}`,
              name: lead.name,
              formatted_address: lead.address,
              international_phone_number: lead.phone,
              website: lead.website,
              types: lead.businessType ? [lead.businessType.toLowerCase().replace(/\s+/g, '_')] : [],
              rating: null,
              business_status: 'OPERATIONAL'
            };

            formatResult = LeadFormatterFactory.formatGooglePlacesLead(
              googlePlacesData,
              lead.uid,
              lead.organizationId
            );
          } else if (lead.source?.includes('xml')) {
            // Format as XML import
            const xmlData = {
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              company: lead.company,
              address: lead.address,
              website: lead.website,
              businessType: lead.businessType,
              notes: lead.notes,
              suggestedStage: lead.stage
            };

            formatResult = LeadFormatterFactory.formatXmlImportLead(
              xmlData,
              lead.uid,
              lead.organizationId
            );
          } else if (lead.source?.includes('csv')) {
            // Format as CSV import
            const csvData = {
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              company: lead.company,
              address: lead.address,
              website: lead.website,
              businessType: lead.businessType,
              notes: lead.notes,
              suggestedStage: lead.stage
            };

            formatResult = LeadFormatterFactory.formatCsvImportLead(
              csvData,
              lead.uid,
              lead.organizationId
            );
          } else {
            // Create a manual entry format
            formatResult = {
              success: true,
              data: {
                adName: `Manual_${lead.businessType || 'General'}_Lead`,
                adSetId: `manual_adset_${Date.now()}`,
                adSetName: `Manual - ${lead.businessType || 'General'}`,
                campaignId: `manual_campaign_${Date.now()}`,
                campaignName: `Manual Campaign - ${lead.businessType || 'General'}`,
                companyName: lead.company || lead.name || 'Sin empresa',
                customDisclaimerResponses: lead.notes || 'Lead migrado desde sistema anterior',
                dateCreated: lead.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                email: lead.email || '',
                formId: `manual_form_${Date.now()}`,
                fullName: lead.name || 'Sin nombre',
                homeListing: lead.businessType?.toLowerCase().includes('inmobilia') ? (lead.address || '') : '',
                isOrganic: 'true',
                leadId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                partnerName: 'Manual Entry (Migrated)',
                phoneNumber: lead.phone || '',
                platformId: lead.placeId || `manual_${lead.id}`,
                retailerItemId: `item_manual_${Date.now()}`,
                updatedAt: lead.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                vehicle: lead.businessType?.toLowerCase().includes('auto') ? (lead.businessType || '') : '',
                visitRequest: 'no'
              }
            };
          }

          if (!formatResult.success) {
            errors.push(`Error formatting lead ${lead.name}: ${formatResult.error}`);
            continue;
          }

          const metaLeadData = {
            ...formatResult.data,
            uid: lead.uid,
            organizationId: lead.organizationId,
            stage: lead.stage || 'Nuevo',
            // Preserve original timestamps if available
            createdAt: lead.createdAt || FieldValue.serverTimestamp(),
            updatedAt: lead.updatedAt || FieldValue.serverTimestamp(),
            // Add migration metadata
            _migrated: true,
            _originalLeadId: lead.id,
            _migrationDate: FieldValue.serverTimestamp()
          };

          const newDocRef = metaLeadsCollection.doc();
          batch.set(newDocRef, metaLeadData);
          
          migratedCount++;
          migrationResults.push({
            originalId: lead.id,
            newId: newDocRef.id,
            name: lead.name,
            source: lead.source
          });

        } catch (error: any) {
          errors.push(`Error migrating lead ${lead.name}: ${error.message}`);
        }
      }

      if (migratedCount > 0) {
        await batch.commit();
        console.log(`Migration completed: ${migratedCount} leads migrated`);
      }
    } else {
      // Dry run - just count what would be migrated
      for (const lead of oldLeads) {
        if (existingMetaLeadIds.has(lead.placeId) || existingMetaLeadIds.has(lead.id)) {
          skippedCount++;
        } else {
          migratedCount++;
          migrationResults.push({
            originalId: lead.id,
            name: lead.name,
            source: lead.source,
            wouldMigrate: true
          });
        }
      }
    }

    return NextResponse.json({
      message: dryRun 
        ? `Dry run completado. ${migratedCount} leads serían migrados, ${skippedCount} omitidos.`
        : `Migración completada. ${migratedCount} leads migrados, ${skippedCount} omitidos.`,
      migrated: migratedCount,
      skipped: skippedCount,
      total: oldLeads.length,
      errors,
      results: migrationResults,
      dryRun
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error durante la migración:', error);
    return NextResponse.json({
      message: 'Error durante la migración de leads.',
      error: error.message
    }, { status: 500 });
  }
}