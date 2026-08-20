import mongoose from "mongoose";

const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!uri) {
  throw new Error("DATABASE_URL (MongoDB connection string) is required");
}

/**
 * Next.js dev hot-reloads modules on every edit, so the connection is cached on
 * globalThis to avoid opening a new pool per reload (mirrors the old pg Pool cache).
 */
const globalForDb = globalThis;
const cache =
  globalForDb.__mpscMongoose || (globalForDb.__mpscMongoose = { conn: null, promise: null });

export async function connectDb() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((m) => m.connection);
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

export { mongoose };
