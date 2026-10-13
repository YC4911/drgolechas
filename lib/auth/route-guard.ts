import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import {
  getCurrentCustomer,
  type AuthenticatedCustomer,
} from "@/lib/auth/session";

export async function requireCustomer(): Promise<
  | { customer: AuthenticatedCustomer; response?: never }
  | { customer?: never; response: NextResponse }
> {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return {
        response: NextResponse.json(
          { error: "Authentication required." },
          { status: 401 },
        ),
      };
    }
    return { customer };
  } catch (error) {
    return { response: apiErrorResponse(error) };
  }
}
