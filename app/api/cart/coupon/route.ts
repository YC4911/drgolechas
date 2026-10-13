import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { getCartOwner, getOrCreateCart } from "@/lib/cart/context";
import {
  applyCartCoupon,
  buildCartSnapshot,
  removeCartCoupon,
} from "@/lib/cart/service";
import { applyCouponSchema } from "@/lib/cart/validation";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = applyCouponSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const owner = await getCartOwner(false);
    if (!owner) return NextResponse.json({ error: "Cart is empty." }, { status: 404 });
    const cart = await getOrCreateCart(owner);
    return NextResponse.json({
      data: await applyCartCoupon(cart, owner, parsed.data.code),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const owner = await getCartOwner(false);
    if (!owner) return NextResponse.json({ error: "Cart is empty." }, { status: 404 });
    const cart = await getOrCreateCart(owner);
    await removeCartCoupon(cart);
    return NextResponse.json({ data: await buildCartSnapshot(cart, owner) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}