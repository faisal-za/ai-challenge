import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { connectToMongoDB } from '@/lib/mongodb';
import { buildFeatures, type PatientInput, FEATURE_ORDER } from '@/lib/featureEngineering';
import { generateDiabetesLabel, type LabelInput } from '@/lib/labelGeneration';

/**
 * Convert MongoDB patient document to PatientInput format for feature engineering
 */
function mapMongoPatientToInput(patient: any, indexDate: Date = new Date()): PatientInput {
  return {
    id: patient.id,
    gender: patient.gender,
    age: patient.age || patient.BIRTHDATE, // Birthdate field
    indexDate,
    observations: patient.observations || [],
    medications: patient.medications || [],
    conditions: patient.conditions || [],
    encounters: patient.encounters || [],
  };
}

export const mongoDBTool = createTool({
  id: 'extract-patient-features',
  description: 'Extract 23 ML-ready features AND generate diabetes labels from patient EHR data. Uses leakage-safe windowing (365-day lookback, 30-day gap for features; 12-month forward window for labels). Processes patients from MongoDB and stores features + labels in features-2 collection.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    patientsProcessed: z.number().optional(),
    featureCount: z.number().optional(),
    labelCounts: z
      .object({
        diabetes: z.number(),
        noDiabetes: z.number(),
        insufficientFollowup: z.number(),
      })
      .optional(),
  }),
  execute: async () => {
    try {
      // Connect to MongoDB
      const { db } = await connectToMongoDB();

      // Get patients collection
      const patientsCollection = db.collection('patients');

      // Build aggregation pipeline with lookups
      const pipeline = [
        {
          $lookup: {
            from: 'medications',
            localField: 'id',
            foreignField: 'patient',
            as: 'medications'
          }
        },
        {
          $lookup: {
            from: 'conditions',
            localField: 'id',
            foreignField: 'patient',
            as: 'conditions'
          }
        },
        {
          $lookup: {
            from: 'observations',
            localField: 'id',
            foreignField: 'patient',
            as: 'observations'
          }
        },
        {
          $lookup: {
            from: 'encounters',
            localField: 'id',
            foreignField: 'patient',
            as: 'encounters'
          }
        },
        { $skip: 0 },
        { $limit: 10000 },  // Process all available patients
      ];

      // Execute aggregation
      const patients = await patientsCollection.aggregate(pipeline).toArray();

      // Get features collection
      const featuresCollection = db.collection('features-2');

      // Log feature engineering configuration
      const featureConfig = {
        lookbackDays: 365,
        gapDays: 30,
        trendDays: 90,
        glucoseFastingThresholdDiabetes: 126,
        hba1cHighThresholdDiabetes: 6.5,
      };

      console.log(`\n=== Feature Engineering Configuration ===`);
      console.log(`  lookbackDays: ${featureConfig.lookbackDays}`);
      console.log(`  gapDays: ${featureConfig.gapDays}`);
      console.log(`  trendDays: ${featureConfig.trendDays}`);
      console.log(`  glucoseFastingThresholdDiabetes: ${featureConfig.glucoseFastingThresholdDiabetes} mg/dL`);
      console.log(`  hba1cHighThresholdDiabetes: ${featureConfig.hba1cHighThresholdDiabetes}%`);
      console.log(`  Validation ranges:`);
      console.log(`    BMI: 10-80`);
      console.log(`    Glucose: 50-600 mg/dL`);
      console.log(`    HbA1c: 4-15%`);
      console.log(`    BP systolic: 60-250 mmHg`);
      console.log(`    BP diastolic: 40-150 mmHg`);
      console.log(`    LDL: 20-300 mg/dL`);
      console.log(`\nProcessing ${patients.length} patients...`);

      // Statistics for labels
      const labelCounts = {
        diabetes: 0,
        noDiabetes: 0,
        insufficientFollowup: 0,
      };

      const features = patients.map((patient, index) => {
        try {
          console.log(`\n[Patient ${index + 1}/${patients.length}] ID: ${patient.id}`);

          // Calculate per-patient indexDate: min(last_observation, last_encounter) - 365d
          const lastObsDates: Date[] = [];
          const lastEncDates: Date[] = [];

          // Get latest observation date
          if (patient.observations && patient.observations.length > 0) {
            patient.observations.forEach((obs: any) => {
              const obsDate = obs.date || obs.timestamp;
              if (obsDate) lastObsDates.push(new Date(obsDate));
            });
          }

          // Get latest encounter date
          if (patient.encounters && patient.encounters.length > 0) {
            patient.encounters.forEach((enc: any) => {
              const encDate = enc.start;
              if (encDate) lastEncDates.push(new Date(encDate));
            });
          }

          // Calculate max available times
          const lastObsTime = lastObsDates.length > 0
            ? Math.max(...lastObsDates.map(d => d.getTime()))
            : 0;
          const lastEncTime = lastEncDates.length > 0
            ? Math.max(...lastEncDates.map(d => d.getTime()))
            : 0;

          // Take min of the two (earliest end of data)
          const maxAvailableTime = lastObsTime > 0 && lastEncTime > 0
            ? Math.min(lastObsTime, lastEncTime)
            : (lastObsTime > 0 ? lastObsTime : lastEncTime);

          // Check if we have sufficient data
          if (maxAvailableTime === 0) {
            console.log(`  Patient ${index + 1}: No observation or encounter data, skipping`);
            return null;
          }

          // indexDate = maxAvailableTime - 365 days
          const indexDate = new Date(maxAvailableTime);
          indexDate.setDate(indexDate.getDate() - 365);

          // Observability check: require at least 12 months of follow-up after indexDate
          const requiredFollowupEnd = new Date(indexDate);
          requiredFollowupEnd.setFullYear(requiredFollowupEnd.getFullYear() + 1);

          if (maxAvailableTime < requiredFollowupEnd.getTime()) {
            console.log(
              `  Patient ${index + 1}: Insufficient follow-up (max: ${new Date(maxAvailableTime).toISOString().split('T')[0]}, need: ${requiredFollowupEnd.toISOString().split('T')[0]}), will get label=null`
            );
            // Continue processing but label will be null due to insufficient follow-up
          }

          console.log(`  Index Date: ${indexDate.toISOString().split('T')[0]}`);
          console.log(`  Observations: ${patient.observations?.length || 0}`);
          console.log(`  Medications: ${patient.medications?.length || 0}`);
          console.log(`  Encounters: ${patient.encounters?.length || 0}`);

          // Convert MongoDB patient to PatientInput format
          const patientInput = mapMongoPatientToInput(patient, indexDate);

          // Extract ML-ready features using new feature engineering module
          const mlFeatures = buildFeatures(patientInput, featureConfig);

          // Debug: Log key features to verify per-patient variation
          console.log(`  Features extracted:`);
          console.log(`    BMI mean: ${mlFeatures.bmi_mean_365d}`);
          console.log(`    BMI min: ${mlFeatures.bmi_min_365d}`);
          console.log(`    BMI max: ${mlFeatures.bmi_max_365d}`);
          console.log(`    BMI trend: ${mlFeatures.bmi_trend_90d}`);
          console.log(`    BP sys mean: ${mlFeatures.bp_sys_mean_365d}`);
          console.log(`    Glucose fasting mean: ${mlFeatures.glucose_fasting_mean_365d}`);
          console.log(`    HbA1c mean: ${mlFeatures.hba1c_prev_mean_365d}`);
          console.log(`    Chronic conditions: ${mlFeatures.chronic_conditions_count}`);
          console.log(`    Encounters last 365d: ${mlFeatures.encounters_last_365d}`);

          // Generate diabetes label using same patient data
          const labelInput: LabelInput = {
            id: patient.id,
            indexDate,
            observations: patient.observations || [],
            medications: patient.medications || [],
            encounters: patient.encounters || [],
            conditions: patient.conditions || [],
          };

          const labelResult = generateDiabetesLabel(labelInput);
          console.log(
            `Patient ${index + 1} label: ${labelResult.label_diabetes_12m === null ? 'null' : labelResult.label_diabetes_12m} (${labelResult.label_reason})`
          );

          // Update statistics
          if (labelResult.label_diabetes_12m === 1) {
            labelCounts.diabetes++;
          } else if (labelResult.label_diabetes_12m === 0) {
            labelCounts.noDiabetes++;
          } else {
            labelCounts.insufficientFollowup++;
          }

          // Return features + labels with patient ID
          return {
            patient_id: patient.id,
            ...mlFeatures,
            label_diabetes_12m: labelResult.label_diabetes_12m,
            label_reason: labelResult.label_reason,
            _indexDate: indexDate,
            _featureEngineering: 'v2',
            _labeledAt: new Date(),
          };
        } catch (error) {
          console.error(`Error processing patient ${index + 1} (${patient.id}):`, error);
          return null;
        }
      }).filter(f => f !== null && f !== undefined);

      console.log(`Successfully calculated ${features.length} features`);

      // Log feature + label summary
      if (features.length > 0) {
        console.log('\n=== Feature Extraction & Label Generation Summary ===');
        console.log(`Total patients processed: ${features.length}`);
        console.log(`Feature count: ${FEATURE_ORDER.length}`);
        console.log(`Feature names: ${FEATURE_ORDER.join(', ')}`);

        const totalProcessed = labelCounts.diabetes + labelCounts.noDiabetes + labelCounts.insufficientFollowup;
        const pctDiabetes = ((labelCounts.diabetes / totalProcessed) * 100).toFixed(1);
        const pctNoDiabetes = ((labelCounts.noDiabetes / totalProcessed) * 100).toFixed(1);
        const pctNull = ((labelCounts.insufficientFollowup / totalProcessed) * 100).toFixed(1);

        console.log('\nLabel Distribution:');
        console.log(`  Diabetes (1): ${labelCounts.diabetes} (${pctDiabetes}%)`);
        console.log(`  No Diabetes (0): ${labelCounts.noDiabetes} (${pctNoDiabetes}%)`);
        console.log(`  Insufficient Follow-up (null): ${labelCounts.insufficientFollowup} (${pctNull}%)`);

        // Fail-fast assertions
        console.log('\n=== Fail-Fast Assertions ===');

        if (labelCounts.diabetes === 0 || labelCounts.noDiabetes === 0) {
          console.error('❌ CRITICAL: Missing class in training data!');
          console.error('\nREMEDIATION:');

          if (labelCounts.noDiabetes === 0) {
            console.error('  Problem: No negative samples (label=0) found.');
            console.error('  Root cause: Patients lack follow-up data beyond indexDate+12m.');
            console.error('  Solutions:');
            console.error('    1. Process earlier patients (change $skip in mongodb.ts line 81)');
            console.error('    2. Use synthetic data with longer temporal coverage (2+ years)');
            console.error('    3. Relax label=0 criteria in lib/labelGeneration.ts');
          }

          if (labelCounts.diabetes === 0) {
            console.error('  Problem: No positive samples (label=1) found.');
            console.error('  Root cause: No patients meet diabetes diagnostic criteria.');
            console.error('  Solutions:');
            console.error('    1. Process different patient cohort');
            console.error('    2. Verify LOINC codes and medication keywords');
            console.error('    3. Check threshold values (HbA1c ≥6.5%, glucose ≥126 mg/dL)');
          }

          throw new Error('ABORT: Cannot proceed with training - missing class in dataset');
        }

        console.log('✓ Both classes present in dataset');
        console.log(`✓ Class imbalance ratio: ${(labelCounts.diabetes / labelCounts.noDiabetes).toFixed(2)} (pos/neg)`);

        if (labelCounts.diabetes / labelCounts.noDiabetes > 10 || labelCounts.noDiabetes / labelCounts.diabetes > 10) {
          console.warn('⚠️ WARNING: Severe class imbalance detected (>10:1)');
          console.warn('   Consider rebalancing or adjusting data selection');
        }

        console.log('\nSample document (first patient):');
        console.log(JSON.stringify(features[0], null, 2));
      }

      // Insert features + labels into features-2 collection
      if (features.length > 0) {
        console.log(`\nInserting ${features.length} documents (features + labels) into 'features-2' collection...`);
        await featuresCollection.insertMany(features);
        console.log(`✓ Successfully inserted ${features.length} documents with features and labels`);
      } else {
        console.log('No features to insert');
      }

      return {
        success: true,
        patientsProcessed: features.length,
        featureCount: FEATURE_ORDER.length,
        labelCounts,
      }

    } catch (error) {
      console.error('[MongoDB Tool] Error:', error);
      return {
        success: false,
        totalPatients: 0,
      };
    }
  },
});
