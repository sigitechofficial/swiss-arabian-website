"use client";

import { bundleTags } from "@/features/cart/utils/bundleTags";
import { showsDistinctSize } from "@/features/cart/utils/showsDistinctSize";
import { atStockLimit } from "@/features/cart/utils/stockLimit";
import type { GiftAwardView } from "@/features/promotions/hooks/useGiftAwards";
import type { PromotionSnapshotV1 } from "@/features/promotions";
import { lineMerchandiseDiscount, linePrices } from "@/features/promotions/utils/lineMerchandiseDiscount";
import type { CartLine } from "@/stores/useCartStore";
import type { SapilTranslator } from "../../i18n/SapilCopy";
import { DEFAULT_TILE, type SapilMoney } from "../commerce/shared";
import type { SapilBagGiftData, SapilBagLineData, SapilFreeDelivery } from "./SapilBagDrawerView";

/** Product page of a bag line (lines added before the slug is known stay unlinked). */
export function lineHref(line: Pick<CartLine, "slug">): string {
  return line.slug ? `/products/${encodeURIComponent(line.slug)}` : "#";
}

/** Line total after the quote's merchandise discount, and the full price when it was reduced. */
export function linePriceParts(
  line: CartLine,
  snapshot: PromotionSnapshotV1 | null | undefined,
  fallback?: PromotionSnapshotV1 | null,
) {
  const discount = lineMerchandiseDiscount(snapshot, line) || lineMerchandiseDiscount(fallback, line);
  return linePrices(line.unitPrice * line.quantity, discount);
}

/** Cart lines → the drawer / bag page rows. Every price comes from the cart API. */
export function toBagLineData(input: {
  lines: CartLine[];
  promotions: PromotionSnapshotV1 | null | undefined;
  bundleLabel: (line: CartLine) => string | null;
  money: SapilMoney;
  t: SapilTranslator;
}): SapilBagLineData[] {
  const { lines, promotions, bundleLabel, money, t } = input;
  return lines.map((line) => {
    const prices = linePriceParts(line, promotions);
    const unavailable = line.isSellable === false;
    const unit = money(line.unitPrice, line.currency);
    const each = line.quantity > 1 ? t("bag.each", { price: unit }) : unit;
    return {
      key: line.cartItemId ?? line.variantId,
      name: line.title,
      href: lineHref(line),
      imageSrc: line.imageUrl,
      detail: [showsDistinctSize(line.title, line.sizeLabel) ? line.sizeLabel : null, each].filter(Boolean).join(" · "),
      tile: DEFAULT_TILE,
      quantity: line.quantity,
      max: line.maxQuantity,
      unavailable,
      total: unavailable ? t("bag.unavailable") : money(prices.sale ?? prices.list, line.currency),
      was: !unavailable && prices.sale != null ? money(prices.list, line.currency) : undefined,
      tags: bundleTags(bundleLabel(line)),
      stockNote:
        atStockLimit(line) && line.maxQuantity != null
          ? t("bag.stockLimit", { count: line.maxQuantity })
          : undefined,
    };
  });
}

/** Free-gift awards → drawer gift rows. */
export function toBagGiftData(views: GiftAwardView[], money: SapilMoney): SapilBagGiftData[] {
  return views.map((view) => {
    if (view.kind === "notice") return view;
    if (view.kind === "choose") return { kind: "choose", key: view.key, onChoose: view.open };
    return {
      kind: "awarded",
      key: view.key,
      gifts: view.gifts.map((gift) => ({
        key: gift.key,
        name: gift.title,
        imageSrc: gift.imageUrl ?? undefined,
        quantity: gift.line.quantity,
        listPrice: gift.listPrice != null ? money(gift.listPrice, gift.currency) : undefined,
      })),
      onChange: view.change ?? undefined,
    };
  });
}

/** Free-delivery progress from the promotions API (no card when the market has no threshold). */
export function toFreeDelivery(input: {
  empty: boolean;
  threshold: number | null;
  unlocked: boolean;
  progress: number;
  remaining: number;
  currency: string;
  money: SapilMoney;
}): SapilFreeDelivery | null {
  const { empty, threshold, unlocked, progress, remaining, currency, money } = input;
  if (unlocked && !empty) return { state: "unlocked" };
  if (threshold == null || !(threshold > 0)) return null;
  if (empty) return { state: "start", threshold: money(threshold, currency) };
  return {
    state: "progress",
    remaining: money(remaining, currency),
    threshold: money(threshold, currency),
    percent: Math.min(100, Math.round(progress * 100)),
  };
}
