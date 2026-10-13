import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/route-guard";
import { adminUploadSchema } from "@/lib/admin/validation";
import { saveAdminImage } from "@/lib/admin/uploads";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { apiErrorResponse } from "@/lib/api/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const purpose = adminUploadSchema.safeParse(
    request.headers.get("x-admin-upload-purpose"),
  );
  if (!purpose.success) {
    return NextResponse.json(
      { error: "Choose a valid image destination." },
      { status: 400 },
    );
  }
  const permission =
    purpose.data === "products"
      ? "products:write"
      : purpose.data === "categories"
        ? "categories:write"
        : "settings:write";
  const auth = await requireAdminApi(permission);
  if (!auth.admin) return auth.response;
  const rawLength = request.headers.get("content-length");
  const length = rawLength === null ? 0 : Number(rawLength);
  if (!Number.isFinite(length) || length > 5 * 1024 * 1024 + 64 * 1024) {
    return NextResponse.json(
      { error: "Image upload exceeds 5 MB." },
      { status: 413 },
    );
  }
  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Choose an image to upload." },
        { status: 400 },
      );
    }
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image upload exceeds 5 MB." },
        { status: 413 },
      );
    }
    const saved = await saveAdminImage(image);
    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
