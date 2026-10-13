import { NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { requireCustomer } from "@/lib/auth/route-guard";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { reviewSubmissionSchema } from "@/lib/reviews/validation";
import { OrderModel } from "@/models/order";
import { ProductModel } from "@/models/product";
import { ReviewModel } from "@/models/review";
import { getPublicReviewSummary } from "@/lib/reviews/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  try {
    const summary = await getPublicReviewSummary(id);
    return NextResponse.json({ data: summary });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireCustomer();
  if (!auth.customer) return auth.response;
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = reviewSubmissionSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const product = await ProductModel.findOne({ _id: id, active: true })
      .select(
        "_id publicationStatus priceApproved productDetailsVerified variants",
      )
      .lean()
      .exec();
    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }
    if (
      (product.publicationStatus ?? "published") !== "published" ||
      product.priceApproved === false ||
      product.productDetailsVerified === false ||
      product.variants.some((variant) => variant.priceApproved === false)
    ) {
      return NextResponse.json(
        {
          error:
            "Reviews are available after the product is approved for sale.",
        },
        { status: 409 },
      );
    }
    const alreadyReviewed = await ReviewModel.exists({
      product: product._id,
      user: auth.customer.id,
    });
    if (alreadyReviewed) {
      return NextResponse.json(
        { error: "You have already submitted a review for this product." },
        { status: 409 },
      );
    }
    const verifiedOrder = await OrderModel.findOne({
      user: auth.customer.id,
      "items.product": product._id,
      $or: [
        {
          paymentStatus: "paid",
          orderStatus: { $nin: ["cancelled", "returned", "refunded"] },
        },
        { paymentStatus: "cod", orderStatus: "delivered" },
      ],
    })
      .select("_id")
      .lean()
      .exec();
    const review = await ReviewModel.create({
      product: product._id,
      user: auth.customer.id,
      ...parsed.data,
      verifiedPurchase: Boolean(verifiedOrder),
      approved: false,
      moderationStatus: "pending",
    });
    return NextResponse.json(
      { data: { id: review._id.toString(), approved: false } },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "You have already submitted a review for this product." },
        { status: 409 },
      );
    }
    return apiErrorResponse(error);
  }
}
