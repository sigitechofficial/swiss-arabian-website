"use client";

import { useState } from "react";
import { ApiClientError } from "@/lib/api/apiError";
import type { PromotionGiftAward } from "../types/promotions";
import { giftDisplayName } from "../utils/giftWithPurchase";
import { useGiftCatalogMap } from "./useGiftCatalog";
import { useGiftChoice } from "./useGiftChoice";

export type GiftChoiceError = { code: string | null; message: string | null };

/**
 * The free-gift choice dialog, for every brand's view: the award's gifts with
 * their catalog title and image, and choosing one (the dialog closes when the
 * cart accepts it; an error is kept for the view to word).
 */
export function useGiftChoiceDialog(award: PromotionGiftAward, onClose: () => void) {
  const choice = useGiftChoice();
  const catalog = useGiftCatalogMap(award.choices.map((gift) => gift.sku));
  const [error, setError] = useState<GiftChoiceError | null>(null);

  const gifts = award.choices.map((gift) => {
    const product = catalog.get(gift.sku);
    return {
      sku: gift.sku,
      title: product?.title || giftDisplayName(gift),
      image: product?.imageUrl || gift.imageUrl || null,
      /** A readable SKU is shown under the name; generated ids are not. */
      showSku: !gift.sku.includes(":") && gift.sku.length <= 48,
    };
  });

  async function select(sku: string) {
    setError(null);
    try {
      await choice.select.mutateAsync({ sku, promotionCode: award.promotionCode });
      onClose();
    } catch (caught) {
      setError({
        code: caught instanceof ApiClientError ? (caught.code ?? null) : null,
        message: caught instanceof ApiClientError ? caught.message : null,
      });
    }
  }

  return { gifts, select, pending: choice.select.isPending, error };
}
