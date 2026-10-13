import { productListResponse } from "@/lib/api/product-list";

export async function GET(request: Request) {
  return productListResponse(request, true);
}
