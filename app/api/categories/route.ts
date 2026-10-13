import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/route-guard";
import { isSameOriginRequest } from "@/lib/auth/origin";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { createCategory } from "@/lib/categories/mutations";
import { listCategories, nestCategories } from "@/lib/categories/service";
import { createCategorySchema } from "@/lib/products/validation";

const listQuerySchema = z
  .object({ tree: z.enum(["true", "false"]).default("false") })
  .strict();

export async function GET(request: Request) {
  const parsed = listQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const categories = await listCategories();
    return NextResponse.json({
      data:
        parsed.data.tree === "true" ? nestCategories(categories) : categories,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireAdminApi("categories:write");
  if (!auth.admin) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = createCategorySchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const category = await createCategory(parsed.data);
    return NextResponse.json({ data: category.toObject() }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
