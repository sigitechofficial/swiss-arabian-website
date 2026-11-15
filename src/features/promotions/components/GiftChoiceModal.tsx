"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useGiftChoiceDialog } from "../hooks/useGiftChoiceDialog";
import type { PromotionGiftAward } from "../types/promotions";
import { giftErrorMessage } from "../utils/giftWithPurchase";
import {
  cartHint,
  giftChoiceBackdrop,
  giftChoiceDialog,
  giftChoiceKicker,
  giftChoiceLater,
  giftChoiceLede,
  giftChoiceList,
  giftChoiceName,
  giftChoicePh,
  giftChoiceReveal,
  giftChoiceRoot,
} from "@/styles/cartChrome";
import { useHydrated } from "@/hooks/useHydrated";

export type GiftChoiceModalProps = {
  award: PromotionGiftAward;
  celebrate: boolean;
  onClose: () => void;
};

/** Swiss Arabian's free-gift choice dialog (logic in `useGiftChoiceDialog`). */
export function GiftChoiceModal({ award, celebrate, onClose }: GiftChoiceModalProps) {
  const titleId = useId();
  const dialog = useGiftChoiceDialog(award, onClose);
  const error = dialog.error ? giftErrorMessage(dialog.error.code, dialog.error.message) : null;
  // Portal target (document.body) exists only after hydration.
  const mounted = useHydrated();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={giftChoiceRoot}>
      <button
        type="button"
        className={giftChoiceBackdrop}
        aria-label="Close gift choices"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${giftChoiceDialog} ${celebrate ? giftChoiceReveal : ""}`}
      >
        <p className={giftChoiceKicker}>Free gift</p>
        <h2 id={titleId}>A gift is yours</h2>
        <p className={giftChoiceLede}>
          Choose one. You can change it before checkout.
        </p>
        <ul className={giftChoiceList} aria-label="Free gift choices">
          {dialog.gifts.map((gift, index) => {
            const { title, image } = gift;
            return (
              <li
                key={gift.sku}
                style={{ animationDelay: `${80 + index * 70}ms` }}
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={title} width={128} height={128} />
                ) : (
                  <span className={giftChoicePh} aria-hidden="true" />
                )}
                <span className={giftChoiceName}>
                  {title}
                  {gift.showSku ? (
                    <small>{gift.sku}</small>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={dialog.pending}
                  onClick={() => void dialog.select(gift.sku)}
                >
                  Select
                </button>
              </li>
            );
          })}
        </ul>
        {error ? (
          <p className={cartHint} role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className={giftChoiceLater} onClick={onClose}>
          Not now
        </button>
      </div>
    </div>,
    document.body,
  );
}
