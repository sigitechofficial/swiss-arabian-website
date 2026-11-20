import { pageTranslator } from "@/lib/i18n/pageTranslator";
import { KeyedError } from "@/lib/i18n/keyedError";
import type { Translator } from "@/lib/i18n/messages";
import { ApiClientError, CLIENT_ERROR_CODES } from "./apiError";

/**
 * What a shopper reads when something fails — one rule for the whole shop:
 *
 * 1. Codes the shop words itself (in `src/messages/<locale>.json`): failures the
 *    shop reports (no server answer), and codes whose facts make a better
 *    sentence here (how many are in stock).
 * 2. Otherwise the server's sentence: on storefront routes it is already the
 *    shopper wording, in the page's language (`x-storefront-language`).
 * 3. Otherwise (no server sentence: offline, an HTML error page…) the caller's
 *    fallback, else a plain "something went wrong". Never raw or technical text.
 */
type ShopWording = (error: ApiClientError, t: Translator) => string;

const SHOP_WORDED_CODES: Record<string, ShopWording> = {
  [CLIENT_ERROR_CODES.unreachable]: (_, t) => t("error.unreachable"),
  [CLIENT_ERROR_CODES.sessionEnded]: (_, t) => t("error.sessionEnded"),
  [CLIENT_ERROR_CODES.unexpectedResponse]: (_, t) => t("error.generic"),
  CART_INSUFFICIENT_INVENTORY: (error, t) => insufficientStockMessage(error.data, t),
};

function readCount(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return value != null && value !== "" && Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
}

/** "Only 6 available" — the bag asked for more than is in stock. */
export function insufficientStockMessage(data: unknown, t: Translator = pageTranslator()): string {
  const facts = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const available = readCount(facts.availableQty);
  const inBag = readCount(facts.inBagQty);
  if (available == null) return t("error.stock.notEnough");
  if (available === 0) return t("error.stock.outOfStock");
  if (inBag != null && inBag >= available) return t("error.stock.allInBag", { count: available });
  return inBag
    ? t("error.stock.onlyWithBag", { count: available, inBag })
    : t("error.stock.only", { count: available });
}

/** The browser could not reach the server at all (fetch rejects with a TypeError). */
function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && /failed to fetch|network|load failed/i.test(error.message));
}

/**
 * The failure's own sentence (the shop's wording of its code, else the
 * server's), or null when it has none and the caller's words fit better.
 */
export function knownErrorMessage(error: unknown, t: Translator = pageTranslator()): string | null {
  // A rule the browser checked itself: its own message key.
  if (error instanceof KeyedError) return error.translate(t);
  if (error instanceof ApiClientError) {
    const own = error.code ? SHOP_WORDED_CODES[error.code] : undefined;
    if (own) return own(error, t);
    return error.serverMessage ?? null;
  }
  return isNetworkFailure(error) ? t("error.unreachable") : null;
}

/**
 * The sentence to show for a failure, in the page's language. `fallback` is
 * the caller's own words for "this action failed" (already translated).
 */
export function getUserFacingErrorMessage(
  error: unknown,
  fallback?: string | null,
  t: Translator = pageTranslator(),
): string {
  return knownErrorMessage(error, t) ?? (fallback?.trim() || t("error.generic"));
}
