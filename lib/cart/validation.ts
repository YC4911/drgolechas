import { z } from "zod";

const cartLineFields = {
  productId: z.string().regex(/^[\da-f]{24}$/i),
  variantSku: z.string().trim().min(1).max(80).optional(),
};

export const addCartItemSchema = z
  .object({
    ...cartLineFields,
    quantity: z.number().int().min(1).max(99).default(1),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    ...cartLineFields,
    quantity: z.number().int().min(1).max(99),
  })
  .strict();

export const removeCartItemSchema = z.object(cartLineFields).strict();

export const applyCouponSchema = z
  .object({ code: z.string().trim().min(1).max(64) })
  .strict();