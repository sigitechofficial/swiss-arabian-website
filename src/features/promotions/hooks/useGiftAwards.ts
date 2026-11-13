"use client";

import { useCartStore } from "@/stores/useCartStore";
import { giftCardSku, giftCardTitle } from "../components/GiftCartItem";
import { useGiftChoiceStore } from "../giftChoiceStore";
import { readGiftAwards, type PromotionGiftAward, type PromotionGiftLine, type PromotionSnapshotV1 } from "../types/promotions";
import { awaitingGiftChoice, canChangeGift, giftAwardCode, giftNotice } from "../utils/giftWithPurchase";
import { useGiftCatalogMap, type GiftCatalogHit } from "./useGiftCatalog";

export type GiftAwardView =
  | { kind: "notice"; key: string; message: string }
  | { kind: "choose"; key: string; open: () => void }
  | {
      kind: "awarded";
      key: string;
      gifts: Array<{
        key: string;
        line: PromotionGiftLine;
        product: GiftCatalogHit | null | undefined;
        title: string;
        sku: string | null;
        imageUrl: string | null;
        /** Catalog value of the gift (struck through); the shopper pays nothing. */
        listPrice: number | null;
        currency: string;
      }>;
      /** Customer-choice gift that can be swapped (opens the gift chooser). */
      change: (() => void) | null;
    };

function viewOf(
  award: PromotionGiftAward,
  index: number,
  catalog: Map<string, GiftCatalogHit>,
  currency: string,
): GiftAwardView {
  const key = `${award.promotionCode ?? "gift"}-${index}`;
  const notice = giftNotice(award);
  if (notice) return { kind: "notice", key, message: notice };
  const open = () => useGiftChoiceStore.getState().open(giftAwardCode(award));
  if (awaitingGiftChoice(award)) return { kind: "choose", key, open };
  return {
    kind: "awarded",
    key,
    gifts: award.giftItems.map((line) => {
      const product = catalog.get(line.sku);
      const money = product?.currency?.trim() || currency;
      return {
        key: `${line.tierId ?? "gift"}-${line.sku}`,
        line,
        product,
        title: giftCardTitle(line, product),
        sku: giftCardSku(line, product),
        imageUrl: product?.imageUrl || line.imageUrl || null,
        listPrice: product?.price != null && product.price > 0 ? product.price * line.quantity : null,
        currency: money,
      };
    }),
    change: canChangeGift(award) ? open : null,
  };
}

/**
 * Free gifts (gift with purchase) in the bag or a checkout quote: notices,
 * "choose your gift" prompts and awarded gift lines with their catalog data.
 */
export function useGiftAwards(snapshot?: PromotionSnapshotV1 | null, currency = "AED") {
  const fromStore = useCartStore((s) => s.promotions);
  const data = snapshot ?? fromStore;
  const awards = readGiftAwards(data);
  const catalog = useGiftCatalogMap(
    awards.flatMap((award) => [...award.giftItems, ...award.choices].map((gift) => gift.sku)),
  );
  return {
    awards,
    catalog,
    views: awards.map((award, index) => viewOf(award, index, catalog, currency)),
  };
}
