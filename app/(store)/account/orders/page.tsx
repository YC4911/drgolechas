import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth/session";
import { OrderModel } from "@/models/order";

export const metadata: Metadata = { title: "My Orders" };
export const dynamic = "force-dynamic";

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function OrderHistoryPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=%2Faccount%2Forders");
  const orders = await OrderModel.find({ user: customer.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .select(
      "orderNumber orderStatus paymentStatus total items.name items.quantity createdAt",
    )
    .lean()
    .exec();

  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-8 sm:py-12">
      <Link
        href="/account"
        className="text-teal text-sm font-medium hover:underline"
      >
        ← My account
      </Link>
      <h1 className="font-display text-teal mt-4 text-4xl">Your orders</h1>
      {orders.length ? (
        <div className="divide-line border-line mt-7 divide-y border-y">
          {orders.map((order) => (
            <article
              key={order._id.toString()}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <h2 className="text-ink font-semibold">{order.orderNumber}</h2>
                <p className="text-muted mt-1 text-sm">
                  {order.createdAt?.toLocaleDateString("en-IN") ??
                    "Date unavailable"}{" "}
                  · {order.items.length} item(s)
                </p>
                <p className="text-muted mt-1 text-xs">
                  {formatStatus(order.orderStatus)} · Payment{" "}
                  {order.paymentStatus === "cod"
                    ? "due on delivery"
                    : formatStatus(order.paymentStatus)}
                </p>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-teal font-semibold">
                  {formatPrice(order.total)}
                </span>
                <Link
                  href={`/account/orders/${order._id.toString()}`}
                  className="text-teal text-sm font-semibold hover:underline"
                >
                  View order
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="border-line text-muted mt-5 border-y py-8 text-sm">
          You have not placed any orders yet.
        </p>
      )}
    </main>
  );
}
