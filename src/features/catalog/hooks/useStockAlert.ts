"use client";

import { type FormEvent, useState } from "react";
import { apiPost } from "@/lib/api/apiClient";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { storefrontContextQuery } from "@/lib/storefront/context";
import type { ProductSummary } from "../types/product";

export type StockAlertProduct = Pick<ProductSummary, "id" | "title" | "slug"> & {
  variantId?: string;
  sku?: string;
};

/**
 * "Email me when it's back": the form state and the request, shared by every
 * brand (each draws its own button and dialog). Saves the email against the
 * product's SKU in the shopper's market (POST /storefront/catalog/stock-alerts).
 */
export function useStockAlert(product: StockAlertProduct) {
  const t = useShopCopy();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!product.sku || !product.id) {
      setError(t("stockAlert.noSku"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const query = storefrontContextQuery();
      await apiPost(
        `/storefront/catalog/stock-alerts${query ? `?${query}` : ""}`,
        {
          productId: product.id,
          variantId: product.variantId,
          sku: product.sku,
          productName: product.title,
          slug: product.slug,
          email,
        },
        { skipAuth: true },
      );
      setDone(true);
    } catch {
      setError(t("stockAlert.failed"));
    } finally {
      setBusy(false);
    }
  }

  return { email, setEmail, busy, done, error, submit };
}
