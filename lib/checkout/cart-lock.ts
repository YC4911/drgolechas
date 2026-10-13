import { ApiError } from "@/lib/api/errors";
import { CartModel, type CartRecord } from "@/models/cart";

const CART_CHECKOUT_LOCK_MS = 60_000;

export async function claimCartForCheckout(
  userId: string,
  idempotencyKey: string,
): Promise<void> {
  const now = new Date();
  const cart = await CartModel.findOneAndUpdate(
    {
      user: userId,
      $or: [
        { checkoutLockExpiresAt: { $exists: false } },
        { checkoutLockExpiresAt: { $lte: now } },
      ],
    },
    {
      $set: {
        checkoutLockKey: idempotencyKey,
        checkoutLockExpiresAt: new Date(now.getTime() + CART_CHECKOUT_LOCK_MS),
      },
      $inc: { __v: 1 },
    },
    { returnDocument: "after" },
  )
    .select("_id")
    .lean()
    .exec();
  if (!cart) {
    throw new ApiError(
      "Checkout is already being processed. Please wait and check your orders.",
      409,
    );
  }
}

export async function releaseCartCheckoutLock(
  userId: string,
  idempotencyKey: string,
): Promise<void> {
  await CartModel.updateOne(
    { user: userId, checkoutLockKey: idempotencyKey },
    { $unset: { checkoutLockKey: 1, checkoutLockExpiresAt: 1 } },
  ).exec();
}

export function assertCartWritable(cart: CartRecord): void {
  if (
    cart.checkoutLockExpiresAt &&
    cart.checkoutLockExpiresAt.getTime() > Date.now()
  ) {
    throw new ApiError(
      "Your cart is reserved while checkout is being processed. Try again shortly.",
      409,
    );
  }
}
