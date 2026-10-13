import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { AddressModel } from "@/models/address";
import { OrderModel } from "@/models/order";
import { getCurrentCustomer } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=%2Faccount");

  const [addresses, orders] = await Promise.all([
    AddressModel.find({ user: customer.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()
      .exec(),
    OrderModel.find({ user: customer.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select(
        "orderNumber orderStatus paymentStatus total items.name items.quantity createdAt",
      )
      .lean()
      .exec(),
  ]);

  return (
    <AccountDashboard
      initialProfile={customer}
      addresses={addresses.map((address) => ({
        id: address._id.toString(),
        label: address.label,
        recipientName: address.recipientName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
      }))}
      orders={orders.map((order) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        total: order.total,
        createdAt: order.createdAt?.toISOString() ?? "",
        items: order.items.map(({ name, quantity }) => ({ name, quantity })),
      }))}
    />
  );
}
