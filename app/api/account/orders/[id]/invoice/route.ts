import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/route-guard";
import { OrderModel } from "@/models/order";
import { PaymentModel } from "@/models/payment";
import { SiteSettingsModel } from "@/models/site-settings";
import { UserModel } from "@/models/user";
import { generateInvoicePdf } from "@/services/invoices/pdf";

export const runtime = "nodejs";

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
    if (!order) {
      return NextResponse.json(
        { error: "Order was not found." },
        { status: 404 },
      );
    }
    if (!["paid", "cod", "refunded"].includes(order.paymentStatus)) {
      return NextResponse.json(
        { error: "An invoice is available after the order is confirmed." },
        { status: 409 },
      );
    }

    const [user, settings, payment] = await Promise.all([
      UserModel.findById(auth.customer.id).select("email").lean().exec(),
      SiteSettingsModel.findOne({ key: "store" })
        .select("storeName contactInformation gstInformation taxSettings")
        .lean()
        .exec(),
      order.payment
        ? PaymentModel.findOne({ _id: order.payment, user: auth.customer.id })
            .select("provider method")
            .lean()
            .exec()
        : null,
    ]);
    if (!user) {
      return NextResponse.json(
        { error: "Customer account was not found." },
        { status: 404 },
      );
    }

    const paymentMethod =
      order.paymentStatus === "cod"
        ? "Cash on Delivery"
        : payment?.provider === "razorpay"
          ? `Razorpay (${payment.method})`
          : payment?.provider === "mock"
            ? "Development mock payment"
            : "Not available";
    const pdf = await generateInvoicePdf({
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      issuedAt: order.createdAt ?? new Date(),
      store: {
        name: settings?.storeName || "Dr. Golechas",
        legalName: settings?.gstInformation?.legalName ?? "",
        gstin: settings?.gstInformation?.gstin ?? "",
        address: settings?.contactInformation?.address ?? "",
        email: settings?.contactInformation?.email ?? "",
        phone: settings?.contactInformation?.phone ?? "",
      },
      customer: { ...order.shippingAddress, email: user.email },
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      pricesIncludeGst: settings?.taxSettings?.pricesIncludeGst ?? false,
      shipping: order.shipping,
      total: order.total,
      paymentMethod,
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(`invoice-${order.orderNumber}.pdf`)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
