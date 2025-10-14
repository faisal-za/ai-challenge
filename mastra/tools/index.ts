import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createVectorQueryTool } from "@mastra/rag";
import { google } from "@ai-sdk/google"
import { MDocument } from "@mastra/rag"
import { embedMany } from "ai"
import { mistral } from "@ai-sdk/mistral"
import { connectToMongoDB } from '@/lib/mongodb';
import { PineconeVector } from '@mastra/pinecone';

const pinecone = new PineconeVector({
    apiKey: "pcsk_4JqLbN_JDABaJNYynBNhCBsLE7hPN1ARVM5UFUSMD2uiYGZean7NWWwiLnzbaWnxgyZgyX"
})

export const pineconeQueryTool = createVectorQueryTool({
    vectorStoreName: "pinecone",
    indexName: "ai-challenge",
    model: google.textEmbeddingModel("text-embedding-004")
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
                .skip(10)
                .limit(10)
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
                        const doc = await MDocument.fromJSON(JSON.stringify(feature));

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

// Export MongoDB tool
export { mongoDBTool } from './mongodb';
