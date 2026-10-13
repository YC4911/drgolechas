import { NextResponse } from "next/server";
import {
  type AdminPermission,
  getCurrentAdmin,
} from "@/lib/admin/auth";
import { apiErrorResponse } from "@/lib/api/errors";

export async function requireAdminApi(
  permission: AdminPermission,
): Promise<
  | { admin: NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>; response?: never }
  | { admin?: never; response: NextResponse }
> {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return {
        response: NextResponse.json(
          { error: "Admin authentication required." },
          { status: 401 },
        ),
      };
    }
    if (!admin.permissions.includes(permission)) {
      return {
        response: NextResponse.json(
          { error: "You do not have permission to perform this action." },
          { status: 403 },
        ),
      };
    }
    return { admin };
  } catch (error) {
    return { response: apiErrorResponse(error) };
  }
}
