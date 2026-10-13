import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ApiError } from "@/lib/api/errors";

const apiBase = "https://api.razorpay.com/v1";

const gatewayOrderSchema = z
  .object({
    id: z.string(),
    amount: z.number().int().positive(),
    currency: z.string(),
    status: z.string(),
  })
  .passthrough();

const gatewayPaymentSchema = z
  .object({
    id: z.string(),
    order_id: z.string(),
    amount: z.number().int().positive(),
    currency: z.string(),
    status: z.enum(["created", "authorized", "captured", "refunded", "failed"]),
    method: z
      .enum(["upi", "card", "netbanking", "wallet", "emi", "paylater"])
      .optional(),
  })
  .passthrough();

type GatewayPayment = z.infer<typeof gatewayPaymentSchema>;

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new ApiError(
      "Online payments are not configured. Choose Cash on Delivery or try again later.",
      503,
    );
  }
  return { keyId, keySecret };
}

function webhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new ApiError("Payment webhook verification is not configured.", 503);
  }
  return secret;
}

async function gatewayRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
): Promise<T> {
  const auth = credentials();
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${auth.keyId}:${auth.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Razorpay is temporarily unavailable. Please try again.",
      502,
    );
  }

  if (!response.ok) {
    throw new ApiError("Razorpay could not complete the payment request.", 502);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("Razorpay returned an invalid response.", 502);
  }
}

export function getRazorpayKeyId(): string {
  return credentials().keyId;
}

export function getRazorpayCheckoutMode(): "live" | "mock" | "unavailable" {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (keyId && keySecret) return "live";
  if (
    !keyId &&
    !keySecret &&
    process.env.NODE_ENV !== "production" &&
    process.env.RAZORPAY_MOCK_MODE === "true"
  ) {
    return "mock";
  }
  return "unavailable";
}

export async function createRazorpayOrder(
  amount: number,
  receipt: string,
): Promise<z.infer<typeof gatewayOrderSchema>> {
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new ApiError("The order total is not valid for online payment.", 422);
  }
  const response = await gatewayRequest<unknown>("/orders", "POST", {
    amount,
    currency: "INR",
    receipt,
    notes: { receipt },
  });
  const parsed = gatewayOrderSchema.safeParse(response);
  if (
    !parsed.success ||
    parsed.data.amount !== amount ||
    parsed.data.currency !== "INR"
  ) {
    throw new ApiError("Razorpay returned an inconsistent order.", 502);
  }
  return parsed.data;
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = credentials().keySecret;
  const expected = Buffer.from(
    createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex"),
    "hex",
  );
  const received = Buffer.from(signature, "hex");
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export function verifyRazorpayWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const expected = Buffer.from(
    createHmac("sha256", webhookSecret()).update(payload).digest("hex"),
    "hex",
  );
  const received = Buffer.from(signature, "hex");
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function getRazorpayPayment(
  paymentId: string,
): Promise<GatewayPayment> {
  const response = await gatewayRequest<unknown>(
    `/payments/${encodeURIComponent(paymentId)}`,
    "GET",
  );
  const parsed = gatewayPaymentSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError("Razorpay returned invalid payment details.", 502);
  }
  return parsed.data;
}

export async function captureRazorpayPayment(
  payment: GatewayPayment,
): Promise<GatewayPayment> {
  if (payment.status !== "authorized") return payment;

  await gatewayRequest(
    `/payments/${encodeURIComponent(payment.id)}/capture`,
    "POST",
    { amount: payment.amount, currency: payment.currency },
  );
  return getRazorpayPayment(payment.id);
}
