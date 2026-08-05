const pdp = "/assets/pdp" as const;

export const pdpAssets = {
  truck: `${pdp}/icon-truck.svg`,
  shield: `${pdp}/icon-shield.svg`,
  gift: `${pdp}/icon-gift.svg`,
} as const;

/** Static trust row chrome (not product-specific). */
export const PDP_TRUST = [
  { icon: pdpAssets.truck, label: "Free US Shipping" },
  { icon: pdpAssets.shield, label: "100% Authentic Product" },
  { icon: pdpAssets.gift, label: "Samples included" },
] as const;
