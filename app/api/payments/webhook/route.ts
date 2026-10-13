import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { PaymentWebhookEventModel } from "@/models/payment-webhook-event";
import {
  parseWebhookPayment,
  synchronizeRazorpayPayment,
} from "@/lib/payments/processing";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookBodySchema = z
  .object({
    event: z.string().min(1).max(100),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const eventId = request.headers.get("x-razorpay-event-id") ?? "";
  if (!/^[\da-f]{64}$/i.test(signature) || !/^[\w-]{1,160}$/.test(eventId)) {
    return NextResponse.json(
      { error: "Invalid webhook headers." },
      { status: 400 },
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) {
    return NextResponse.json(
      { error: "Webhook payload is too large." },
      { status: 413 },
    );
  }

  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) {
    return NextResponse.json(
      { error: "Webhook payload is too large." },
      { status: 413 },
    );
  }
  try {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Payment webhook verification is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook JSON." },
      { status: 400 },
    );
  }
  const parsed = webhookBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid webhook payload." },
      { status: 400 },
    );
  }
  const paymentEvents = new Set([
    "payment.captured",
    "payment.failed",
    "payment.refunded",
    "order.paid",
  ]);
  let paymentData: ReturnType<typeof parseWebhookPayment> = null;
  if (paymentEvents.has(parsed.data.event)) {
    const payload = parsed.data.payload;
    const paymentEntity =
      typeof payload?.payment === "object" && payload.payment !== null
        ? (payload.payment as Record<string, unknown>).entity
        : undefined;
    paymentData = parseWebhookPayment(paymentEntity);
    if (!paymentData) {
      return NextResponse.json(
        { error: "Webhook payment details are invalid." },
        { status: 400 },
      );
    }
  }

  try {
    await connectToDatabase();
    let event;
    try {
      event = await PaymentWebhookEventModel.create({
        eventId,
        event: parsed.data.event,
      });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      event = await PaymentWebhookEventModel.findOne({ eventId }).exec();
    }
    if (!event) {
      return NextResponse.json(
        { error: "Webhook event could not be recorded." },
        { status: 500 },
      );
    }
    if (event.processedAt) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (paymentData) await synchronizeRazorpayPayment(paymentData);

    event.processedAt = new Date();
    await event.save();
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
