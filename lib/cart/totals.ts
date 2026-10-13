import { calculateShippingCharge } from "@/services/shipping";

export interface PricedCartLine {
  quantity: number;
  unitPrice: number;
  mrp: number;
  gstRate: number;
  couponEligible: boolean;
}

export interface ShippingTaxSettings {
  flatShipping: number;
  freeShippingThreshold: number;
  pricesIncludeGst: boolean;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  couponDiscount: number;
  tax: number;
  shipping: number;
  total: number;
}

const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateCartTotals(
  lines: PricedCartLine[],
  couponDiscount: number,
  settings: ShippingTaxSettings,
): CartTotals {
  const subtotal = money(
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
  const discount = money(
    lines.reduce(
      (sum, line) =>
        sum + Math.max(0, line.mrp - line.unitPrice) * line.quantity,
      0,
    ),
  );
  const eligibleSubtotal = lines.reduce(
    (sum, line) =>
      sum + (line.couponEligible ? line.unitPrice * line.quantity : 0),
    0,
  );
  const appliedCoupon = money(
    Math.min(Math.max(0, couponDiscount), eligibleSubtotal, subtotal),
  );
  let allocatedCoupon = 0;
  const eligibleLines = lines.filter((line) => line.couponEligible);
  const tax = money(
    lines.reduce((sum, line) => {
      const lineSubtotal = line.unitPrice * line.quantity;
      const isLastEligible =
        line.couponEligible &&
        eligibleLines.indexOf(line) === eligibleLines.length - 1;
      const couponShare = !line.couponEligible
        ? 0
        : isLastEligible
          ? appliedCoupon - allocatedCoupon
          : eligibleSubtotal > 0
            ? money((appliedCoupon * lineSubtotal) / eligibleSubtotal)
            : 0;
      if (line.couponEligible) allocatedCoupon += couponShare;

      const taxable = Math.max(0, lineSubtotal - couponShare);
      const lineTax = settings.pricesIncludeGst
        ? (taxable * line.gstRate) / (100 + line.gstRate)
        : (taxable * line.gstRate) / 100;
      return sum + lineTax;
    }, 0),
  );
  const shipping = calculateShippingCharge(subtotal, {
    flatRate: settings.flatShipping,
    freeShippingThreshold: settings.freeShippingThreshold,
  });

  return {
    subtotal,
    discount,
    couponDiscount: appliedCoupon,
    tax,
    shipping,
    total: money(
      Math.max(
        0,
        subtotal -
          appliedCoupon +
          (settings.pricesIncludeGst ? 0 : tax) +
          shipping,
      ),
    ),
  };
}
