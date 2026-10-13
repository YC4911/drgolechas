import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/route-guard";
import { OrderModel } from "@/models/order";
import { PaymentModel } from "@/models/payment";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Order was not found." },
      { status: 404 },
    );
  }

  try {
    const order = await OrderModel.findOne({ _id: id, user: auth.customer.id })
      .lean()
      .exec();
    if (!order)
      return NextResponse.json(
        { error: "Order was not found." },
        { status: 404 },
      );
    const payment = order.payment
      ? await PaymentModel.findOne({
          _id: order.payment,
          user: auth.customer.id,
        })
          .select("provider method")
          .lean()
          .exec()
      : null;
    return NextResponse.json({
      data: {
        ...order,
        _id: order._id.toString(),
        paymentMethod:
          order.paymentStatus === "cod"
            ? "cod"
            : payment
              ? `${payment.provider}:${payment.method}`
              : null,
        payment: undefined,
        user: undefined,
        coupon: undefined,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
