import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createVectorQueryTool } from "@mastra/rag";
import { MDocument } from "@mastra/rag"
import { embedMany } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { connectToMongoDB } from '@/lib/mongodb';
import { PineconeVector } from '@mastra/pinecone';
import { runs, tasks } from "@trigger.dev/sdk";

const pinecone = new PineconeVector({
    apiKey: "pcsk_4JqLbN_JDABaJNYynBNhCBsLE7hPN1ARVM5UFUSMD2uiYGZean7NWWwiLnzbaWnxgyZgyX"
})

export const pineconeQueryTool = createVectorQueryTool({
    vectorStoreName: "pinecone",
    indexName: "ai-challenge",
    model: mistral.textEmbedding("mistral-embed")
});

export const EmbeddingsTool = createTool({
    id: 'embedding-tool',
    description: 'Generate embeddings for patient features and store them in Pinecone vector database',
    inputSchema: z.object({}),
    outputSchema: z.object({
        success: z.boolean(),
        processedCount: z.number(),
    }),
    execute: async () => {
        try {
            // Connect to MongoDB
            const { db } = await connectToMongoDB();

            const featuresCollection = db.collection('features');

            // Get all features with pagination
            const features = await featuresCollection.find({})
                .skip(120)
                .limit(380)
                .toArray();

            console.log(`Processing ${features.length} features...`);

            let processedCount = 0;
            const batchSize = 1;

            // Process in batches for better performance
            for (let i = 0; i < features.length; i += batchSize) {
                const batch = features.slice(i, i + batchSize);
                console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(features.length / batchSize)}`);

                // Process batch
                const vectors = [];

                for (const feature of batch) {
                    try {
                        // Convert feature to document
                        const doc = MDocument.fromJSON(JSON.stringify(feature));

                        // Chunk the document
                        const chunks = await doc.chunk({
                            strategy: "json",
                            maxSize: 100,
                        });

                        // Generate embeddings for chunks
                        const { embeddings } = await embedMany({
                            model: mistral.textEmbedding("mistral-embed"),
                            values: chunks.map((chunk) => chunk.text),
                        });

                        console.log(`Generated ${embeddings.length} embeddings for patient ${feature.patient_id}`);
                        console.log(`Chunks ${chunks.map(chunk => ({ text: chunk.text }))}`);

                        if (embeddings.length > 0) {

                            await pinecone.upsert({
                                indexName: "ai-challenge",
                                vectors: embeddings,
                                metadata: chunks?.map(chunk => ({ text: chunk.text }))
                            })

                            console.log(`Upserted ${vectors.length} vectors for batch ${Math.floor(i / batchSize) + 1}`);
                        }

                        processedCount++;
                    } catch (err) {
                        console.error(`Error processing feature ${feature.patient_id}:`, err);
                    }
                }

                // Upsert batch to Pinecone
            }

            console.log(`Successfully processed ${processedCount} features`);

            return {
                success: true,
                processedCount,
            }

        } catch (error) {
            console.error('[Embedding Tool] Error:', error);
            return {
                success: false,
                processedCount: 0,
            };
        }
    },
});

// Diabetes Risk Prediction Tool
export const predictDiabetesRiskTool = createTool({
    id: 'predict-diabetes-risk',
    description: 'Predict diabetes risk for a patient using AutoGluon ML model. Requires 23 engineered features from the feature engineering pipeline. Returns predicted class (0/1) and probabilities.',
    // A pragmatically sorted schema for UI data entry
    // Assumes a patient has the required 1-year history.

    inputSchema: z.object({

        // --- Group 1: Core Patient Info (Must provide) ---
        age_years_at_index: z.number().describe('Patient age in years at index date'),
        sex_male: z.number().describe('Gender: 1 if male, 0 if female'),

        // --- Group 2: Key Vitals & Trends (Must provide) ---
        // These are often the most powerful predictors.
        bmi_mean_365d: z.number().describe('Mean BMI over last 365 days'),
        bp_sys_mean_365d: z.number().describe('Mean systolic blood pressure over last 365 days'),
        bp_dia_mean_365d: z.number().describe('Mean diastolic blood pressure over last 365 days'),
        glucose_fasting_mean_365d: z.number().describe('Mean fasting glucose level over last 365 days'),
        hba1c_prev_mean_365d: z.number().describe('Mean HbA1c (pre-diabetic range) over last 365 days'),
        lipids_ldl_mean_365d: z.number().describe('Mean LDL cholesterol level over last 365 days'),
        bmi_trend_90d: z.number().describe('BMI trend (slope) over last 90 days'),

        // --- Group 3: Other Required History (Must provide) ---
        bmi_min_365d: z.number().describe('Minimum BMI over last 365 days'),
        bmi_max_365d: z.number().describe('Maximum BMI over last 365 days'),
        days_since_last_encounter: z.number().describe('Days elapsed since most recent clinical encounter'),

        // --- Group 4: Contextual Flags (Optional, default to 0) ---
        // Assumes 0 = No/None/Unknown
        smoking_flag: z.number().optional().default(0).describe('Smoking status: 1 if smoker, 0 if non-smoker'),
        active_diabetes_meds_flag_365d: z.number().optional().default(0).describe('Diabetes medication usage: 1 if on diabetes meds, 0 otherwise'),
        insurance_coverage_flag: z.number().optional().default(0).describe('Insurance coverage: 1 if covered, 0 if uninsured'),

        // --- Group 5: Historical Counts (Optional, default to 0) ---
        // Assumes 0 = No/None/Unknown
        chronic_conditions_count: z.number().optional().default(0).describe('Total count of chronic conditions'),
        chronic_meds_count_365d: z.number().optional().default(0).describe('Count of chronic medications in last 365 days'),
        encounters_last_365d: z.number().optional().default(0).describe('Number of clinical encounters in last 365 days'),
        glucose_fasting_high_count_365d: z.number().optional().default(0).describe('Count of high fasting glucose readings over last 365 days'),
        hba1c_prev_high_count_365d: z.number().optional().default(0).describe('Count of high HbA1c readings over last 365 days'),

        // --- Group 6: Adherence (Optional, default to 0) ---
        // Assumes 0 = No/None/Unknown
        med_adherence_level_onehot_low: z.number().optional().default(0).describe('Medication adherence one-hot: 1 if low adherence, 0 otherwise'),
        med_adherence_level_onehot_medium: z.number().optional().default(0).describe('Medication adherence one-hot: 1 if medium adherence, 0 otherwise'),
        med_adherence_level_onehot_high: z.number().optional().default(0).describe('Medication adherence one-hot: 1 if high adherence, 0 otherwise'),

        // --- Group 7: Identifier ---
        patient_id: z.string().optional().describe('Optional patient identifier for logging/tracking'),
    }),
    outputSchema: z.object({
        predicted_class: z.number().int().describe('Predicted class: 0 (no diabetes) or 1 (diabetes)'),
        probability_negative: z.number().min(0).max(1).describe('Probability of NOT developing diabetes (P(class=0))'),
        probability_positive: z.number().min(0).max(1).describe('Probability of developing diabetes (P(class=1))'),
        data_completeness_score: z.number().min(0).max(1).describe('Data completeness score (0-1): percentage of non-null features'),
        confidence_tier: z.enum(['high', 'medium', 'low']).describe('Confidence tier: high (≥80% complete), medium (50-79%), low (<50%)'),
        critical_features_present: z.boolean().describe('Whether critical features (glucose, HbA1c, BMI) are present'),
    }),
    execute: async ({ context }) => {
        try {
            const { patient_id, ...features } = context;

            // Import the Trigger.dev task
            const predictDiabetesRisk = await tasks.trigger("predict-diabetes-risk", {
                features,
                patient_id,
            })
            const result = {}

            // Check if task succeeded
            for await (const run of runs.subscribeToRun(predictDiabetesRisk.id)) {
                console.log(`Run ${run.id} status: ${run.status}`);
                console.log(`result: `, run.output);
                if (run.status == "COMPLETED") {

                    Object.assign(result, run.output)
                    break;
                }
            }

            // Return the prediction output with confidence metrics
            return {
                predicted_class: result.predicted_class,
                probability_negative: result.probability_negative,
                probability_positive: result.probability_positive,
                data_completeness_score: result.data_completeness_score,
                confidence_tier: result.confidence_tier,
                critical_features_present: result.critical_features_present,
            };

        } catch (error) {
            console.error('[Predict Diabetes Risk Tool] Error:', error);
            throw error;
        }
    },
});

// Export RFQ tools
// catalogLookupTool - DISABLED (kept in codebase but not exported)
// unitsValidateTool - DEPRECATED
// unitsReference - REMOVED (LLM has natural knowledge)
// materialReference - REMOVED (LLM has natural knowledge)
export { webSearchItemTool } from './webSearchItem';

// Export MongoDB tools
export { mongoDBTool } from './mongodb';
export { labelPatientsTool } from './labelPatients';
