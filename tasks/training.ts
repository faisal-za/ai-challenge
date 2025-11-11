import { logger, task } from "@trigger.dev/sdk/v3";
import { python } from "@trigger.dev/python";

/**
 * Diabetes Risk Model Training Pipeline
 *
 * Trains, calibrates, evaluates, and publishes diabetes risk model.
 * Outputs: Model, calibrator, metrics, FAISS similarity index.
 * All artifacts uploaded to Cloudflare R2.
 */
export const trainDiabetesModel = task({
  id: "train-diabetes-model",
  maxDuration: 3600, // 1 hour for full training pipeline
  retry: { maxAttempts: 1 },
  machine: "large-2x",
  run: async (payload: any, { ctx }) => {
    logger.log("Starting AutoGluon model training pipeline...", { payload, ctx });

    const result = await python.runScript("./tasks/python/model.py", [], {
      env: {
        // MongoDB
        MONGO_URI: "mongodb+srv://local:FwZcWqST0Rjuodfn@cluster0.ietww.mongodb.net/ai-challenge?retryWrites=true&w=majority&appName=Cluster0",
        DB_NAME: "ai-challenge",
        COLLECTION_NAME: "features-2",

        // Cloudflare R2 (AutoGluon S3 format)
        S3_MODEL_PATH: "s3://ai-challenge-2/diabetes-model-ag",
        S3_ENDPOINT_URL: "https://298fec38f9ca66057a5f78700a49be4e.r2.cloudflarestorage.com",
        S3_ACCESS_KEY: "bb6be1b6aec7f7c1b79333a5b1b3c14d",
        S3_SECRET_KEY: "2782080d43de178116d7cc1a41e97406aa60727fc689f7c1a20579099ef08f60",
      },
    });

    logger.log("Training pipeline completed", { result });

    return result;
  },
});