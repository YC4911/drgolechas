import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { getCurrentCustomer } from "@/lib/auth/session";

export async function GET() {
  try {
    const customer = await getCurrentCustomer();
    return NextResponse.json({ data: customer });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
