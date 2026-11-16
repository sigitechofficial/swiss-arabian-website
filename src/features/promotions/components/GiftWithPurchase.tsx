"use client";

import { useGiftAwards } from "../hooks/useGiftAwards";
import { useGiftChoiceStore } from "../giftChoiceStore";
import type { PromotionSnapshotV1 } from "../types/promotions";
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
  promoGiftsDrawer,
  promoGiftsPrompt,
  promoGiftsTitle,
} from "@/styles/cartChrome";

export function GiftWithPurchase({
  snapshot,
  currency = "AED",
  selectable = true,
  surface = "page",
}: {
  snapshot?: PromotionSnapshotV1 | null;
  currency?: string;
  /** Checkout shows the awarded gift. Choice and change stay on the bag. */
  selectable?: boolean;
  /** The bag drawer gets compact gift rows. */
  surface?: "page" | "drawer";
}) {
  const { awards, catalog } = useGiftAwards(snapshot, currency);

  if (!awards.length) return null;

  return (
    <div className={surface === "drawer" ? promoGiftsDrawer : promoGifts}>
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
              <button
                type="button"
                className={promoGiftsChoose}
                onClick={() =>
                  useGiftChoiceStore.getState().open(giftAwardCode(award))
                }
              >
                Choose your free gift
              </button>
            </div>
          );
        }
        return (
          <div className={promoGiftsAwarded} aria-label="Free gifts" key={key}>
            {award.giftItems.map((gift) => (
              <GiftCartItem
                key={`${gift.tierId ?? "gift"}-${gift.sku}`}
                line={gift}
                product={catalog.get(gift.sku)}
                currency={currency}
                variant={
                  surface === "drawer"
                    ? "drawer"
                    : selectable
                      ? "cart"
                      : "checkout"
                }
              />
            ))}
            {selectable && canChangeGift(award) ? (
              <button
                type="button"
                className={promoGiftsChange}
                onClick={() =>
                  useGiftChoiceStore.getState().open(giftAwardCode(award))
                }
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
