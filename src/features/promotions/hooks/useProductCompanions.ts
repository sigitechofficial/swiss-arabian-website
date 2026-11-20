"use client";

import { toast } from "@/components/ui/Toaster";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addCartItems } from "@/features/cart/api/cart.service";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { toCatalogProduct } from "@/features/catalog/utils/toCatalogProduct";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { fetchProductCompanions, previewProductCompanions } from "../api/promotions.service";
import type { CompanionProduct } from "../types/companions";
import { trackPromotion } from "../utils/promotionAnalytics";

export function companionAmount(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

/** A companion as a shared catalog product (for a brand's product card). */
export function companionCard(product: CompanionProduct, currency: string): CatalogProduct | null {
  if (!product.slug) return null;
  return toCatalogProduct({
    id: product.productId,
    slug: product.slug,
    title: product.title,
    price: companionAmount(product.amount) ?? companionAmount(product.price),
    currency,
    imageUrl: product.image,
    imageUrls: product.image ? [product.image] : [],
    sku: product.sku,
    isSellable: product.inStock,
    inStock: product.inStock,
    concentration: null,
    houseCollection: null,
    featuredNote: null,
  });
}

type Preview = {
  key: string;
  before: string | null;
  saving: string | null;
  total: string | null;
  message: string | null;
  ready: boolean;
};

/**
 * "Often bought together" for a product page, shared by every brand (each draws
 * its own): the companion groups, the first group as a pick-and-add bundle (the
 * product itself pre-selected), a live price preview of the selection, and
 * adding the selection to the bag. Later groups are plain product rows.
 */
export function useProductCompanions({
  productId,
  marketCode,
  omitGroupIds = [],
}: {
  productId: string;
  marketCode?: string | null;
  /** Groups the page already shows (e.g. its own "you may also like"). */
  omitGroupIds?: string[];
}) {
  const t = useShopCopy();
  const query = useQuery({
    queryKey: ["promotion-companions", productId, marketCode ?? ""],
    queryFn: () => fetchProductCompanions(productId),
    enabled: Boolean(productId),
    retry: false,
  });
  const data = query.data;
  const cartId = useCartStore((state) => state.cartId);
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const currency = useUiStore((state) => state.catalogContext?.currencyCode) || "AED";
  const [selected, setSelected] = useState<string[]>([]);
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  // Pre-select the current product once per product, when its data arrives.
  if (data && seededFor !== productId) {
    setSelected(data.current?.inStock ? [data.current.sku] : []);
    setSeededFor(productId);
  }

  const products = useMemo(() => {
    const rows = new Map<string, CompanionProduct>();
    if (data?.current) rows.set(data.current.sku, data.current);
    for (const group of data?.groups ?? []) {
      for (const product of group.products) rows.set(product.sku, product);
    }
    return rows;
  }, [data]);

  const chosen = selected.filter((sku) => products.get(sku)?.inStock);
  // Stable key for the current selection; the preview effect reads the SKUs
  // from it so it re-runs only when the selection itself changes.
  const selectionKey = chosen.slice().sort().join("|");

  useEffect(() => {
    // `fresh` below ignores a preview that no longer matches the selection.
    if (!selectionKey) return;
    const skus = selectionKey.split("|");
    let cancel = false;
    const timer = window.setTimeout(() => {
      void previewProductCompanions(
        productId,
        skus.map((sku) => ({ sku })),
      ).then(
        (result) => {
          if (cancel) return;
          setPreview({
            key: selectionKey,
            before: result.beforeSavings,
            saving: result.promotionSaving,
            total: result.yourTotal,
            message: result.message,
            ready: result.readyToAdd,
          });
        },
        () => {
          // No price for this selection: say so, and keep "Add" off until it can be worked out.
          if (cancel) return;
          setPreview({ key: selectionKey, before: null, saving: null, total: null, message: t("promotions.previewFailed"), ready: false });
        },
      );
    }, 200);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [productId, selectionKey, t]);

  const groups = (data?.groups ?? []).filter((group) => !omitGroupIds.includes(group.id));
  const fresh = preview?.key === selectionKey ? preview : null;

  function toggle(sku: string) {
    const product = products.get(sku);
    if (!product?.inStock) return;
    setSelected((current) => {
      const next = current.includes(sku) ? current.filter((item) => item !== sku) : [...current, sku];
      trackPromotion(next.includes(sku) ? "promotion_product_selected" : "promotion_product_removed", {
        market: marketCode,
        surface: "pdp",
      });
      return next;
    });
  }

  const bundle = groups[0];
  const later = groups.slice(1);
  const pieces = [
    ...(data?.current?.inStock ? [data.current] : []),
    ...(bundle?.products ?? []).filter((product) => product.sku !== data?.current?.sku),
  ];
  const subtotal = companionAmount(fresh?.before);
  const total = companionAmount(fresh?.total);
  const discount = subtotal != null && total != null ? Math.max(0, Number((subtotal - total).toFixed(2))) : null;
  const ready = Boolean(fresh?.ready) && !busy && chosen.length > 0;

  function addSelected() {
    if (!ready) return;
    setBusy(true);
    void addCartItems(
      chosen.map((sku) => ({ sku, quantity: 1 })),
      cartId,
    )
      .then((cart) => {
        setCartFromApi(cart);
        setCartOpen(true);
        trackPromotion("promotion_multi_add", { market: marketCode, surface: "pdp" });
      })
      .catch(() => toast(t("promotions.addFailed"), "error"))
      .finally(() => setBusy(false));
  }

  return {
    /** Still loading: show nothing yet. */
    pending: query.isPending,
    /** Failed, empty, or every group left out: the page's fallback. */
    empty: query.isError || !data || groups.length === 0,
    data,
    currency,
    bundle,
    later,
    pieces,
    selected,
    toggle,
    message: fresh?.message ?? null,
    subtotal,
    total,
    discount,
    ready,
    busy,
    addSelected,
  };
}
