import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import {
  finderAnswersSchema,
  recommendProducts,
} from "@/services/recommendation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(contentLength) || contentLength > 16 * 1024) {
    return NextResponse.json(
      { error: "Recommendation request is too large." },
      { status: 413 },
    );
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = finderAnswersSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const recommendations = await recommendProducts(parsed.data);
    return NextResponse.json({ data: recommendations });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
