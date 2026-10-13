import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentCustomer } from "@/lib/auth/session";
import { CartModel } from "@/models/cart";
import { Types } from "mongoose";
import { assertCartWritable } from "@/lib/checkout/cart-lock";

export const GUEST_CART_COOKIE = "dg_cart";
const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 30;
const USER_CART_MAX_AGE = 60 * 60 * 24 * 365;

function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type CartOwner =
  | { kind: "user"; userId: string; filter: { user: string } }
  | { kind: "guest"; tokenHash: string; filter: { guestTokenHash: string } };

export async function getCartOwner(
  createGuest = true,
): Promise<CartOwner | null> {
  await connectToDatabase();
  const customer = await getCurrentCustomer();
  if (customer) {
    return { kind: "user", userId: customer.id, filter: { user: customer.id } };
  }

  const cookieStore = await cookies();
  let token = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!token && createGuest) {
    token = randomBytes(32).toString("base64url");
    cookieStore.set(GUEST_CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: GUEST_CART_MAX_AGE,
    });
  }

  if (!token) return null;
  const tokenHash = hashGuestToken(token);
  return {
    kind: "guest",
    tokenHash,
    filter: { guestTokenHash: tokenHash },
  };
}

export async function getOrCreateCart(owner: CartOwner) {
  await connectToDatabase();
  let cart = await CartModel.findOne(owner.filter)
    .select("+checkoutLockKey +checkoutLockExpiresAt")
    .exec();
  if (cart) return cart;

  const expiresAt = new Date(
    Date.now() +
      (owner.kind === "user" ? USER_CART_MAX_AGE : GUEST_CART_MAX_AGE) * 1000,
  );
  cart = new CartModel({ ...owner.filter, items: [], expiresAt });

  try {
    return await cart.save();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const existingCart = await CartModel.findOne(owner.filter)
        .select("+checkoutLockKey +checkoutLockExpiresAt")
        .exec();
      if (existingCart) return existingCart;
    }
    throw error;
  }
}

export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  await connectToDatabase();
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!token) return;

  const guestCart = await CartModel.findOne({
    guestTokenHash: hashGuestToken(token),
  }).exec();
  if (!guestCart) return;

  const userCart = await CartModel.findOne({ user: userId })
    .select("+checkoutLockKey +checkoutLockExpiresAt")
    .exec();
  if (!userCart) {
    guestCart.user = new Types.ObjectId(userId);
    guestCart.guestTokenHash = undefined;
    guestCart.expiresAt = new Date(Date.now() + USER_CART_MAX_AGE * 1000);
    await guestCart.save();
    return;
  }

  assertCartWritable(userCart);
  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (item) =>
        item.product.equals(guestItem.product) &&
        (item.variantSku ?? "") === (guestItem.variantSku ?? ""),
    );
    if (existing)
      existing.quantity = Math.min(99, existing.quantity + guestItem.quantity);
    else userCart.items.push(guestItem);
  }
  userCart.couponCode ??= guestCart.couponCode;
  await userCart.save();
  await guestCart.deleteOne();
}
