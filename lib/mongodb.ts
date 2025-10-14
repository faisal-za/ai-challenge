import { MongoClient, MongoClientOptions } from 'mongodb';

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'ai-challenge';

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not found in environment variables, using default: mongodb://localhost:27017');
}

/**
 * Global MongoDB client instance to reuse connections
 * This prevents connection pool exhaustion in serverless environments
 */
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

interface MongoClientCache {
  client: MongoClient;
  db: any;
}

/**
 * Connect to MongoDB and return database instance
 * Uses connection caching for performance
 */
export async function connectToMongoDB(): Promise<MongoClientCache> {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // MongoDB connection options
  const options: MongoClientOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    // Create new client
    const client = new MongoClient(MONGODB_URI, options);

    // Connect to MongoDB
    await client.connect();

    console.log('[MongoDB] Successfully connected to MongoDB');

    // Select database
    const db = client.db(MONGODB_DB_NAME);

    // Cache connection
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
