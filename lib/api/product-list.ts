import { NextResponse } from "next/server";
import { apiErrorResponse, invalidInputResponse } from "@/lib/api/errors";
import { listProducts } from "@/lib/products/service";
import { parseProductFilters } from "@/lib/products/validation";

export async function productListResponse(
  request: Request,
  requireSearch = false,
): Promise<NextResponse> {
  const url = new URL(request.url);
  if (requireSearch && !url.searchParams.get("q")?.trim()) {
    return NextResponse.json(
      { error: "A non-empty q search parameter is required." },
      { status: 400 },
    );
  }

  const parsed = parseProductFilters(url.searchParams);
  if (!parsed.success) return invalidInputResponse(parsed.error.issues);

  try {
    return NextResponse.json(await listProducts(parsed.data));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
