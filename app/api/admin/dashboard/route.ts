import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/route-guard";
import { apiErrorResponse } from "@/lib/api/errors";
import { OrderModel } from "@/models/order";
import { ProductModel } from "@/models/product";
import { UserModel } from "@/models/user";
import { InventoryModel } from "@/models/inventory";

export async function GET() {
  const auth = await requireAdminApi("dashboard:read");
  if (!auth.admin) return auth.response;

  try {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const [
      orderCount,
      customerCount,
      paidSummary,
      recentOrders,
      topProducts,
      lowInventory,
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
            orders: { $sum: 1 },
          },
        },
      ]),
      OrderModel.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .select("orderNumber orderStatus paymentStatus total createdAt user")
        .populate("user", "name email")
        .lean()
        .exec(),
      OrderModel.aggregate([
        { $match: { orderStatus: { $nin: ["cancelled", "returned"] } } },
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
        { $limit: 8 },
      ]),
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
    const summary = paidSummary[0] ?? { revenue: 0, orders: 0 };
    return NextResponse.json({
      data: {
        revenue: summary.revenue,
        paidOrders: summary.orders,
        orders: orderCount,
        customers: customerCount,
        averageOrderValue:
          summary.orders > 0 ? summary.revenue / summary.orders : 0,
        recentOrders,
        topProducts,
        lowInventory,
        dailyRevenue,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
