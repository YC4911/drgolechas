import { z } from "zod";
import { addressSchema } from "@/lib/auth/validation";

export const checkoutSchema = z
  .object({
    paymentMethod: z.enum(["cod", "razorpay"]),
    addressId: z
      .string()
      .regex(/^[\da-f]{24}$/i)
      .optional(),
    newAddress: addressSchema.optional(),
    saveAddress: z.boolean().default(false),
  })
  .strict()
  .refine((input) => Boolean(input.addressId) !== Boolean(input.newAddress), {
    message: "Choose a saved address or enter a new address.",
    path: ["addressId"],
  });

export const idempotencyKeySchema = z.string().uuid();

export const razorpayVerificationSchema = z
  .object({
    razorpay_order_id: z.string().min(1).max(100),
    razorpay_payment_id: z.string().min(1).max(100),
    razorpay_signature: z.string().regex(/^[\da-f]{64}$/i),
  })
  .strict();
