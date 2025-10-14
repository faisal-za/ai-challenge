
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { RiskAssessmentAgent } from './agents';
import { PineconeVector } from '@mastra/pinecone';

const pinecone = new PineconeVector({
    apiKey: "pcsk_4JqLbN_JDABaJNYynBNhCBsLE7hPN1ARVM5UFUSMD2uiYGZean7NWWwiLnzbaWnxgyZgyX"
})

const MemoryStorage = new LibSQLStore({
    url: 'libsql://memory-faisal-a.aws-ap-south-1.turso.io', // path is relative to the .mastra/output directory
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTk5NDQ3MTQsImlkIjoiOWRkZWFmOWUtNDM5NC00NmU4LWI3N2QtOWZmYjBhZjU2YWY5IiwicmlkIjoiYThlZTY3ZDYtNTk1Yi00MmQ3LTljZGUtNWM1NWMwY2Y4OGY5In0.LSBLNgMPJw1VF1iGRKWYRy-op667iLQXSXRiVsmle0r9dfLc8K-47SuZv0_Hp3HDGofFovKcv3E9LtsjuxirDA"
})

export const mastra = new Mastra({
    agents: { RiskAssessmentAgent },
    vectors: { pinecone },
    storage: MemoryStorage,
    logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
    }),
    telemetry: { enabled: true }
})