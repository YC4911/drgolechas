import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/route-guard";
import { OrderModel } from "@/models/order";

export async function GET() {
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;

  try {
    const orders = await OrderModel.find({ user: auth.customer.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select(
        "orderNumber items.name items.quantity items.unitPrice items.total subtotal discount tax shipping total paymentStatus orderStatus trackingNumber createdAt",
      )
      .lean()
      .exec();
    return NextResponse.json({ data: orders });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
