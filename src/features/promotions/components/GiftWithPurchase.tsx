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
import {
  cartHint,
  promoGifts,
  promoGiftsAwarded,
  promoGiftsChange,
  promoGiftsChoose,
  promoGiftsPrompt,
  promoGiftsTitle,
} from "@/styles/cartChrome";

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
    <div className={promoGifts}>
      {awards.map((award, index) => {
        const notice = giftNotice(award);
        const key = `${award.promotionCode ?? "gift"}-${index}`;
        if (notice) {
          return (
            <p className={cartHint} role="status" key={key}>
              {notice}
            </p>
          );
        }
        if (awaitingGiftChoice(award)) {
          return (
            <div className={promoGiftsPrompt} key={key}>
              <p className={promoGiftsTitle}>A free gift is waiting</p>
              <button type="button" className={promoGiftsChoose} onClick={() => useGiftChoiceStore.getState().open(giftAwardCode(award))}>
                Choose your free gift
              </button>
            </div>
          );
        }
        return (
          <div className={promoGiftsAwarded} aria-label="Free gifts" key={key}>
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
                className={promoGiftsChange}
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
