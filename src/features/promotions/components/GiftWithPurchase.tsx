"use client";

import { useCartStore } from "@/stores/useCartStore";
import { useGiftCatalogMap } from "../hooks/useGiftCatalog";
import { useGiftChoiceStore } from "../giftChoiceStore";
import { readGiftAwards, type PromotionSnapshotV1 } from "../types/promotions";
import {
  awaitingGiftChoice,
  canChangeGift,
  giftAwardCode,
  giftNotice,
} from "../utils/giftWithPurchase";
import { GiftCartItem } from "./GiftCartItem";

export function GiftWithPurchase({
  snapshot,
  currency = "AED",
  selectable = true,
}: {
  snapshot?: PromotionSnapshotV1 | null;
  currency?: string;
  /** Checkout shows the awarded gift. Choice and change stay on the bag. */
  selectable?: boolean;
}) {
  const fromStore = useCartStore((s) => s.promotions);
  const data = snapshot ?? fromStore;
  const awards = readGiftAwards(data);
  const catalog = useGiftCatalogMap(
    awards.flatMap((award) => [...award.giftItems, ...award.choices].map((gift) => gift.sku)),
  );

  if (!awards.length) return null;

  return (
    <div className="promo-gifts">
      {awards.map((award, index) => {
        const notice = giftNotice(award);
        const key = `${award.promotionCode ?? "gift"}-${index}`;
        if (notice) {
          return (
            <p className="cart-hint" role="status" key={key}>
              {notice}
            </p>
          );
        }
        if (awaitingGiftChoice(award)) {
          return (
            <div className="promo-gifts__prompt" key={key}>
              <p className="promo-gifts__title">A free gift is waiting</p>
              <button type="button" onClick={() => useGiftChoiceStore.getState().open(giftAwardCode(award))}>
                Choose your free gift
              </button>
            </div>
          );
        }
        return (
          <div className="promo-gifts__awarded" aria-label="Free gifts" key={key}>
            {award.giftItems.map((gift) => (
              <GiftCartItem
                key={gift.sku}
                line={gift}
                product={catalog.get(gift.sku)}
                currency={currency}
                variant={selectable ? "cart" : "checkout"}
              />
            ))}
            {selectable && canChangeGift(award) ? (
              <button
                type="button"
                className="promo-gifts__change"
                onClick={() => useGiftChoiceStore.getState().open(giftAwardCode(award))}
              >
                Change gift
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
