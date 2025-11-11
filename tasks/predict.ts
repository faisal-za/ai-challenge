/**
 * Diabetes risk prediction task using pure Python inference.
 * Runs serverless with cold-start artifact loading.
 */

import { task } from "@trigger.dev/sdk";
import { z } from "zod";
import { python } from "@trigger.dev/python";

// Input schema - feature dictionary (AutoGluon approach)
const inputSchema = z.object({
  features: z.record(z.string(), z.number()), // Feature name → value mapping
  patient_id: z.string().optional(), // Optional for logging/tracking
});

// Output schema - model outputs + confidence metrics
const outputSchema = z.object({
  predicted_class: z.number().int(), // 0 or 1
  probability_negative: z.number().min(0).max(1), // P(diabetes=0)
  probability_positive: z.number().min(0).max(1), // P(diabetes=1)
  data_completeness_score: z.number().min(0).max(1), // 0-1, percentage of non-null features
  confidence_tier: z.enum(['high', 'medium', 'low']), // Confidence tier based on data completeness
  critical_features_present: z.boolean(), // Whether glucose, HbA1c, BMI are present
});

type PredictInput = z.infer<typeof inputSchema>;
type PredictOutput = z.infer<typeof outputSchema>;

export const predictDiabetesRisk = task({
  id: "predict-diabetes-risk",
  retry: { maxAttempts: 1 },
  machine: "large-1x",
  run: async (payload: PredictInput, { ctx }) => {
    const patientId = payload.patient_id || 'anonymous';
    const featureCount = Object.keys(payload.features).length;
    console.log(`[${ctx.task.id}] Starting prediction (patient: ${patientId}, features: ${featureCount})`);

    // Call Python inference function
    const pythonResult = await python.runScript(
      "./tasks/python/inference.py",
      ["--json", JSON.stringify(payload)],
      {
        env: {
          // Cloudflare R2 (AutoGluon S3 format)
          S3_MODEL_PATH: "s3://ai-challenge-2/diabetes-model-ag",
          S3_ENDPOINT_URL: "https://298fec38f9ca66057a5f78700a49be4e.r2.cloudflarestorage.com",
          S3_ACCESS_KEY: "bb6be1b6aec7f7c1b79333a5b1b3c14d",
          S3_SECRET_KEY: "2782080d43de178116d7cc1a41e97406aa60727fc689f7c1a20579099ef08f60",
        }
      }
    );

    // Check for non-zero exit code
    if (pythonResult.exitCode !== 0) {
      console.error(`[${ctx.task.id}] Python script failed with exit code ${pythonResult.exitCode}`);
      console.error(`[${ctx.task.id}] stderr: ${pythonResult.stderr}`);
      throw new Error(`Inference script failed with exit code ${pythonResult.exitCode}`);
    }

    // Parse JSON from stdout (filtering out debug/log lines)
    const jsonLines = pythonResult.stdout.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('{') && trimmed.endsWith('}');
    });

    if (jsonLines.length === 0) {
      console.error(`[${ctx.task.id}] No JSON output found in stdout`);
      console.error(`[${ctx.task.id}] Full stdout: ${pythonResult.stdout}`);
      throw new Error('No JSON output from inference script');
    }

    // Parse the last JSON line (the actual result)
    const result = JSON.parse(jsonLines[jsonLines.length - 1]) as PredictOutput | { error: string };

    // Check for Python errors
    if ('error' in result) {
      console.error(`[${ctx.task.id}] Python inference error: ${result.error}`);
      throw new Error(`Inference failed: ${result.error}`);
    }

    console.log(`[${ctx.task.id}] Prediction complete: class=${result.predicted_class}, prob=${(result.probability_positive * 100).toFixed(1)}%`);

    return result;
  },
})