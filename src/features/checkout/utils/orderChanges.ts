import type {
  CheckoutItemSummary,
  CheckoutSessionResponse,
} from "../types/checkout";
import type { PromotionApplied } from "@/features/promotions/types/promotions";

/**
 * What changed between the checkout the shopper saw and the one the server
 * re-quoted when they placed the order (checkout QA-048): an offer ended, a
 * price changed, an item went out of stock. Shown in the "Your order has
 * changed" step so they agree to the new order before anything is charged.
 */
export type OrderChanges = {
  /** Items no longer in the order (out of stock / unavailable). */
  removed: { sku: string; name: string }[];
  /** Items whose unit price changed. */
  repriced: { sku: string; name: string; from: number; to: number }[];
  /** Offers that no longer apply / now apply (labels as the shopper sees them). */
  offersEnded: string[];
  offersAdded: string[];
  total: { from: number; to: number };
  /** Amount left to pay after gift cards and points; null when not shown. */
  amountPayable: { from: number; to: number } | null;
  currency: string;
  /** Nothing in the bag can be ordered right now. */
  nothingOrderable: boolean;
};

type Quote = Pick<CheckoutSessionResponse, "items" | "totalsEstimate" | "currency"> & {
  promotions?: CheckoutSessionResponse["promotions"];
  promotionSnapshot?: CheckoutSessionResponse["promotionSnapshot"];
};

const money = (value: string | null | undefined): number => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const offerLabel = (offer: PromotionApplied): string =>
  (offer.label || offer.code || "").trim();

function appliedOffers(quote: Quote | null): string[] {
  const snapshot = quote?.promotions ?? quote?.promotionSnapshot ?? null;
  return (snapshot?.applied ?? [])
    .filter((offer) => offer.kind !== "GIFT_CARD")
    .map(offerLabel)
    .filter(Boolean);
}

function bySku(items: CheckoutItemSummary[] | null | undefined) {
  const map = new Map<string, CheckoutItemSummary>();
  for (const item of items ?? []) {
    if (item.sku) map.set(item.sku, item);
  }
  return map;
}

/**
 * @param before the checkout the shopper was looking at
 * @param after the re-quoted checkout, or null when nothing can be ordered
 * @param nameOf the item name the shopper knows (from the bag)
 */
export function describeOrderChanges(
  before: Quote,
  after: Quote | null,
  nameOf: (sku: string) => string,
): OrderChanges {
  const was = bySku(before.items);
  const now = bySku(after?.items);
  const removed: OrderChanges["removed"] = [];
  const repriced: OrderChanges["repriced"] = [];
  for (const [sku, item] of was) {
    const next = now.get(sku);
    if (!next) {
      removed.push({ sku, name: nameOf(sku) });
      continue;
    }
    const from = money(item.unitPriceEstimate);
    const to = money(next.unitPriceEstimate);
    if (from > 0 && to > 0 && from !== to) {
      repriced.push({ sku, name: nameOf(sku), from, to });
    }
  }
  const offersBefore = appliedOffers(before);
  const offersAfter = appliedOffers(after);
  const payableFrom = before.totalsEstimate?.amountPayable;
  const payableTo = after?.totalsEstimate?.amountPayable;
  const totalFrom = money(before.totalsEstimate?.total);
  const totalTo = after ? money(after.totalsEstimate?.total) : 0;
  return {
    removed,
    repriced,
    offersEnded: offersBefore.filter((label) => !offersAfter.includes(label)),
    offersAdded: offersAfter.filter((label) => !offersBefore.includes(label)),
    total: { from: totalFrom, to: totalTo },
    amountPayable:
      payableFrom != null && payableTo != null && money(payableTo) !== totalTo
        ? { from: money(payableFrom), to: money(payableTo) }
        : null,
    currency: after?.currency || before.currency || "AED",
    nothingOrderable: after == null || now.size === 0,
  };
}
