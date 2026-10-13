import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { hashPassword } from "@/lib/auth/password";
import { AdminModel, type AdminRole } from "@/models/admin";
import type { AdminPermission } from "@/lib/admin/auth";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { UserModel } from "@/models/user";

const roles = new Set<AdminRole>(["superadmin", "admin", "staff"]);

async function createAdmin(): Promise<void> {
  const name = process.env.ADMIN_NAME?.trim() ?? "";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const roleValue = process.env.ADMIN_ROLE?.trim() ?? "superadmin";
  const requestedPermissions = (process.env.ADMIN_PERMISSIONS ?? "")
    .split(",")
    .map((permission) => permission.trim())
    .filter(Boolean);
  if (name.length < 2 || name.length > 120) {
    throw new Error("Set ADMIN_NAME to a name between 2 and 120 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Set ADMIN_EMAIL to a valid email address.");
  }
  if (
    password.length < 12 ||
    password.length > 128 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new Error(
      "ADMIN_PASSWORD must be 12–128 characters with lowercase, uppercase, numeric, and symbol characters.",
    );
  }
  if (!roles.has(roleValue as AdminRole)) {
    throw new Error("ADMIN_ROLE must be superadmin, admin, or staff.");
  }
  const role = roleValue as AdminRole;
  if (
    requestedPermissions.some(
      (permission) =>
        !ADMIN_PERMISSIONS.includes(permission as AdminPermission),
    )
  ) {
    throw new Error("ADMIN_PERMISSIONS contains an unknown admin permission.");
  }
  const permissions = requestedPermissions as AdminPermission[];
  if (role === "staff" && permissions.length === 0) {
    throw new Error(
      "Set ADMIN_PERMISSIONS to grant staff at least one permission.",
    );
  }

  await connectToDatabase();
  try {
    if (
      (await UserModel.exists({ email })) ||
      (await AdminModel.exists({ email }))
    ) {
      throw new Error(
        "An account with this email already exists; no changes were made.",
      );
    }

    const user = await UserModel.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      active: true,
    });
    try {
      await AdminModel.create({
        user: user._id,
        email,
        role,
        active: true,
        permissions,
      });
    } catch (error) {
      await UserModel.deleteOne({ _id: user._id }).exec();
      throw error;
    }
    console.info(`Created ${role} account for ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Admin account creation failed.",
  );
  process.exitCode = 1;
});
