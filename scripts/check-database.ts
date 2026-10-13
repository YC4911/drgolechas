import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";

async function checkDatabase(): Promise<void> {
  try {
    const connection = await connectToDatabase();
    const result = await connection.connection.db?.admin().ping();
    if (result?.ok !== 1) {
      throw new Error("MongoDB did not confirm the ping.");
    }
    console.info(
      `Connected to MongoDB database "${connection.connection.name}" at ${connection.connection.host}:${connection.connection.port}.`,
    );
  } catch (error) {
    console.error("MongoDB connection check failed.", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void checkDatabase();
