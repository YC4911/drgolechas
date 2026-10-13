import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/route-guard";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { razorpayVerificationSchema } from "@/lib/checkout/validation";
import { verifyCustomerRazorpayPayment } from "@/lib/payments/processing";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = razorpayVerificationSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const result = await verifyCustomerRazorpayPayment(
      auth.customer.id,
      parsed.data,
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
