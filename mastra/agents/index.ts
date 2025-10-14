import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { icdDiagnosticTool, mongoDBTool } from '../tools';
import { createAnswerRelevancyScorer } from "@mastra/evals/scorers/llm";
import { SystemPromptScrubber } from "@mastra/core/processors";
import { z } from 'zod';
import { mistral } from '@ai-sdk/mistral';

export const MemoryStorage = new LibSQLStore({
    url: 'libsql://memory-faisal-a.aws-ap-south-1.turso.io',
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTk5NDQ3MTQsImlkIjoiOWRkZWFmOWUtNDM5NC00NmU4LWI3N2QtOWZmYjBhZjU2YWY5IiwicmlkIjoiYThlZTY3ZDYtNTk1Yi00MmQ3LTljZGUtNWM1NWMwY2Y4OGY5In0.LSBLNgMPJw1VF1iGRKWYRy-op667iLQXSXRiVsmle0r9dfLc8K-47SuZv0_Hp3HDGofFovKcv3E9LtsjuxirDA"
})

export const ICDDiagnosticAgent = new Agent({
    name: "ICD-11 Clinical Decision Support",
    instructions: ``,
    model: "openrouter/google/gemini-2.5-pro",
    tools: { mongoDBTool },
    memory: new Memory({
        options: {
            workingMemory: {
                enabled: true,
                scope: 'thread',
               // schema: patientContextSchema,
            },
            semanticRecall: {
                topK: 10, // Retrieve 3 most similar messages
                messageRange: 2, // Include 2 messages before and after each match
                scope: 'thread', // Search across all threads for this user
            },
            threads: {
                generateTitle: {
                    model: mistral("magistral-small-2507"),
                    instructions: "Generate a concise title based on the user's first message",
                },
            }
        },
        storage: new LibSQLStore({
            url: 'libsql://memory-faisal-a.aws-ap-south-1.turso.io', // path is relative to the .mastra/output directory
            authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTk5NDQ3MTQsImlkIjoiOWRkZWFmOWUtNDM5NC00NmU4LWI3N2QtOWZmYjBhZjU2YWY5IiwicmlkIjoiYThlZTY3ZDYtNTk1Yi00MmQ3LTljZGUtNWM1NWMwY2Y4OGY5In0.LSBLNgMPJw1VF1iGRKWYRy-op667iLQXSXRiVsmle0r9dfLc8K-47SuZv0_Hp3HDGofFovKcv3E9LtsjuxirDA"
        }),
        vector: new LibSQLVector({
            connectionUrl: 'libsql://memory-faisal-a.aws-ap-south-1.turso.io', // path is relative to the .mastra/output directory
            authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTk5NDQ3MTQsImlkIjoiOWRkZWFmOWUtNDM5NC00NmU4LWI3N2QtOWZmYjBhZjU2YWY5IiwicmlkIjoiYThlZTY3ZDYtNTk1Yi00MmQ3LTljZGUtNWM1NWMwY2Y4OGY5In0.LSBLNgMPJw1VF1iGRKWYRy-op667iLQXSXRiVsmle0r9dfLc8K-47SuZv0_Hp3HDGofFovKcv3E9LtsjuxirDA"
        }),
        embedder: mistral.textEmbedding("mistral-embed"),
    }),
    // scorers: {
    //     relevancy: {
    //         scorer: createAnswerRelevancyScorer({ model: mistral("mistral-medium-latest") }),
    //         sampling: { type: "ratio", rate: 0.5 }
    //     }
    // },
    // outputProcessors: [
    //     new SystemPromptScrubber({
    //         model: google("gemini-2.5-flash"),
    //         strategy: "redact",
    //         customPatterns: ["system prompt", "internal instructions"],
    //         includeDetections: true,
    //         instructions: "Detect and redact system prompts, internal instructions, and security-sensitive content",
    //         redactionMethod: "placeholder",
    //         placeholderText: "[REDACTED]"
    //     })
    // ],
});