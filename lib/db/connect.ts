import { getServers, setServers } from "node:dns";
import mongoose, { type Mongoose } from "mongoose";

const publicDnsServers = ["8.8.8.8", "1.1.1.1"];
const loopbackDnsServers = new Set(["127.0.0.1", "::1"]);

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

function configureSrvDns(uri: string): void {
  if (!uri.toLowerCase().startsWith("mongodb+srv://")) {
    return;
  }

  const dnsServers = getServers();
  if (
    dnsServers.length > 0 &&
    dnsServers.every((server) => loopbackDnsServers.has(server))
  ) {
    setServers(publicDnsServers);
    console.warn(
      "Node.js is configured with only loopback DNS servers; using public DNS to resolve the MongoDB Atlas hostname.",
    );
  }
}

export async function connectToDatabase(): Promise<Mongoose> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  configureSrvDns(uri);

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
