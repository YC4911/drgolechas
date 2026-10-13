import mongoose from "mongoose";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return NextResponse.json(
      {
        error: "The submitted data is invalid.",
        details: Object.values(error.errors).map(({ message }) => message),
      },
      { status: 422 },
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return NextResponse.json(
      { error: "A record with one of these unique values already exists." },
      { status: 409 },
    );
  }

  if (
    error instanceof Error &&
    (error.message.includes("MONGODB_URI") ||
      error.message.includes("Failed to connect to MongoDB"))
  ) {
    return NextResponse.json(
      { error: "The database is unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export function invalidInputResponse(
  issues: { path: PropertyKey[]; message: string }[],
): NextResponse {
  return NextResponse.json(
    {
      error: "Invalid request.",
      details: issues.map(({ path, message }) => ({
        path: path.map(String).join("."),
        message,
      })),
    },
    { status: 400 },
  );
}

export async function readJsonBody(
  request: Request,
): Promise<
  { ok: true; body: unknown } | { ok: false; response: NextResponse }
> {
  try {
    return { ok: true, body: (await request.json()) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body must contain valid JSON." },
        { status: 400 },
      ),
    };
  }
}
