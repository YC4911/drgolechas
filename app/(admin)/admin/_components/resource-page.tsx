import { AdminResourceConsole } from "@/components/admin/admin-resource-console";
import { requireAdminPage, type AdminPermission } from "@/lib/admin/auth";
import type { AdminResource } from "@/lib/admin/validation";

const readPermissions: Record<AdminResource, AdminPermission> = {
  products: "products:read",
  categories: "categories:read",
  orders: "orders:read",
  customers: "customers:read",
  reviews: "reviews:read",
  coupons: "coupons:read",
  testimonials: "testimonials:read",
  social: "social:read",
  settings: "settings:read",
};

export async function AdminResourcePage({
  resource,
  recordId,
  createMode,
}: {
  resource: AdminResource;
  recordId?: string;
  createMode?: boolean;
}) {
  let admin = await requireAdminPage(
    createMode
      ? (`${resource}:write` as AdminPermission)
      : readPermissions[resource],
  );
  if (resource === "products" && recordId) {
    admin = await requireAdminPage("products:write");
  }
  return (
    <AdminResourceConsole
      resource={resource}
      recordId={recordId}
      createMode={createMode}
      canWrite={admin.permissions.includes(
        `${resource}:write` as AdminPermission,
      )}
    />
  );
}
