"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ApiClientError } from "@/lib/api/apiError";
import { useGiftCatalogMap } from "../hooks/useGiftCatalog";
import { useGiftChoice } from "../hooks/useGiftChoice";
import type { PromotionGiftAward } from "../types/promotions";
import { giftDisplayName, giftErrorMessage } from "../utils/giftWithPurchase";

export function GiftChoiceModal({
  award,
  celebrate,
  onClose,
}: {
  award: PromotionGiftAward;
  celebrate: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const choice = useGiftChoice();
  const catalog = useGiftCatalogMap(award.choices.map((gift) => gift.sku));
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  async function select(sku: string) {
    setError(null);
    try {
      await choice.select.mutateAsync({ sku, promotionCode: award.promotionCode });
      onClose();
    } catch (caught) {
      const code = caught instanceof ApiClientError ? caught.code : null;
      const message = caught instanceof ApiClientError ? caught.message : null;
      setError(giftErrorMessage(code, message));
    }
  }

  return createPortal(
    <div className="gift-choice-root">
      <button type="button" className="gift-choice-backdrop" aria-label="Close gift choices" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`gift-choice-dialog ${celebrate ? "is-reveal" : ""}`}
      >
        <p className="gift-choice-kicker">Free gift</p>
        <h2 id={titleId}>A gift is yours</h2>
        <p className="gift-choice-lede">Choose one. You can change it before checkout.</p>
        <ul className="gift-choice-list" aria-label="Free gift choices">
          {award.choices.map((gift, index) => {
            const product = catalog.get(gift.sku);
            const title = product?.title || giftDisplayName(gift);
            const image = product?.imageUrl || gift.imageUrl;
            return (
              <li key={gift.sku} style={{ animationDelay: `${80 + index * 70}ms` }}>
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={title} width={64} height={64} />
                ) : (
                  <span className="gift-choice-ph" aria-hidden="true" />
                )}
                <span className="gift-choice-name">
                  {title}
                  {!gift.sku.includes(":") && gift.sku.length <= 48 ? (
                    <small>{gift.sku}</small>
                  ) : null}
                </span>
                <button
                  type="button"
                  disabled={choice.select.isPending}
                  onClick={() => void select(gift.sku)}
                >
                  Select
                </button>
              </li>
            );
          })}
        </ul>
        {error ? (
          <p className="cart-hint" role="alert">
            {error}
          </p>
        ) : null}
        <button type="button" className="gift-choice-later" onClick={onClose}>
          Not now
        </button>
      </div>
    </div>,
    document.body,
  );
}
