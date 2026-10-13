import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/route-guard";
import { isSameOriginRequest } from "@/lib/auth/origin";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { deactivateProduct, updateProduct } from "@/lib/products/mutations";
import { getProductById } from "@/lib/products/service";
import { updateProductSchema } from "@/lib/products/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: product });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

async function update(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireAdminApi("products:write");
  if (!auth.admin) return auth.response;

  const { id } = await context.params;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = updateProductSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const product = await updateProduct(id, parsed.data);
    return NextResponse.json({ data: product.toObject({ flattenMaps: true }) });
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
  const auth = await requireAdminApi("products:write");
  if (!auth.admin) return auth.response;
  const { id } = await params;

  try {
    const product = await deactivateProduct(id);
    return NextResponse.json({
      data: { id: product.id, active: product.active },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
