export type Product = {
  id: string;
  name: string;
  sku?: string;
  category: string;
  image: string;
  imageAlt: string;
  rating: number;
  reviewCount: number;
  mrp: number;
  sellingPrice: number;
  stock?: number;
  priceApproved?: boolean;
  availableForSale?: boolean;
  publicationStatus?: string;
  cartEnabled?: boolean;
  variants?: Array<{
    name: string;
    sku: string;
    price: number;
    mrp: number;
    stock: number;
    packQuantity?: number;
    packUnit?: string;
    priceApproved?: boolean;
  }>;
  badge?: string;
};
