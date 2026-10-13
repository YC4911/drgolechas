import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiErrorResponse,
  invalidInputResponse,
  readJsonBody,
} from "@/lib/api/errors";
import { isSameOriginRequest } from "@/lib/auth/origin";
import { getCartOwner, getOrCreateCart } from "@/lib/cart/context";
import {
  addCartItem,
  buildCartSnapshot,
  removeCartItem,
  setCartItemQuantity,
} from "@/lib/cart/service";
import {
  addCartItemSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/lib/cart/validation";

export async function GET() {
  try {
    const owner = await getCartOwner();
    if (!owner) return NextResponse.json({ data: null });
    const cart = await getOrCreateCart(owner);
    return NextResponse.json({ data: await buildCartSnapshot(cart, owner) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

async function readMutation<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<
  | { data: z.output<Schema>; response?: never }
  | { data?: never; response: NextResponse }
> {
  if (!isSameOriginRequest(request)) {
    return { response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  const body = await readJsonBody(request);
  if (!body.ok) return { response: body.response };
  const parsed = schema.safeParse(body.body);
  if (!parsed.success) {
    return { response: invalidInputResponse(parsed.error.issues) };
  }
  return { data: parsed.data };
}

export async function POST(request: Request) {
  const parsed = await readMutation(request, addCartItemSchema);
  if (!parsed.data) return parsed.response;

  try {
    const owner = await getCartOwner();
    if (!owner) throw new Error("Could not establish a cart owner.");
    const cart = await getOrCreateCart(owner);
    await addCartItem(
      cart,
      parsed.data.productId,
      parsed.data.variantSku,
      parsed.data.quantity,
    );
    return NextResponse.json({ data: await buildCartSnapshot(cart, owner) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const parsed = await readMutation(request, updateCartItemSchema);
  if (!parsed.data) return parsed.response;

  try {
    const owner = await getCartOwner(false);
    if (!owner) return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    const cart = await getOrCreateCart(owner);
    await setCartItemQuantity(
      cart,
      parsed.data.productId,
      parsed.data.variantSku,
      parsed.data.quantity,
    );
    return NextResponse.json({ data: await buildCartSnapshot(cart, owner) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const parsed = await readMutation(request, removeCartItemSchema);
  if (!parsed.data) return parsed.response;

  try {
    const owner = await getCartOwner(false);
    if (!owner) return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    const cart = await getOrCreateCart(owner);
    await removeCartItem(cart, parsed.data.productId, parsed.data.variantSku);
    return NextResponse.json({ data: await buildCartSnapshot(cart, owner) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}