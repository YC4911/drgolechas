export interface CartLineView {
  key: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string;
  imageAlt: string;
  variantSku: string | null;
  variantName: string | null;
  quantity: number;
  available: number;
  unitPrice: number;
  mrp: number;
  gstRate: number;
  lineSubtotal: number;
  lineDiscount: number;
  status: "available" | "out-of-stock" | "unavailable";
}

export interface CartSnapshot {
  items: CartLineView[];
  itemCount: number;
  couponCode: string | null;
  couponError: string | null;
  totals: {
    subtotal: number;
    discount: number;
    couponDiscount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  canCheckout: boolean;
}