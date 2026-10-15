import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { getCurrentCustomer } from "@/lib/auth/session";
import { OrderModel } from "@/models/order";
import { PaymentModel } from "@/models/payment";

export const metadata: Metadata = { title: "Order details" };
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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=%2Faccount%2Forders");
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  const order = await OrderModel.findOne({ _id: id, user: customer.id })
    .lean()
    .exec();
  if (!order) notFound();

  const payment = order.payment
    ? await PaymentModel.findOne({ _id: order.payment, user: customer.id })
        .select("method provider")
        .lean()
        .exec()
    : null;
  const method =
    order.paymentStatus === "cod"
      ? "Cash on Delivery"
      : payment?.provider === "razorpay"
        ? `Razorpay · ${payment.method.toUpperCase()}`
        : payment?.provider === "mock"
          ? "Development mock · unpaid"
          : "Not available";

  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-8 sm:py-12">
      <Link
        href="/account/orders"
        className="text-teal text-sm font-medium hover:underline"
      >
        ← All orders
      </Link>
      <header className="border-line mt-4 flex flex-wrap items-end justify-between gap-3 border-b pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-herbal-gold)] uppercase">
            Order confirmation
          </p>
          <h1 className="font-display text-teal mt-2 text-3xl">
            {order.orderNumber}
          </h1>
          <p className="text-muted mt-1 text-sm">
            Placed{" "}
            {order.createdAt?.toLocaleDateString("en-IN") ?? "date unavailable"}
          </p>
        </div>
        <p className="text-teal text-sm font-semibold">
          {formatStatus(order.orderStatus)}
        </p>
      </header>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <h2 className="font-display text-teal text-2xl">Products</h2>
          <ul className="divide-line border-line mt-3 divide-y border-y">
            {order.items.map((item, index) => (
              <li
                key={`${item.sku}-${index}`}
                className="flex justify-between gap-4 py-4 text-sm"
              >
                <span className="text-ink">
                  {item.name}
                  {item.variant ? ` · ${item.variant}` : ""}{" "}
                  <span className="text-muted">× {item.quantity}</span>
                </span>
                <span className="text-ink shrink-0 font-medium">
                  {formatPrice(item.total)}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-teal mt-8 text-2xl">
            Shipping address
          </h2>
          <address className="border-line text-muted mt-3 border-y py-4 text-sm leading-6 not-italic">
            <span className="text-ink font-medium">
              {order.shippingAddress.name}
            </span>
            <br />
            {order.shippingAddress.phone}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2
              ? `, ${order.shippingAddress.line2}`
              : ""}
            {order.shippingAddress.landmark
              ? `, ${order.shippingAddress.landmark}`
              : ""}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
          </address>
          {order.trackingNumber ? (
            <p className="text-ink mt-4 text-sm">
              Tracking number:{" "}
              <span className="font-semibold">{order.trackingNumber}</span>
            </p>
          ) : null}
        </section>

        <aside className="border-line h-fit border p-5">
          <h2 className="font-display text-teal text-2xl">Payment & total</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Payment method</dt>
              <dd className="text-ink text-right">{method}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Payment status</dt>
              <dd className="text-ink font-medium">
                {order.paymentStatus === "cod"
                  ? "Due on delivery (COD)"
                  : formatStatus(order.paymentStatus)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Discount</dt>
                <dd>−{formatPrice(order.discount)}</dd>
              </div>
            ) : null}
            {order.tax > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">GST</dt>
                <dd>{formatPrice(order.tax)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Shipping</dt>
              <dd>
                {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              </dd>
            </div>
            <div className="border-line text-teal flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
          {order.paymentStatus === "pending" ||
          order.paymentStatus === "failed" ? (
            <p className="text-muted mt-4 text-xs leading-5">
              Payment is not confirmed. The order will be processed only after a
              successful payment has been verified.
            </p>
          ) : null}
          {["paid", "cod", "refunded"].includes(order.paymentStatus) ? (
            <a
              href={`/api/account/orders/${encodeURIComponent(order._id.toString())}/invoice`}
              className="border-line text-teal mt-5 inline-flex min-h-11 w-full items-center justify-center border px-4 text-sm font-semibold hover:bg-[var(--color-warm-ivory)]"
            >
              Download invoice PDF
            </a>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
