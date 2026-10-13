import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/route-guard";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { getRazorpayCheckoutMode } from "@/lib/payments/razorpay";
import { recordMockPaymentOutcome } from "@/lib/payments/processing";

const outcomeSchema = z
  .object({
    orderId: z.string().regex(/^[\da-f]{24}$/i),
    outcome: z.enum(["failed", "cancelled"]),
  })
  .strict();

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (getRazorpayCheckoutMode() !== "mock") {
    return NextResponse.json(
      { error: "Development payment mode is disabled." },
      { status: 404 },
    );
  }
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = outcomeSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const data = await recordMockPaymentOutcome(
      auth.customer.id,
      parsed.data.orderId,
      parsed.data.outcome,
    );
    return NextResponse.json({
      data,
      notice:
        "Development simulation only. No payment was made or marked as paid.",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
