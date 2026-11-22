// Development launcher: boots an in-memory MongoDB when no external database is configured.
// Usage: npm run dev:memory
import 'dotenv/config';
import { MongoMemoryServer } from 'mongodb-memory-server';

const externalDb = process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1');

if (externalDb) {
  console.log('MONGO_URI points to an external database — starting normally.');
  await import('./server.js');
} else {
  console.log('Starting in-memory MongoDB for development…');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('mini_test');
  console.log(`In-memory MongoDB ready at ${process.env.MONGO_URI}`);
  await import('./server.js');
  // Seed sample questions + admin once the connection is up
  const { runSeed } = await import('./seed/seed.js');
  await runSeed();
}
