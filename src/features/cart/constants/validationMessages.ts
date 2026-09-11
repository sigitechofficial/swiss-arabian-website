/**
 * Cart validation codes → shopper-facing copy.
 * Mirrors the "Validation Issues" tables in the cart integration guide.
 */

const ERROR_MESSAGES: Record<string, string> = {
  PRODUCT_NOT_VISIBLE: "Unavailable in your market",
  PRODUCT_NOT_SELLABLE: "Unavailable",
  VARIANT_INACTIVE: "Unavailable",
  PRICE_MISSING: "Price unavailable",
  INVENTORY_MISSING: "Out of stock",
  INSUFFICIENT_INVENTORY: "Not enough stock left",
  CURRENCY_MISMATCH: "Prices changed — refresh your bag",
  LEGAL_ENTITY_MISSING: "Temporarily unavailable — please contact support",
};

const WARNING_MESSAGES: Record<string, string> = {
  PRICE_CHANGED: "Price updated",
};

export function cartErrorMessage(type: string, fallback?: string | null): string {
  return ERROR_MESSAGES[type] ?? fallback ?? "This item can’t be ordered right now";
}

export function cartWarningMessage(
  type: string,
  fallback?: string | null,
): string {
  return WARNING_MESSAGES[type] ?? fallback ?? "This item was updated";
}

/** Guide: show a banner when any item's price moved since it was added. */
export const PRICE_CHANGED = "PRICE_CHANGED";
