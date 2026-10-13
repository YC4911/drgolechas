import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch {
    return NextResponse.json(
      { status: "unavailable", database: "disconnected" },
      { status: 503 },
    );
  }
}
