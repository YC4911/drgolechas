import type {
  ShippingProvider,
  ShippingRateSettings,
} from "@/services/shipping/types";

export const manualShippingProvider: ShippingProvider = {
  quote(subtotal: number, settings: ShippingRateSettings): number {
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error("Shipping subtotal must be a non-negative amount.");
    }
    if (
      !Number.isFinite(settings.flatRate) ||
      settings.flatRate < 0 ||
      !Number.isFinite(settings.freeShippingThreshold) ||
      settings.freeShippingThreshold < 0
    ) {
      throw new Error("Manual shipping settings contain an invalid amount.");
    }
    return subtotal === 0 || subtotal >= settings.freeShippingThreshold
      ? 0
      : Math.round((settings.flatRate + Number.EPSILON) * 100) / 100;
  },
};
