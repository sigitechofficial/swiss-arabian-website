import type { MessageKey, Translator } from "@/lib/i18n/messages";
import { pageTranslator } from "@/lib/i18n/pageTranslator";

/**
 * Cart validation codes → shopper-facing copy (message keys, page language).
 * Mirrors the "Validation Issues" tables in the cart integration guide.
 */

const ERROR_MESSAGES: Record<string, MessageKey> = {
  PRODUCT_NOT_VISIBLE: "cart.issue.PRODUCT_NOT_VISIBLE",
  PRODUCT_NOT_SELLABLE: "cart.unavailable.UNAVAILABLE",
  VARIANT_INACTIVE: "cart.unavailable.UNAVAILABLE",
  PRICE_MISSING: "cart.unavailable.UNAVAILABLE",
  INVENTORY_MISSING: "cart.unavailable.OUT_OF_STOCK",
  INSUFFICIENT_INVENTORY: "cart.issue.INSUFFICIENT_INVENTORY",
  CURRENCY_MISMATCH: "cart.issue.CURRENCY_MISMATCH",
  LEGAL_ENTITY_MISSING: "cart.issue.LEGAL_ENTITY_MISSING",
};

const WARNING_MESSAGES: Record<string, MessageKey> = {
  PRICE_CHANGED: "cart.issue.PRICE_CHANGED",
};

/** The shop's wording for a code it knows, else the server's sentence, else a plain fallback. */
export function cartErrorMessage(
  type: string,
  fallback?: string | null,
  t: Translator = pageTranslator(),
): string {
  const key = ERROR_MESSAGES[type];
  return key ? t(key) : fallback ?? t("cart.issue.fallback");
}

export function cartWarningMessage(
  type: string,
  fallback?: string | null,
  t: Translator = pageTranslator(),
): string {
  const key = WARNING_MESSAGES[type];
  return key ? t(key) : fallback ?? t("cart.issue.warningFallback");
}

/** Guide: show a banner when any item's price moved since it was added. */
export const PRICE_CHANGED = "PRICE_CHANGED";
