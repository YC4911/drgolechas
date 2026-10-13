import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { getProductBySlug } from "@/lib/products/service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);
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
