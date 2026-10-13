export interface ShippingRateSettings {
  flatRate: number;
  freeShippingThreshold: number;
}

export interface ShippingProvider {
  quote(subtotal: number, settings: ShippingRateSettings): number;
}
