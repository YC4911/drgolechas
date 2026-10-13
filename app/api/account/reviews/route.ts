import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/route-guard";
import { ReviewModel } from "@/models/review";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  try {
    const reviews = await ReviewModel.find({ user: auth.customer.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .select(
        "product rating title comment verifiedPurchase approved createdAt",
      )
      .populate({ path: "product", select: "name slug thumbnail" })
      .lean()
      .exec();
    return NextResponse.json({ data: reviews });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
