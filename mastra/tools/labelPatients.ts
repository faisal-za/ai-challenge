import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { connectToMongoDB } from '@/lib/mongodb';
import { generateDiabetesLabel, type LabelInput } from '@/lib/labelGeneration';

/**
 * Mastra tool to generate diabetes labels for patients in features-2 collection
 *
 * This tool:
 * 1. Reads patient features from features-2 collection (with patient_id and _indexDate)
 * 2. Fetches full patient data with lookups (observations, medications, encounters, conditions)
 * 3. Generates diabetes label using forward-looking 12-month window
 * 4. Updates features-2 documents with label_diabetes_12m and label_reason
 */

export const labelPatientsTool = createTool({
  id: 'generate-diabetes-labels',
  description:
    'Generate diabetes labels (label_diabetes_12m: 0/1/null) for patients in features-2 collection based on forward-looking 12-month window. Uses HbA1c, glucose, medication, and follow-up data.',
  inputSchema: z.object({
    limit: z.number().optional().describe('Maximum number of patients to label (default: all)'),
    skip: z.number().optional().describe('Number of patients to skip (default: 0)'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    patientsProcessed: z.number().optional(),
    labelCounts: z
      .object({
        diabetes: z.number(),
        noDiabetes: z.number(),
        insufficientFollowup: z.number(),
      })
      .optional(),
    labelReasons: z.record(z.string(), z.number()).optional(),
  }),
  execute: async ({ context }) => {
    try {
      const { limit = 0, skip = 0 } = context || {};

      // Connect to MongoDB
      const { db } = await connectToMongoDB();

      // Get features-2 collection (contains patient features with indexDate)
      const featuresCollection = db.collection('features-2');
      const patientsCollection = db.collection('patients');

      // Count total documents
      const totalCount = await featuresCollection.countDocuments({});
      console.log(`\n=== Diabetes Label Generation ===`);
      console.log(`Total patients in features-2 collection: ${totalCount}`);
      console.log(`Processing: skip=${skip}, limit=${limit || 'all'}\n`);

      // Build query
      let query = featuresCollection.find({});
      if (skip > 0) query = query.skip(skip);
      if (limit > 0) query = query.limit(limit);

      const featureDocs = await query.toArray();
      console.log(`Retrieved ${featureDocs.length} patient feature documents\n`);

      // Statistics
      let processedCount = 0;
      let successCount = 0;
      let errorCount = 0;
      const labelCounts = {
        diabetes: 0,
        noDiabetes: 0,
        insufficientFollowup: 0,
      };
      const labelReasons: Record<string, number> = {};

      // Process each patient
      for (const featureDoc of featureDocs) {
        try {
          processedCount++;
          const patientId = featureDoc.patient_id;
          const indexDate = featureDoc._indexDate;

          if (!patientId) {
            console.error(`[${processedCount}/${featureDocs.length}] Missing patient_id, skipping`);
            errorCount++;
            continue;
          }

          if (!indexDate) {
            console.error(
              `[${processedCount}/${featureDocs.length}] Patient ${patientId}: Missing _indexDate, skipping`
            );
            errorCount++;
            continue;
          }

          console.log(`[${processedCount}/${featureDocs.length}] Processing patient ${patientId}...`);

          // Fetch full patient data with lookups
          const pipeline = [
            { $match: { id: patientId } },
            {
              $lookup: {
                from: 'observations',
                localField: 'id',
                foreignField: 'patient',
                as: 'observations',
              },
            },
            {
              $lookup: {
                from: 'medications',
                localField: 'id',
                foreignField: 'patient',
                as: 'medications',
              },
            },
            {
              $lookup: {
                from: 'encounters',
                localField: 'id',
                foreignField: 'patient',
                as: 'encounters',
              },
            },
            {
              $lookup: {
                from: 'conditions',
                localField: 'id',
                foreignField: 'patient',
                as: 'conditions',
              },
            },
          ];

          const patientData = await patientsCollection.aggregate(pipeline).toArray();

          if (patientData.length === 0) {
            console.error(`  Patient ${patientId}: Not found in patients collection`);
            errorCount++;
            continue;
          }

          const patient = patientData[0];

          // Convert to LabelInput format
          const labelInput: LabelInput = {
            id: patient.id,
            indexDate: new Date(indexDate),
            observations: patient.observations || [],
            medications: patient.medications || [],
            encounters: patient.encounters || [],
            conditions: patient.conditions || [],
          };

          // Generate label
          const labelResult = generateDiabetesLabel(labelInput);

          console.log(
            `  Label: ${labelResult.label_diabetes_12m === null ? 'null' : labelResult.label_diabetes_12m}, Reason: ${labelResult.label_reason}`
          );

          // Update statistics
          if (labelResult.label_diabetes_12m === 1) {
            labelCounts.diabetes++;
          } else if (labelResult.label_diabetes_12m === 0) {
            labelCounts.noDiabetes++;
          } else {
            labelCounts.insufficientFollowup++;
          }

          labelReasons[labelResult.label_reason] = (labelReasons[labelResult.label_reason] || 0) + 1;

          // Update features-2 document with label
          await featuresCollection.updateOne(
            { _id: featureDoc._id },
            {
              $set: {
                label_diabetes_12m: labelResult.label_diabetes_12m,
                label_reason: labelResult.label_reason,
                _labeledAt: new Date(),
              },
            }
          );

          successCount++;
        } catch (error) {
          console.error(`  Error processing patient: ${error instanceof Error ? error.message : error}`);
          errorCount++;
        }
      }

      // Print summary
      console.log(`\n=== Label Generation Summary ===`);
      console.log(`Total processed: ${processedCount}`);
      console.log(`Successfully labeled: ${successCount}`);
      console.log(`Errors: ${errorCount}`);
      console.log(`\nLabel Counts:`);
      console.log(`  Diabetes (1): ${labelCounts.diabetes}`);
      console.log(`  No Diabetes (0): ${labelCounts.noDiabetes}`);
      console.log(`  Insufficient Follow-up (null): ${labelCounts.insufficientFollowup}`);
      console.log(`\nLabel Reasons:`);
      Object.entries(labelReasons)
        .sort((a, b) => b[1] - a[1])
        .forEach(([reason, count]) => {
          console.log(`  ${reason}: ${count}`);
        });

      return {
        success: true,
        patientsProcessed: successCount,
        labelCounts,
        labelReasons,
      };
    } catch (error) {
      console.error('[Label Generation Tool] Error:', error);
      return {
        success: false,
        patientsProcessed: 0,
      };
    }
  },
});
