"use client";

import { useState } from "react";
import { ApiClientError } from "@/lib/api/apiError";
import { useCartStore } from "@/stores/useCartStore";
import { GiftCartItem } from "./GiftCartItem";
import { useGiftCatalogMap } from "../hooks/useGiftCatalog";
import { useGiftChoice } from "../hooks/useGiftChoice";
import { readGiftAwards, type PromotionSnapshotV1 } from "../types/promotions";
import {
  giftDisplayName,
  giftErrorMessage,
  giftNotice,
  isCustomerChoice,
} from "../utils/giftWithPurchase";

export function GiftWithPurchase({
  snapshot,
  currency = "AED",
  selectable = true,
}: {
  snapshot?: PromotionSnapshotV1 | null;
  currency?: string;
  /** Checkout shows the awarded gift. Choice buttons stay on the cart. */
  selectable?: boolean;
}) {
  const fromStore = useCartStore((s) => s.promotions);
  const data = snapshot ?? fromStore;
  const awards = readGiftAwards(data);
  const catalog = useGiftCatalogMap(
    awards.flatMap((award) => [...award.giftItems, ...award.choices].map((gift) => gift.sku)),
  );
  const choice = useGiftChoice();
  const [error, setError] = useState<string | null>(null);

  if (!awards.length && !error) return null;

  async function choose(sku: string, promotionCode: string | null) {
    setError(null);
    try {
      await choice.select.mutateAsync({ sku, promotionCode });
    } catch (caught) {
      const code = caught instanceof ApiClientError ? caught.code : null;
      const message = caught instanceof ApiClientError ? caught.message : null;
      setError(giftErrorMessage(code, message));
    }
  }

  return (
    <div className="promo-gifts">
      {awards.map((award, index) => {
        const notice = giftNotice(award);
        if (notice) {
          return (
            <p className="cart-hint" role="status" key={`${award.promotionCode ?? "gift"}-${index}`}>
              {notice}
            </p>
          );
        }
        if (isCustomerChoice(award)) {
          return (
            <div key={`${award.promotionCode ?? "choice"}-${index}`}>
              <p className="promo-gifts__title">Choose your free gift</p>
              <ul className="promo-gifts__choices" aria-label="Free gift choices">
                {award.choices.map((gift) => {
                  const product = catalog.get(gift.sku);
                  const title = product?.title || giftDisplayName(gift);
                  return (
                  <li key={gift.sku}>
                    {(product?.imageUrl || gift.imageUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product?.imageUrl || gift.imageUrl || ""} alt={title} width={48} height={48} />
                    ) : null}
                    <span>{title}</span>
                    <span>{product?.sku && !product.sku.includes(":") ? product.sku : gift.sku.includes(":") ? null : gift.sku}</span>
                    {selectable ? (
                      <button
                        type="button"
                        disabled={choice.select.isPending}
                        onClick={() => void choose(gift.sku, award.promotionCode)}
                      >
                        Select
                      </button>
                    ) : null}
                  </li>
                  );
                })}
              </ul>
            </div>
          );
        }
        return (
          <div className="promo-gifts__awarded" aria-label="Free gifts" key={`${award.promotionCode ?? "auto"}-${index}`}>
            {award.giftItems.map((gift) => (
              <GiftCartItem
                key={gift.sku}
                line={gift}
                product={catalog.get(gift.sku)}
                currency={currency}
                variant={selectable ? "cart" : "checkout"}
              />
            ))}
          </div>
        );
      })}
      {error ? (
        <p className="cart-hint" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
