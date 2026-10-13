import { Types, type HydratedDocument } from "mongoose";
import { ApiError } from "@/lib/api/errors";
import { validateCouponForCart } from "@/lib/cart/coupons";
import { assertCartWritable } from "@/lib/checkout/cart-lock";
import type { CartOwner } from "@/lib/cart/context";
import { calculateCartTotals } from "@/lib/cart/totals";
import type { CartRecord } from "@/models/cart";
import { InventoryModel } from "@/models/inventory";
import {
  ProductModel,
  type ProductRecord,
  type ProductVariant,
} from "@/models/product";
import { SiteSettingsModel } from "@/models/site-settings";
import type { CartLineView, CartSnapshot } from "@/types/cart";

type LeanProduct = ProductRecord & { _id: Types.ObjectId };
type CartDocument = HydratedDocument<CartRecord>;
type LeanInventory = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  reserved: number;
};

interface InternalLine {
  view: CartLineView;
  productId: string;
  categoryId: string;
  subcategoryId: string | null;
  couponKey: string;
  validForTotals: boolean;
}

function findVariant(
  product: LeanProduct,
  variantSku?: string,
): ProductVariant | null {
  if (!variantSku) return product.variants.length === 0 ? null : null;
  return (
    product.variants.find(
      (variant) => variant.sku.toUpperCase() === variantSku.toUpperCase(),
    ) ?? null
  );
}

async function buildInternalLines(cart: CartRecord): Promise<InternalLine[]> {
  const productIds = cart.items.map((item) => item.product);
  if (productIds.length === 0) return [];

  const [products, inventories, settings] = await Promise.all([
    ProductModel.find({ _id: { $in: productIds } })
      .lean()
      .exec(),
    InventoryModel.find({ product: { $in: productIds } })
      .select("product quantity reserved")
      .lean()
      .exec(),
    SiteSettingsModel.findOne({ key: "store" })
      .select("shippingSettings taxSettings")
      .lean()
      .exec(),
  ]);

  const productMap = new Map<string, LeanProduct>(
    products.map((product) => [product._id.toString(), product]),
  );
  const inventoryMap = new Map<string, LeanInventory>(
    inventories.map((inventory) => [inventory.product.toString(), inventory]),
  );

  return cart.items.map((item) => {
    const productId = item.product.toString();
    const product = productMap.get(productId);
    const variantSku = item.variantSku?.toUpperCase();
    const key = `${productId}:${variantSku ?? ""}`;

    if (
      !product ||
      !product.active ||
      (product.publicationStatus ?? "published") !== "published" ||
      product.priceApproved === false ||
      product.productDetailsVerified === false
    ) {
      return {
        productId,
        categoryId: "",
        subcategoryId: null,
        couponKey: key,
        validForTotals: false,
        view: {
          key,
          productId,
          slug: "",
          name: "Unavailable product",
          sku: "",
          image: "",
          imageAlt: "",
          variantSku: variantSku ?? null,
          variantName: null,
          quantity: item.quantity,
          available: 0,
          unitPrice: 0,
          mrp: 0,
          gstRate: 0,
          lineSubtotal: 0,
          lineDiscount: 0,
          status: "unavailable" as const,
        },
      };
    }

    const variant = findVariant(product, variantSku);
    const inventory = inventoryMap.get(productId);
    const inventoryStock = inventory
      ? Math.max(0, inventory.quantity - inventory.reserved)
      : product.stock;
    const available = variant
      ? Math.min(variant.stock, inventory ? inventoryStock : variant.stock)
      : inventoryStock;
    const hasRequiredVariant =
      product.variants.length === 0 ? !variantSku : variant !== null;
    if (variant?.priceApproved === false) {
      return {
        productId,
        categoryId: "",
        subcategoryId: null,
        couponKey: key,
        validForTotals: false,
        view: {
          key,
          productId,
          slug: product.slug,
          name: product.name,
          sku: variant.sku,
          image: product.thumbnail,
          imageAlt: product.images[0]?.alt || product.name,
          variantSku: variant.sku,
          variantName: variant.name,
          quantity: item.quantity,
          available: 0,
          unitPrice: 0,
          mrp: 0,
          gstRate: 0,
          lineSubtotal: 0,
          lineDiscount: 0,
          status: "unavailable" as const,
        },
      };
    }
    const unitPrice = variant?.price ?? product.price;
    const mrp = variant?.mrp ?? product.mrp;
    const status = !hasRequiredVariant
      ? "unavailable"
      : available < item.quantity
        ? "out-of-stock"
        : "available";
    const gstRate = product.gst || settings?.taxSettings?.defaultGst || 0;

    return {
      productId,
      categoryId: product.category.toString(),
      subcategoryId: product.subcategory?.toString() ?? null,
      couponKey: key,
      validForTotals: status === "available",
      view: {
        key,
        productId,
        slug: product.slug,
        name: product.name,
        sku: variant?.sku ?? product.sku,
        image: variant ? product.thumbnail : product.thumbnail,
        imageAlt: product.images[0]?.alt || product.name,
        variantSku: variant?.sku ?? null,
        variantName: variant?.name ?? null,
        quantity: item.quantity,
        available,
        unitPrice,
        mrp,
        gstRate,
        lineSubtotal: unitPrice * item.quantity,
        lineDiscount: Math.max(0, mrp - unitPrice) * item.quantity,
        status,
      },
    };
  });
}

export async function buildCartSnapshot(
  cart: CartDocument,
  owner: CartOwner,
  couponOverride = cart.couponCode,
): Promise<CartSnapshot> {
  const internalLines = await buildInternalLines(cart);
  const validLines = internalLines.filter((line) => line.validForTotals);
  let couponDiscount = 0;
  let couponError: string | null = null;
  let eligibleLineKeys: string[] = [];

  if (couponOverride) {
    try {
      const coupon = await validateCouponForCart(
        couponOverride,
        validLines.map((line) => ({
          productId: line.productId,
          categoryId: line.categoryId,
          subcategoryId: line.subcategoryId,
          variantSku: line.view.variantSku ?? undefined,
          lineSubtotal: line.view.lineSubtotal,
        })),
        owner.kind === "user" ? owner.userId : undefined,
      );
      couponDiscount = coupon.discount;
      eligibleLineKeys = coupon.eligibleLineKeys;
    } catch (error) {
      couponError =
        error instanceof Error ? error.message : "Coupon is not valid.";
    }
  }

  const settings = await SiteSettingsModel.findOne({ key: "store" })
    .select("shippingSettings taxSettings")
    .lean()
    .exec();
  const shippingSettings = settings?.shippingSettings;
  const totals = calculateCartTotals(
    validLines.map((line) => ({
      quantity: line.view.quantity,
      unitPrice: line.view.unitPrice,
      mrp: line.view.mrp,
      gstRate: line.view.gstRate,
      couponEligible: eligibleLineKeys.includes(line.couponKey),
    })),
    couponDiscount,
    {
      flatShipping: shippingSettings?.flatRate ?? 0,
      freeShippingThreshold: shippingSettings?.freeShippingThreshold ?? 0,
      pricesIncludeGst: settings?.taxSettings?.pricesIncludeGst ?? false,
    },
  );

  return {
    items: internalLines.map((line) => line.view),
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    couponCode: couponOverride ?? null,
    couponError,
    totals,
    canCheckout:
      cart.items.length > 0 &&
      internalLines.every((line) => line.validForTotals) &&
      couponError === null,
  };
}

export async function addCartItem(
  cart: CartDocument,
  productId: string,
  variantSku: string | undefined,
  quantity: number,
): Promise<void> {
  assertCartWritable(cart);
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError("Invalid product.", 400);
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new ApiError("Quantity must be between 1 and 99.", 400);
  }

  const product = await ProductModel.findOne({ _id: productId, active: true })
    .lean()
    .exec();
  if (!product) throw new ApiError("Product is unavailable.", 404);
  if (
    (product.publicationStatus ?? "published") !== "published" ||
    product.priceApproved === false ||
    product.productDetailsVerified === false
  ) {
    throw new ApiError("This product is not approved for sale.", 409);
  }

  const variant = product.variants.find(
    (item) => item.sku.toUpperCase() === variantSku?.toUpperCase(),
  );
  if (product.variants.length > 0 && !variant) {
    throw new ApiError("Select an available product variant.", 422);
  }
  if (variant?.priceApproved === false) {
    throw new ApiError("This product variant is not approved for sale.", 409);
  }

  const inventory = await InventoryModel.findOne({ product: product._id })
    .select("quantity reserved")
    .lean()
    .exec();
  const available = variant
    ? Math.min(
        variant.stock,
        inventory
          ? Math.max(0, inventory.quantity - inventory.reserved)
          : variant.stock,
      )
    : inventory
      ? Math.max(0, inventory.quantity - inventory.reserved)
      : product.stock;

  const existing = cart.items.find(
    (item) =>
      item.product.equals(product._id) &&
      (item.variantSku ?? "") === (variant?.sku ?? ""),
  );
  const nextQuantity = quantity + (existing?.quantity ?? 0);
  if (available < nextQuantity) {
    throw new ApiError("Requested quantity is not currently available.", 409);
  }

  if (existing) existing.quantity = nextQuantity;
  else {
    cart.items.push({
      product: product._id,
      variantSku: variant?.sku,
      quantity,
    });
  }
  cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await cart.save();
}

export async function setCartItemQuantity(
  cart: CartDocument,
  productId: string,
  variantSku: string | undefined,
  quantity: number,
): Promise<void> {
  assertCartWritable(cart);
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError("Invalid product.", 400);
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new ApiError("Quantity must be between 1 and 99.", 400);
  }

  const item = cart.items.find(
    (line) =>
      line.product.toString() === productId &&
      (line.variantSku ?? "") === (variantSku ?? ""),
  );
  if (!item) throw new ApiError("Cart item not found.", 404);

  const owner: CartOwner = cart.user
    ? {
        kind: "user",
        userId: cart.user.toString(),
        filter: { user: cart.user.toString() },
      }
    : {
        kind: "guest",
        tokenHash: cart.guestTokenHash ?? "",
        filter: { guestTokenHash: cart.guestTokenHash ?? "" },
      };
  const snapshot = await buildCartSnapshot(cart, owner);
  const view = snapshot.items.find(
    (line) => line.key === `${productId}:${variantSku ?? ""}`,
  );
  if (!view || view.status === "unavailable") {
    throw new ApiError("Product is unavailable.", 409);
  }
  if (quantity > view.available) {
    throw new ApiError("Requested quantity is not currently available.", 409);
  }

  item.quantity = quantity;
  await cart.save();
}

export async function removeCartItem(
  cart: CartDocument,
  productId: string,
  variantSku: string | undefined,
): Promise<void> {
  assertCartWritable(cart);
  if (!Types.ObjectId.isValid(productId)) {
    throw new ApiError("Invalid product.", 400);
  }
  cart.items = cart.items.filter(
    (item) =>
      !(
        item.product.toString() === productId &&
        (item.variantSku ?? "") === (variantSku ?? "")
      ),
  );
  await cart.save();
}

export async function applyCartCoupon(
  cart: CartDocument,
  owner: CartOwner,
  code: string,
): Promise<CartSnapshot> {
  assertCartWritable(cart);
  const snapshot = await buildCartSnapshot(
    cart,
    owner,
    code.trim().toUpperCase(),
  );
  if (snapshot.couponError) throw new ApiError(snapshot.couponError, 422);
  cart.couponCode = code.trim().toUpperCase();
  await cart.save();
  return snapshot;
}

export async function removeCartCoupon(cart: CartDocument): Promise<void> {
  assertCartWritable(cart);
  cart.couponCode = undefined;
  await cart.save();
}
