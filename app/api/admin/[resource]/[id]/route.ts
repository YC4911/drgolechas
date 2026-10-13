import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireAdminApi } from "@/lib/admin/route-guard";
import {
  adminCategoryUpdateSchema,
  adminCouponUpdateSchema,
  adminCustomerUpdateSchema,
  adminOrderUpdateSchema,
  adminProductUpdateSchema,
  adminResourceSchema,
  adminReviewUpdateSchema,
  adminTestimonialUpdateSchema,
} from "@/lib/admin/validation";
import { isSameOriginRequest } from "@/lib/auth/origin";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { deactivateCategory, updateCategory } from "@/lib/categories/mutations";
import { deactivateProduct, updateProduct } from "@/lib/products/mutations";
import { CategoryModel } from "@/models/category";
import { CouponModel } from "@/models/coupon";
import { InventoryModel } from "@/models/inventory";
import { OrderModel } from "@/models/order";
import { ProductModel } from "@/models/product";
import { ReviewModel } from "@/models/review";
import { TestimonialModel } from "@/models/testimonial";
import { UserModel } from "@/models/user";
import { scheduleOrderEmail } from "@/services/email/order-notifications";

type RouteContext = { params: Promise<{ resource: string; id: string }> };
type Resource = ReturnType<typeof adminResourceSchema.parse>;

const resourcePermissions: Record<
  Resource,
  { read: `${Resource}:read`; write: `${Resource}:write` }
> = {
  products: { read: "products:read", write: "products:write" },
  categories: { read: "categories:read", write: "categories:write" },
  orders: { read: "orders:read", write: "orders:write" },
  customers: { read: "customers:read", write: "customers:write" },
  reviews: { read: "reviews:read", write: "reviews:write" },
  coupons: { read: "coupons:read", write: "coupons:write" },
  testimonials: { read: "testimonials:read", write: "testimonials:write" },
  settings: { read: "settings:read", write: "settings:write" },
  social: { read: "social:read", write: "social:write" },
};

const clean = <Value>(value: Value): Value =>
  JSON.parse(JSON.stringify(value)) as Value;

async function parsedParams(params: RouteContext["params"]) {
  const values = await params;
  const resource = adminResourceSchema.safeParse(values.resource);
  if (!resource.success) return null;
  if (!Types.ObjectId.isValid(values.id)) return null;
  return { resource: resource.data, id: values.id };
}

export async function GET(_request: Request, context: RouteContext) {
  const params = await parsedParams(context.params);
  if (!params)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await requireAdminApi(resourcePermissions[params.resource].read);
  if (!auth.admin) return auth.response;

  try {
    if (params.resource === "products") {
      const product = await ProductModel.findById(params.id).exec();
      return product
        ? NextResponse.json({
            data: clean(product.toObject({ flattenMaps: true })),
          })
        : NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    if (params.resource === "categories") {
      const category = await CategoryModel.findById(params.id).lean().exec();
      return category
        ? NextResponse.json({ data: clean(category) })
        : NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    if (params.resource === "orders") {
      const order = await OrderModel.findById(params.id)
        .populate("user", "name email phone")
        .populate("payment", "provider method status transactionReference")
        .lean()
        .exec();
      return order
        ? NextResponse.json({ data: clean(order) })
        : NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (params.resource === "customers") {
      const customer = await UserModel.findOne({
        _id: params.id,
        role: "customer",
      })
        .select("name email phone role active createdAt")
        .lean()
        .exec();
      if (!customer)
        return NextResponse.json(
          { error: "Customer not found." },
          { status: 404 },
        );
      const orders = await OrderModel.find({ user: params.id })
        .select("orderNumber orderStatus paymentStatus total createdAt")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
        .exec();
      return NextResponse.json({
        data: { customer: clean(customer), orders: clean(orders) },
      });
    }
    if (params.resource === "reviews") {
      const review = await ReviewModel.findById(params.id)
        .populate("user", "name email")
        .populate("product", "name sku")
        .lean()
        .exec();
      return review
        ? NextResponse.json({ data: clean(review) })
        : NextResponse.json({ error: "Review not found." }, { status: 404 });
    }
    if (params.resource === "coupons") {
      const coupon = await CouponModel.findById(params.id).lean().exec();
      return coupon
        ? NextResponse.json({ data: clean(coupon) })
        : NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }
    if (params.resource === "testimonials") {
      const testimonial = await TestimonialModel.findById(params.id)
        .lean()
        .exec();
      return testimonial
        ? NextResponse.json({ data: clean(testimonial) })
        : NextResponse.json(
            { error: "Testimonial not found." },
            { status: 404 },
          );
    }
    return NextResponse.json(
      { error: "This resource does not have individual records." },
      { status: 400 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const params = await parsedParams(context.params);
  if (!params)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await requireAdminApi(
    resourcePermissions[params.resource].write,
  );
  if (!auth.admin) return auth.response;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  try {
    if (params.resource === "products") {
      const parsed = adminProductUpdateSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const currentProduct = await ProductModel.findById(params.id).exec();
      if (!currentProduct) {
        return NextResponse.json(
          { error: "Product not found." },
          { status: 404 },
        );
      }
      const inventory = await InventoryModel.findOne({
        product: currentProduct._id,
      }).exec();
      const nextStock = parsed.data.stock ?? inventory?.quantity;
      if (
        inventory &&
        nextStock !== undefined &&
        nextStock < inventory.reserved
      ) {
        return NextResponse.json(
          {
            error: `Stock cannot be lower than ${inventory.reserved} reserved units.`,
          },
          { status: 409 },
        );
      }
      const product = await updateProduct(params.id, parsed.data);
      if (
        parsed.data.stock !== undefined ||
        parsed.data.lowStockThreshold !== undefined
      ) {
        if (inventory) {
          inventory.quantity = parsed.data.stock ?? inventory.quantity;
          inventory.lowStockThreshold =
            parsed.data.lowStockThreshold ?? inventory.lowStockThreshold;
          await inventory.save();
        } else {
          await InventoryModel.create({
            product: product._id,
            quantity: parsed.data.stock ?? product.stock,
            reserved: 0,
            lowStockThreshold:
              parsed.data.lowStockThreshold ?? product.lowStockThreshold,
          });
        }
      }
      return NextResponse.json({
        data: clean(product.toObject({ flattenMaps: true })),
      });
    }
    if (params.resource === "categories") {
      const parsed = adminCategoryUpdateSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const category = await updateCategory(params.id, parsed.data);
      return NextResponse.json({ data: clean(category.toObject()) });
    }
    if (params.resource === "orders") {
      const parsed = adminOrderUpdateSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const previous = await OrderModel.findById(params.id)
        .select("orderStatus")
        .lean()
        .exec();
      const order = await OrderModel.findByIdAndUpdate(
        params.id,
        { $set: parsed.data },
        { returnDocument: "after", runValidators: true },
      )
        .lean()
        .exec();
      if (previous && order?.orderStatus !== previous.orderStatus) {
        const notification = {
          shipped: "orderShipped",
          delivered: "orderDelivered",
          cancelled: "cancellation",
          refunded: "refund",
        } as const;
        const template =
          notification[order?.orderStatus as keyof typeof notification];
        if (template) scheduleOrderEmail(params.id, template);
      }
      return order
        ? NextResponse.json({ data: clean(order) })
        : NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (params.resource === "customers") {
      if (auth.admin.role !== "superadmin") {
        return NextResponse.json(
          { error: "Only a Super Admin can change customer account access." },
          { status: 403 },
        );
      }
      if (auth.admin.id === params.id) {
        return NextResponse.json(
          { error: "You cannot change your own admin account here." },
          { status: 409 },
        );
      }
      const parsed = adminCustomerUpdateSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const customer = await UserModel.findOneAndUpdate(
        { _id: params.id, role: "customer" },
        { $set: parsed.data },
        { returnDocument: "after", runValidators: true },
      )
        .select("name email phone role active createdAt")
        .lean()
        .exec();
      return customer
        ? NextResponse.json({ data: clean(customer) })
        : NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }
    if (params.resource === "reviews") {
      const parsed = adminReviewUpdateSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const moderationStatus = parsed.data.approved ? "approved" : "rejected";
      const review = await ReviewModel.findByIdAndUpdate(
        params.id,
        { $set: { ...parsed.data, moderationStatus } },
        { returnDocument: "after", runValidators: true },
      )
        .lean()
        .exec();
      return review
        ? NextResponse.json({ data: clean(review) })
        : NextResponse.json({ error: "Review not found." }, { status: 404 });
    }
    if (params.resource === "coupons") {
      const parsed = adminCouponUpdateSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const currentCoupon = await CouponModel.findById(params.id).lean().exec();
      if (!currentCoupon) {
        return NextResponse.json(
          { error: "Coupon not found." },
          { status: 404 },
        );
      }
      const merged = adminCouponUpdateSchema.safeParse({
        code: currentCoupon.code,
        discountType: currentCoupon.discountType,
        discountValue: currentCoupon.discountValue,
        minimumCartValue: currentCoupon.minimumCartValue,
        maximumDiscount: currentCoupon.maximumDiscount,
        startDate: currentCoupon.startDate,
        expiryDate: currentCoupon.expiryDate,
        usageLimit: currentCoupon.usageLimit,
        perUserLimit: currentCoupon.perUserLimit,
        applicableProducts: currentCoupon.applicableProducts,
        applicableCategories: currentCoupon.applicableCategories,
        active: currentCoupon.active,
        ...parsed.data,
      });
      if (!merged.success) {
        return invalidInputResponse(merged.error.issues);
      }
      const coupon = await CouponModel.findByIdAndUpdate(
        params.id,
        { $set: merged.data },
        { returnDocument: "after", runValidators: true },
      )
        .lean()
        .exec();
      return coupon
        ? NextResponse.json({ data: clean(coupon) })
        : NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }
    if (params.resource === "testimonials") {
      const parsed = adminTestimonialUpdateSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const testimonial = await TestimonialModel.findByIdAndUpdate(
        params.id,
        { $set: parsed.data },
        { returnDocument: "after", runValidators: true },
      )
        .lean()
        .exec();
      return testimonial
        ? NextResponse.json({ data: clean(testimonial) })
        : NextResponse.json(
            { error: "Testimonial not found." },
            { status: 404 },
          );
    }
    return NextResponse.json(
      { error: "This resource does not have editable records." },
      { status: 400 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const params = await parsedParams(context.params);
  if (!params)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await requireAdminApi(
    resourcePermissions[params.resource].write,
  );
  if (!auth.admin) return auth.response;

  try {
    if (params.resource === "products") {
      const product = await deactivateProduct(params.id);
      return NextResponse.json({ data: { id: product.id, active: false } });
    }
    if (params.resource === "categories") {
      const category = await deactivateCategory(params.id);
      return NextResponse.json({ data: { id: category.id, active: false } });
    }
    if (params.resource === "reviews") {
      const review = await ReviewModel.findByIdAndDelete(params.id)
        .lean()
        .exec();
      return review
        ? NextResponse.json({ data: { id: params.id, deleted: true } })
        : NextResponse.json({ error: "Review not found." }, { status: 404 });
    }
    if (params.resource === "coupons") {
      const coupon = await CouponModel.findByIdAndUpdate(
        params.id,
        { $set: { active: false } },
        { returnDocument: "after" },
      )
        .select("_id active")
        .lean()
        .exec();
      return coupon
        ? NextResponse.json({
            data: { id: coupon._id.toString(), active: false },
          })
        : NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }
    if (params.resource === "testimonials") {
      const testimonial = await TestimonialModel.findByIdAndDelete(params.id)
        .lean()
        .exec();
      return testimonial
        ? NextResponse.json({ data: { id: params.id, deleted: true } })
        : NextResponse.json(
            { error: "Testimonial not found." },
            { status: 404 },
          );
    }
    return NextResponse.json(
      { error: "This resource cannot be deleted." },
      { status: 405 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
