import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { safeNextPath } from "@/lib/auth/redirect";
import {
  addressSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";

async function main(): Promise<void> {
  const password = "CorrectHorse7!";
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("incorrect", hash), false);

  const registration = {
    name: "Demo Customer",
    email: "customer@example.com",
    phone: "+91 98765 43210",
    password,
    confirmPassword: password,
  };
  assert.equal(registerSchema.safeParse(registration).success, true);
  assert.equal(
    registerSchema.safeParse({ ...registration, confirmPassword: "different" })
      .success,
    false,
  );

  const address = {
    recipientName: "Demo Customer",
    phone: "+91 98765 43210",
    line1: "12 Demo Road",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411001",
  };
  assert.equal(addressSchema.safeParse(address).success, true);
  assert.equal(
    addressSchema.safeParse({ ...address, postalCode: "011001" }).success,
    false,
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      token: "a".repeat(43),
      password,
      confirmPassword: password,
    }).success,
    true,
  );

  assert.equal(safeNextPath("/account/orders"), "/account/orders");
  assert.equal(safeNextPath("//attacker.example"), "/account");
  assert.equal(safeNextPath("https://attacker.example"), "/account");

  console.info(
    "Verified password hashing, auth/address validation, and redirect safety.",
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
