import { z } from "zod";

const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const password = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");
const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine(
    (value) => /^(?:\+91)?[6-9][0-9]{9}$/.test(value),
    "Enter a valid Indian phone number.",
  );

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email,
    phone,
    password,
    confirmPassword: z.string().max(128),
  })
  .strict()
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z
  .object({ email, password: z.string().min(1).max(128) })
  .strict();

export const forgotPasswordSchema = z.object({ email }).strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32).max(256),
    password,
    confirmPassword: z.string().max(128),
  })
  .strict()
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: email.optional(),
    phone: phone.optional(),
    currentPassword: z.string().min(1).max(128).optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (Object.keys(input).length === 0) {
      context.addIssue({
        code: "custom",
        message: "At least one profile field must be provided.",
      });
    }
    if (input.email && !input.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Confirm your current password to change your email.",
      });
    }
    if (input.currentPassword && !input.email) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "A current password is only needed when changing your email.",
      });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    password,
    confirmPassword: z.string().max(128),
  })
  .strict()
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const addressSchema = z
  .object({
    label: z.string().trim().min(1).max(40).default("Home"),
    recipientName: z.string().trim().min(2).max(120),
    phone,
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional(),
    landmark: z.string().trim().max(120).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    postalCode: z
      .string()
      .trim()
      .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code."),
    country: z.literal("India").default("India"),
    isDefault: z.boolean().default(false),
  })
  .strict();

export const updateAddressSchema = addressSchema
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one address field must be provided.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
