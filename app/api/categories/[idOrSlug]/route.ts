import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/route-guard";
import { isSameOriginRequest } from "@/lib/auth/origin";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { deactivateCategory, updateCategory } from "@/lib/categories/mutations";
import {
  findCategoryByKey,
  isObjectId,
  listCategories,
} from "@/lib/categories/service";
import { updateCategorySchema } from "@/lib/products/validation";

type RouteContext = { params: Promise<{ idOrSlug: string }> };

function validCategoryKey(value: string): boolean {
  return isObjectId(value) || /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value);
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { idOrSlug } = await params;
  if (!validCategoryKey(idOrSlug)) {
    return invalidInputResponse([
      { path: ["idOrSlug"], message: "Provide a valid category ID or slug." },
    ]);
  }

  try {
    const category = await findCategoryByKey(idOrSlug);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 },
      );
    }

    const allCategories = await listCategories();
    const children = allCategories.filter(
      (item) => item.parentCategoryId === category.id,
    );
    return NextResponse.json({
      data: { ...category.toObject(), children },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

async function update(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireAdminApi("categories:write");
  if (!auth.admin) return auth.response;

  const { idOrSlug } = await context.params;
  if (!validCategoryKey(idOrSlug)) {
    return invalidInputResponse([
      { path: ["idOrSlug"], message: "Provide a valid category ID or slug." },
    ]);
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = updateCategorySchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const category = await updateCategory(idOrSlug, parsed.data);
    return NextResponse.json({ data: category.toObject() });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  return update(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return update(request, context);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireAdminApi("categories:write");
  if (!auth.admin) return auth.response;

  const { idOrSlug } = await params;
  if (!validCategoryKey(idOrSlug)) {
    return invalidInputResponse([
      { path: ["idOrSlug"], message: "Provide a valid category ID or slug." },
    ]);
  }

  try {
    const category = await deactivateCategory(idOrSlug);
    return NextResponse.json({ data: category.toObject() });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
