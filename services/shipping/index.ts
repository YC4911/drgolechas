import { manualShippingProvider } from "@/services/shipping/manual";
import type {
  ShippingProvider,
  ShippingRateSettings,
} from "@/services/shipping/types";

export * from "@/services/shipping/types";

export function calculateShippingCharge(
  subtotal: number,
  settings: ShippingRateSettings,
  provider: ShippingProvider = manualShippingProvider,
): number {
  return provider.quote(subtotal, settings);
}
