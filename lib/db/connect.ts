import mongoose, { type Mongoose } from "mongoose";

type MongooseCache = {
  connection: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache =
  globalThis.mongooseCache ??
  (globalThis.mongooseCache = { connection: null, promise: null });

export async function connectToDatabase(): Promise<Mongoose> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (cache.connection?.connection.readyState === 1) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error: unknown) => {
        cache.promise = null;
        cache.connection = null;
        throw new Error("Failed to connect to MongoDB.", { cause: error });
      });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
