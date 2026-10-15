import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { InventoryModel } from "@/models/inventory";
import { OrderModel } from "@/models/order";
import { ProductModel } from "@/models/product";
import { UserModel } from "@/models/user";

export const metadata = { title: "Admin dashboard" };

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AdminPage() {
  await requireAdminPage("dashboard:read");
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const [
    totalOrders,
    customers,
    paidTotals,
    recentOrders,
    topProducts,
    inventoryRows,
    allInventoryProductIds,
    fallbackProducts,
    dailyRevenue,
  ] = await Promise.all([
    OrderModel.countDocuments({}),
    UserModel.countDocuments({ role: "customer" }),
    OrderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]),
    OrderModel.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select("orderNumber orderStatus paymentStatus total createdAt user")
      .populate("user", "name email")
      .lean()
      .exec(),
    OrderModel.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["paid", "cod"] },
          orderStatus: { $nin: ["cancelled", "returned"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    InventoryModel.aggregate([
      {
        $match: {
          $expr: {
            $lte: [
              { $subtract: ["$quantity", "$reserved"] },
              "$lowStockThreshold",
            ],
          },
        },
      },
      {
        $lookup: {
          from: ProductModel.collection.name,
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.active": true } },
      {
        $project: {
          _id: "$product._id",
          name: "$product.name",
          sku: "$product.sku",
          available: { $subtract: ["$quantity", "$reserved"] },
          threshold: "$lowStockThreshold",
        },
      },
      { $sort: { available: 1 } },
      { $limit: 6 },
    ]),
    InventoryModel.distinct("product"),
    ProductModel.find({
      active: true,
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    })
      .select("name sku stock lowStockThreshold")
      .lean()
      .exec(),
    OrderModel.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const inventoryProductIds = new Set(
    allInventoryProductIds.map((id: { toString(): string }) => id.toString()),
  );
  const lowStockProducts = [
    ...inventoryRows,
    ...fallbackProducts
      .filter(
        (product: { _id: { toString(): string } }) =>
          !inventoryProductIds.has(product._id.toString()),
      )
      .map(
        (product: {
          _id: { toString(): string };
          name: string;
          sku: string;
          stock: number;
          lowStockThreshold: number;
        }) => ({
          _id: product._id,
          name: product.name,
          sku: product.sku,
          available: product.stock,
          threshold: product.lowStockThreshold,
        }),
      ),
  ]
    .sort((left, right) => left.available - right.available)
    .slice(0, 6);

  const summary = paidTotals[0] ?? { revenue: 0, count: 0 };
  const revenueByDay = new Map<string, number>(
    dailyRevenue.map((item: { _id: string; revenue: number }) => [
      item._id,
      item.revenue,
    ]),
  );
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      revenue: revenueByDay.get(key) ?? 0,
    };
  });
  const maxRevenue = Math.max(1, ...days.map((day) => day.revenue));

  const metrics = [
    {
      label: "Paid revenue",
      value: formatPrice(summary.revenue),
      note: "Verified captured payments",
    },
    {
      label: "All orders",
      value: totalOrders.toLocaleString("en-IN"),
      note: "Includes pending and COD orders",
    },
    {
      label: "Customers",
      value: customers.toLocaleString("en-IN"),
      note: "Registered customer accounts",
    },
    {
      label: "Average paid order",
      value: summary.count
        ? formatPrice(summary.revenue / summary.count)
        : formatPrice(0),
      note: `${summary.count.toLocaleString("en-IN")} paid orders`,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] text-[var(--color-herbal-gold)] uppercase">
            Store overview
          </p>
          <h1 className="font-display mt-2 text-3xl text-[var(--color-forest-olive)] sm:text-4xl">
            Good day.
          </h1>
          <p className="mt-2 text-sm text-[var(--color-forest-olive)]">
            Your store at a glance. Revenue includes verified online payments
            only.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex min-h-10 items-center rounded border border-[var(--color-natural-beige)] bg-white px-4 text-sm font-semibold text-[var(--color-forest-olive)] hover:bg-[var(--color-warm-ivory)]"
        >
          Review orders
        </Link>
      </div>

      <section
        aria-label="Store metrics"
        className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-lg border border-[var(--color-natural-beige)] bg-white p-5 shadow-[0_2px_8px_rgba(10,45,50,.03)]"
          >
            <p className="text-xs font-semibold tracking-[0.1em] text-[var(--color-forest-olive)] uppercase">
              {metric.label}
            </p>
            <p className="font-display mt-3 text-3xl text-[var(--color-forest-olive)]">
              {metric.value}
            </p>
            <p className="mt-2 text-xs text-[var(--color-forest-olive)]">
              {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-lg border border-[var(--color-natural-beige)] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[var(--color-forest-olive)]">
                Revenue trend
              </h2>
              <p className="mt-1 text-xs text-[var(--color-forest-olive)]">
                Verified payments · last 7 days
              </p>
            </div>
            <span className="rounded-full bg-[var(--color-warm-ivory)] px-3 py-1 text-[11px] font-semibold text-[var(--color-herbal-gold)]">
              INR
            </span>
          </div>
          <div
            className="mt-7 flex h-48 items-end gap-3 border-b border-[var(--color-natural-beige)] pb-2 sm:gap-5"
            aria-label="Daily paid revenue bar chart"
          >
            {days.map((day) => (
              <div
                key={day.key}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[10px] font-medium text-[var(--color-forest-olive)]">
                  {day.revenue ? formatPrice(day.revenue) : "—"}
                </span>
                <div
                  className="w-full max-w-12 rounded-t bg-gradient-to-t from-[var(--color-forest-olive)] to-[var(--color-muted-sage)]"
                  style={{
                    height: `${Math.max(day.revenue ? 8 : 2, (day.revenue / maxRevenue) * 100)}%`,
                  }}
                  title={`${day.key}: ${formatPrice(day.revenue)}`}
                />
                <span className="text-[10px] text-[var(--color-forest-olive)]">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[var(--color-natural-beige)] bg-white p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[var(--color-forest-olive)]">
                Low stock
              </h2>
              <p className="mt-1 text-xs text-[var(--color-forest-olive)]">
                At or below configured threshold
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[var(--color-forest-olive)] hover:underline"
            >
              Manage products
            </Link>
          </div>
          {lowStockProducts.length ? (
            <ul className="mt-4 divide-y divide-[var(--color-natural-beige)]">
              {lowStockProducts.map(
                (item: {
                  _id: { toString(): string };
                  name: string;
                  sku: string;
                  available: number;
                  threshold: number;
                }) => (
                  <li
                    key={item._id.toString()}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-botanical-charcoal)]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-forest-olive)]">
                        {item.sku} · threshold {item.threshold}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-[var(--color-warm-ivory)] px-2.5 py-1 text-xs font-bold text-[var(--color-herbal-gold)]">
                      {item.available} left
                    </span>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-5 rounded bg-[var(--color-warm-ivory)] p-4 text-sm text-[var(--color-forest-olive)]">
              No inventory records are at or below their low-stock thresholds.
            </p>
          )}
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="overflow-hidden rounded-lg border border-[var(--color-natural-beige)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--color-natural-beige)] p-5">
            <div>
              <h2 className="font-display text-2xl text-[var(--color-forest-olive)]">
                Recent orders
              </h2>
              <p className="mt-1 text-xs text-[var(--color-forest-olive)]">
                Latest customer activity
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[var(--color-forest-olive)] hover:underline"
            >
              All orders
            </Link>
          </div>
          {recentOrders.length ? (
            <div className="divide-y divide-[var(--color-natural-beige)]">
              {recentOrders.map((order) => {
                const customer = order.user as {
                  name?: string;
                  email?: string;
                } | null;
                return (
                  <div
                    key={order._id.toString()}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-botanical-charcoal)]">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-forest-olive)]">
                        {customer?.name ?? customer?.email ?? "Customer"} ·{" "}
                        {order.createdAt?.toLocaleDateString("en-IN") ?? ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--color-forest-olive)]">
                        {formatPrice(order.total)}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-forest-olive)] capitalize">
                        {formatStatus(order.orderStatus)} ·{" "}
                        {formatStatus(order.paymentStatus)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p-5 text-sm text-[var(--color-forest-olive)]">
              No orders yet.
            </p>
          )}
        </article>

        <article className="overflow-hidden rounded-lg border border-[var(--color-natural-beige)] bg-white">
          <div className="border-b border-[var(--color-natural-beige)] p-5">
            <h2 className="font-display text-2xl text-[var(--color-forest-olive)]">
              Top products
            </h2>
            <p className="mt-1 text-xs text-[var(--color-forest-olive)]">
              Units ordered · excluding cancelled and returned orders
            </p>
          </div>
          {topProducts.length ? (
            <ol className="divide-y divide-[var(--color-natural-beige)]">
              {topProducts.map(
                (
                  product: {
                    _id: { toString(): string };
                    name: string;
                    quantity: number;
                    revenue: number;
                  },
                  index: number,
                ) => (
                  <li
                    key={product._id.toString()}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-warm-ivory)] text-xs font-bold text-[var(--color-herbal-gold)]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-botanical-charcoal)]">
                      {product.name}
                    </span>
                    <span className="text-right text-xs text-[var(--color-forest-olive)]">
                      {product.quantity} sold
                      <br />
                      <span className="font-semibold text-[var(--color-forest-olive)]">
                        {formatPrice(product.revenue)}
                      </span>
                    </span>
                  </li>
                ),
              )}
            </ol>
          ) : (
            <p className="p-5 text-sm text-[var(--color-forest-olive)]">
              Product sales will appear here when orders are placed.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}
