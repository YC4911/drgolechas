import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/route-guard";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { productListResponse } from "@/lib/api/product-list";
import { createProduct } from "@/lib/products/mutations";
import { createProductSchema } from "@/lib/products/validation";
import { isSameOriginRequest } from "@/lib/auth/origin";

export async function GET(request: Request) {
  return productListResponse(request);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const auth = await requireAdminApi("products:write");
  if (!auth.admin) return auth.response;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = createProductSchema.safeParse(body.body);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    const product = await createProduct(parsed.data);
    return NextResponse.json(
      { data: product.toObject({ flattenMaps: true }) },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
