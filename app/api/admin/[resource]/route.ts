import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/route-guard";
import {
  adminCategorySchema,
  adminCouponSchema,
  adminListQuerySchema,
  adminProductSchema,
  adminResourceSchema,
  adminSettingsSchema,
  adminSocialSchema,
  adminTestimonialSchema,
} from "@/lib/admin/validation";
import { isSameOriginRequest } from "@/lib/auth/origin";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { createCategory } from "@/lib/categories/mutations";
import { listCategories } from "@/lib/categories/service";
import { createProduct } from "@/lib/products/mutations";
import { CouponModel } from "@/models/coupon";
import { InventoryModel } from "@/models/inventory";
import { OrderModel } from "@/models/order";
import { ProductModel } from "@/models/product";
import { ReviewModel } from "@/models/review";
import { SiteSettingsModel } from "@/models/site-settings";
import { TestimonialModel } from "@/models/testimonial";
import { UserModel } from "@/models/user";

type RouteContext = { params: Promise<{ resource: string }> };
type Resource = ReturnType<typeof adminResourceSchema.parse>;

const permissions: Record<
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
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function resolveResource(params: RouteContext["params"]) {
  const parsed = adminResourceSchema.safeParse((await params).resource);
  return parsed.success ? parsed.data : null;
}

export async function GET(request: Request, context: RouteContext) {
  const resource = await resolveResource(context.params);
  if (!resource)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await requireAdminApi(permissions[resource].read);
  if (!auth.admin) return auth.response;

  const query = adminListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!query.success) return invalidInputResponse(query.error.issues);
  const { q, active, status, category, page, sort } = query.data;
  const regex = q ? new RegExp(escapeRegex(q), "i") : null;
  const limit = 50;

  try {
    let data: unknown;
    if (resource === "products") {
      const filter: Record<string, unknown> = {};
      if (regex)
        filter.$or = [{ name: regex }, { sku: regex }, { slug: regex }];
      if (active !== undefined) filter.active = active === "true";
      if (category) filter.category = category;
      const [records, total] = await Promise.all([
        ProductModel.find(filter)
          .sort(
            sort === "price-asc"
              ? { price: 1 }
              : sort === "price-desc"
                ? { price: -1 }
                : sort === "name"
                  ? { name: 1 }
                  : sort === "stock-asc"
                    ? { stock: 1 }
                    : { updatedAt: -1 },
          )
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("category", "name")
          .populate("subcategory", "name")
          .exec(),
        ProductModel.countDocuments(filter),
      ]);
      data = {
        items: clean(
          records.map((record) => record.toObject({ flattenMaps: true })),
        ),
        total,
        page,
      };
    } else if (resource === "categories") {
      const categories = await listCategories(true);
      const filtered = categories.filter((item) => {
        const matchesText = !regex || regex.test(`${item.name} ${item.slug}`);
        const matchesActive =
          active === undefined || item.active === (active === "true");
        return matchesText && matchesActive;
      });
      data = {
        items: filtered.slice((page - 1) * limit, page * limit),
        total: filtered.length,
        page,
      };
    } else if (resource === "orders") {
      const filter: Record<string, unknown> = {};
      if (status) filter.orderStatus = status;
      if (regex) {
        filter.$or = [
          { orderNumber: regex },
          { "shippingAddress.name": regex },
          { trackingNumber: regex },
        ];
      }
      const [records, total] = await Promise.all([
        OrderModel.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("user", "name email phone")
          .lean()
          .exec(),
        OrderModel.countDocuments(filter),
      ]);
      data = { items: clean(records), total, page };
    } else if (resource === "customers") {
      const filter: Record<string, unknown> = { role: "customer" };
      if (regex)
        filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
      if (active !== undefined) filter.active = active === "true";
      const [records, total] = await Promise.all([
        UserModel.find(filter)
          .select("name email phone role active createdAt updatedAt")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean()
          .exec(),
        UserModel.countDocuments(filter),
      ]);
      data = { items: clean(records), total, page };
    } else if (resource === "reviews") {
      const filter: Record<string, unknown> = {};
      if (status === "approved") filter.approved = true;
      else if (status === "rejected") filter.moderationStatus = "rejected";
      else if (status === "pending") {
        filter.$and = [
          { approved: false },
          {
            $or: [
              { moderationStatus: "pending" },
              { moderationStatus: { $exists: false } },
            ],
          },
        ];
      } else if (active !== undefined) filter.approved = active === "true";
      if (regex) filter.$or = [{ title: regex }, { comment: regex }];
      const [records, total] = await Promise.all([
        ReviewModel.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("user", "name email")
          .populate("product", "name sku")
          .lean()
          .exec(),
        ReviewModel.countDocuments(filter),
      ]);
      data = { items: clean(records), total, page };
    } else if (resource === "coupons") {
      const filter: Record<string, unknown> = {};
      if (regex) filter.code = regex;
      if (active !== undefined) filter.active = active === "true";
      const [records, total] = await Promise.all([
        CouponModel.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("applicableProducts", "name sku")
          .populate("applicableCategories", "name")
          .lean()
          .exec(),
        CouponModel.countDocuments(filter),
      ]);
      data = { items: clean(records), total, page };
    } else if (resource === "testimonials") {
      const filter: Record<string, unknown> = {};
      if (active !== undefined) filter.approved = active === "true";
      if (regex) filter.$or = [{ authorName: regex }, { quote: regex }];
      const [records, total] = await Promise.all([
        TestimonialModel.find(filter)
          .sort({ displayOrder: 1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean()
          .exec(),
        TestimonialModel.countDocuments(filter),
      ]);
      data = { items: clean(records), total, page };
    } else {
      const settings = await SiteSettingsModel.findOne({ key: "store" })
        .lean()
        .exec();
      if (resource === "social") {
        const links = settings?.socialLinks;
        data = clean(
          links instanceof Map ? Object.fromEntries(links) : (links ?? {}),
        );
      } else {
        data = clean(
          settings ?? {
            key: "store",
            logo: "",
            storeName: "Dr. Golechas",
            tagline: "",
            contactInformation: { phone: "", email: "", address: "" },
            gstInformation: { gstin: "", legalName: "" },
            socialLinks: {},
            shippingSettings: {
              flatRate: 0,
              freeShippingThreshold: 0,
              estimatedDays: 0,
            },
            taxSettings: { defaultGst: 0, pricesIncludeGst: false },
          },
        );
      }
    }
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const resource = await resolveResource(context.params);
  if (!resource)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await requireAdminApi(permissions[resource].write);
  if (!auth.admin) return auth.response;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  try {
    if (resource === "products") {
      const parsed = adminProductSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const product = await createProduct(parsed.data);
      await InventoryModel.findOneAndUpdate(
        { product: product._id },
        {
          $setOnInsert: {
            quantity: product.stock,
            reserved: 0,
            lowStockThreshold: product.lowStockThreshold,
          },
        },
        { upsert: true, returnDocument: "after" },
      ).exec();
      return NextResponse.json(
        { data: clean(product.toObject({ flattenMaps: true })) },
        { status: 201 },
      );
    }
    if (resource === "categories") {
      const parsed = adminCategorySchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const category = await createCategory(parsed.data);
      return NextResponse.json(
        { data: clean(category.toObject()) },
        { status: 201 },
      );
    }
    if (resource === "coupons") {
      const parsed = adminCouponSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const coupon = await CouponModel.create(parsed.data);
      return NextResponse.json(
        { data: clean(coupon.toObject()) },
        { status: 201 },
      );
    }
    if (resource === "testimonials") {
      const parsed = adminTestimonialSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const testimonial = await TestimonialModel.create(parsed.data);
      return NextResponse.json(
        { data: clean(testimonial.toObject()) },
        { status: 201 },
      );
    }
    return NextResponse.json(
      { error: `Creating ${resource} records is not supported.` },
      { status: 405 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const resource = await resolveResource(context.params);
  if (!resource)
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await requireAdminApi(permissions[resource].write);
  if (!auth.admin) return auth.response;
  if (resource !== "settings" && resource !== "social") {
    return NextResponse.json(
      { error: "This resource requires a record ID." },
      { status: 400 },
    );
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  try {
    if (resource === "social") {
      const parsed = adminSocialSchema.safeParse(body.body);
      if (!parsed.success) return invalidInputResponse(parsed.error.issues);
      const updated = await SiteSettingsModel.findOneAndUpdate(
        { key: "store" },
        { $set: { socialLinks: parsed.data } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      )
        .lean()
        .exec();
      return NextResponse.json({
        data: clean(
          updated?.socialLinks instanceof Map
            ? Object.fromEntries(updated.socialLinks)
            : (updated?.socialLinks ?? parsed.data),
        ),
      });
    }
    const parsed = adminSettingsSchema.safeParse(body.body);
    if (!parsed.success) return invalidInputResponse(parsed.error.issues);
    const settingsUpdate = Object.fromEntries(
      Object.entries(parsed.data).flatMap(([key, value]) =>
        value !== null && typeof value === "object" && !Array.isArray(value)
          ? Object.entries(value).map(([nestedKey, nestedValue]) => [
              `${key}.${nestedKey}`,
              nestedValue,
            ])
          : [[key, value]],
      ),
    );
    const updated = await SiteSettingsModel.findOneAndUpdate(
      { key: "store" },
      { $set: settingsUpdate },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    )
      .lean()
      .exec();
    return NextResponse.json({ data: clean(updated) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
