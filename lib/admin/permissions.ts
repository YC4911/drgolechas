import type { AdminPermission, AdminRole } from "@/lib/admin/auth";

export const ADMIN_PERMISSIONS = [
  "dashboard:read",
  "products:read",
  "products:write",
  "categories:read",
  "categories:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "customers:write",
  "reviews:read",
  "reviews:write",
  "coupons:read",
  "coupons:write",
  "testimonials:read",
  "testimonials:write",
  "social:read",
  "social:write",
  "settings:read",
  "settings:write",
] as const satisfies readonly AdminPermission[];

export function resolveAdminPermissions(
  role: AdminRole,
  requested: readonly string[],
): AdminPermission[] {
  if (role === "superadmin") return [...ADMIN_PERMISSIONS];
  if (requested.length > 0) {
    return requested.filter((permission): permission is AdminPermission =>
      ADMIN_PERMISSIONS.includes(permission as AdminPermission),
    );
  }
  return role === "admin" ? [...ADMIN_PERMISSIONS] : [];
}
