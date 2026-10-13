import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/route-guard";
import { consumeAuthLimit } from "@/lib/auth/rate-limit";
import { isSameOriginRequest } from "@/lib/auth/origin";
import {
  createCodOrder,
  createRazorpayCheckoutOrder,
} from "@/lib/checkout/create-order";
import {
  checkoutSchema,
  idempotencyKeySchema,
} from "@/lib/checkout/validation";
import {
  getRazorpayCheckoutMode,
  getRazorpayKeyId,
} from "@/lib/payments/razorpay";
import { scheduleOrderEmail } from "@/services/email/order-notifications";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  const key = idempotencyKeySchema.safeParse(
    request.headers.get("idempotency-key") ?? "",
  );
  if (!key.success) {
    return invalidInputResponse([
      {
        path: ["headers", "Idempotency-Key"],
        message: "A valid UUID idempotency key is required.",
      },
    ]);
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = checkoutSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const allowed = await consumeAuthLimit(
      "checkout",
      auth.customer.id,
      10,
      600,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again later." },
        { status: 429 },
      );
    }

    if (parsed.data.paymentMethod === "razorpay") {
      const mode = getRazorpayCheckoutMode();
      if (mode === "unavailable") {
        return NextResponse.json(
          {
            error:
              "Online payments are not configured. Choose Cash on Delivery or try again later.",
          },
          { status: 503 },
        );
      }
      const keyId = mode === "live" ? getRazorpayKeyId() : undefined;
      const result = await createRazorpayCheckoutOrder(
        auth.customer.id,
        key.data,
        parsed.data,
        mode,
      );
      return NextResponse.json(
        {
          data: {
            orderId: result.order._id.toString(),
            orderNumber: result.order.orderNumber,
            orderStatus: result.order.orderStatus,
            paymentStatus: result.order.paymentStatus,
            total: result.order.total,
            createdAt: result.order.createdAt,
            razorpayOrderId: result.payment.gatewayOrderId,
            amount: Math.round(result.payment.amount * 100),
            currency: result.payment.currency,
            keyId,
            paymentMode: mode,
          },
          duplicate: result.duplicate,
        },
        { status: result.duplicate ? 200 : 201 },
      );
    }

    const result = await createCodOrder(
      auth.customer.id,
      key.data,
      parsed.data,
    );
    const order = result.order;
    if (!result.duplicate) {
      scheduleOrderEmail(order._id.toString(), "orderConfirmation");
    }

    return NextResponse.json(
      {
        data: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          total: order.total,
          createdAt: order.createdAt,
          paymentMethod: "cod",
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            total: item.total,
          })),
          shippingAddress: order.shippingAddress,
        },
        duplicate: result.duplicate,
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
