import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/lib/auth/session";
import { AdminModel } from "@/models/admin";
import { UserModel } from "@/models/user";
import { UserSessionModel } from "@/models/user-session";
import { resolveAdminPermissions } from "@/lib/admin/permissions";

export type AdminRole = "superadmin" | "admin" | "staff";
export type AdminPermission =
  | "dashboard:read"
  | "products:read"
  | "products:write"
  | "categories:read"
  | "categories:write"
  | "orders:read"
  | "orders:write"
  | "customers:read"
  | "customers:write"
  | "reviews:read"
  | "reviews:write"
  | "coupons:read"
  | "coupons:write"
  | "testimonials:read"
  | "testimonials:write"
  | "social:read"
  | "social:write"
  | "settings:read"
  | "settings:write";

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
}

export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token || token.length > 256) return null;

  await connectToDatabase();
  const session = await UserSessionModel.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  })
    .select("user")
    .lean()
    .exec();
  if (!session) return null;

  const user = await UserModel.findOne({
    _id: session.user,
    active: true,
    role: { $in: ["superadmin", "admin", "staff"] },
  })
    .select("name email role")
    .lean()
    .exec();
  if (!user) return null;

  const admin = await AdminModel.findOne({
    user: user._id,
    active: true,
  })
    .select("role permissions")
    .lean()
    .exec();
  if (!admin || admin.role !== user.role) return null;

  const role = user.role as AdminRole;
  const permissions = resolveAdminPermissions(role, admin.permissions);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role,
    permissions,
  };
}

export async function requireAdminPage(
  permission: AdminPermission,
): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin-login?next=%2Fadmin");
  if (!admin.permissions.includes(permission)) notFound();
  return admin;
}
