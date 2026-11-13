"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { addCartItems, storefrontCartQuery } from "@/features/cart/api/cart.service";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { promotionKeys } from "../api/promotions.keys";
import type { DiscoveryOffer } from "../types/discovery";
import { rememberEmptyOrigin } from "../utils/emptyBagMemory";
import { trackPromotion } from "../utils/promotionAnalytics";

export type OfferShopProduct = {
  productId: string;
  variantId: string | null;
  sku: string;
  slug: string | null;
  title: string;
  image: string | null;
  price: string | null;
  amount: string | null;
  inStock: boolean;
};

export type OfferShopGroup = {
  id: string;
  name: string;
  requiredQuantity: number | null;
  selectionMode: "replace" | "many";
  products: OfferShopProduct[];
};

/** Wording the offer itself carries (set in the admin, in the page's language). */
export type OfferShopCopy = {
  choose: string;
  remove: string;
  replace: string;
  tray: string;
  soldOut?: string;
  add: string;
  completed?: string;
  current?: string;
  next?: string;
  before: string;
  saving: string;
  offerSaving?: string;
  otherSavings?: string;
  totalSavings?: string;
  total: string;
  search: string;
};

export type OfferShopPayload = {
  available: true;
  offer: DiscoveryOffer;
  groups: OfferShopGroup[];
  copy: OfferShopCopy;
};

export type OfferSelection = { groupId: string; sku: string; quantity: number };

export type OfferPreview = {
  beforeSavings: string;
  offerSaving?: string | null;
  otherSavings?: string | null;
  totalSavings?: string | null;
  promotionSaving?: string | null;
  yourTotal: string;
  subtotalAmount?: string | null;
  savingsAmount?: string | null;
  totalAmount?: string | null;
  message: string;
  readyToAdd: boolean;
  unavailable: Array<{ groupId: string; sku: string }>;
};

export function moneyNumber(value: string | null | undefined): number | null {
  if (value == null || String(value).trim() === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

/** A product's price in the market currency (the API's amount), else its price text. */
export function offerProductPrice(product: OfferShopProduct, currency: string) {
  const amount = moneyNumber(product.amount);
  return amount == null ? product.price : formatMoney(amount, currency);
}

function storageKey(market: string, code: string) {
  return `swiss-offer:${market}:${code}`;
}

function readSelections(key: string): OfferSelection[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(key) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const groupId = String((item as { groupId?: unknown }).groupId || "");
      const sku = String((item as { sku?: unknown }).sku || "");
      const quantity = Math.floor(Number((item as { quantity?: unknown }).quantity));
      if (!groupId || !sku || !Number.isFinite(quantity) || quantity < 1) return [];
      return [{ groupId, sku, quantity }];
    });
  } catch {
    return [];
  }
}

function keepSellable(groups: OfferShopGroup[], rows: OfferSelection[]): OfferSelection[] {
  return rows.flatMap((row) => {
    const group = groups.find((item) => item.id === row.groupId);
    const product = group?.products.find((item) => item.sku === row.sku && item.inStock);
    if (!group || !product) return [];
    const cap = group.requiredQuantity ?? 20;
    return [{ ...row, quantity: Math.min(row.quantity, cap) }];
  });
}

export type OfferShopState = ReturnType<typeof useOfferShop>;

/**
 * An offer link (/offers/[code]) as a bundle builder, for every brand's view:
 * the offer's groups and products for the market + language, the shopper's
 * picks (kept per offer and market for the session), the API's price preview,
 * and adding every pick to the bag in one go (then the bag opens).
 */
export function useOfferShop(code: string) {
  const [selections, setSelections] = useState<OfferSelection[]>([]);
  const [fetchedPreview, setFetchedPreview] = useState<OfferPreview | null>(null);
  const [adding, setAdding] = useState(false);
  const [addFailed, setAddFailed] = useState(false);
  const opened = useRef(false);
  const locale = localeFromPathname(usePathname() || "/");
  const setCartFromApi = useCartStore((state) => state.setCartFromApi);
  const cartId = useCartStore((state) => state.cartId);
  const setCartOpen = useUiStore((state) => state.setCartOpen);
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode) ?? "";
  const currency = useMarketCurrency();

  // Offer page data (market + locale scoped); React Query owns loading/error.
  const shopQuery = useQuery({
    queryKey: promotionKeys.offerShop(code, zoneCode, locale),
    queryFn: () => {
      const params = storefrontCartQuery();
      params.set("locale", locale);
      return apiGet<OfferShopPayload | { available: false }>(
        `/storefront/promotions/offers/${encodeURIComponent(code)}?${params.toString()}`,
      );
    },
    enabled: Boolean(zoneCode),
  });
  const shop = shopQuery.data && "offer" in shopQuery.data ? shopQuery.data : null;
  const missing = shopQuery.isSuccess && !shop;
  const loadError = shopQuery.isError;

  // Restore the shopper's picks for this offer/market (sessionStorage) when
  // the offer loads; the query only runs in the browser.
  const selectionsKey = shop ? storageKey(shop.offer.marketCode, code) : "";
  useResetOnChange(selectionsKey, () => {
    setSelections(shop ? keepSellable(shop.groups, readSelections(selectionsKey)) : []);
    setFetchedPreview(null);
  });

  useEffect(() => {
    if (!selectionsKey) return;
    sessionStorage.setItem(selectionsKey, JSON.stringify(selections));
  }, [selectionsKey, selections]);

  useEffect(() => {
    if (!shop || opened.current) return;
    opened.current = true;
    if (shop.offer.mechanic === "SET_BUNDLE") {
      rememberEmptyOrigin(shop.offer.marketCode, shop.offer.campaignCode);
    }
    trackPromotion("promotion_builder_opened", {
      campaignId: shop.offer.campaignId,
      campaignCode: shop.offer.campaignCode,
      mechanic: shop.offer.mechanic,
      market: shop.offer.marketCode,
      brand: null,
      surface: "offer",
    });
  }, [shop]);

  useEffect(() => {
    if (!shop || selections.length === 0) return;
    const handle = window.setTimeout(() => {
      const params = storefrontCartQuery();
      apiPost<OfferPreview | { available: false }>(
        `/storefront/promotions/offers/${encodeURIComponent(code)}/preview?${params.toString()}`,
        { locale, selections },
      )
        .then((data) => {
          if (!data || !("yourTotal" in data)) return;
          setFetchedPreview(data);
          if (data.unavailable.length) {
            setSelections((current) =>
              current.filter(
                (row) =>
                  !data.unavailable.some((gone) => gone.groupId === row.groupId && gone.sku === row.sku),
              ),
            );
          }
        })
        .catch(() => setFetchedPreview(null));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [shop, selections, code, locale]);

  // No picks, no price preview (an older preview must not linger).
  const preview = selections.length > 0 ? fetchedPreview : null;

  const productsBySku = useMemo(() => {
    const map = new Map<string, OfferShopProduct>();
    for (const group of shop?.groups ?? []) {
      for (const product of group.products) map.set(`${group.id}:${product.sku}`, product);
    }
    return map;
  }, [shop]);

  const status: "loading" | "error" | "missing" | "ready" =
    !zoneCode || (!shop && !missing && !loadError)
      ? "loading"
      : loadError
        ? "error"
        : missing || !shop
          ? "missing"
          : "ready";

  const track = (event: "promotion_product_selected" | "promotion_product_removed" | "promotion_multi_add") => {
    if (!shop) return;
    trackPromotion(event, {
      campaignId: shop.offer.campaignId,
      campaignCode: shop.offer.campaignCode,
      mechanic: shop.offer.mechanic,
      market: shop.offer.marketCode,
      surface: "offer",
    });
  };

  function choose(group: OfferShopGroup, product: OfferShopProduct) {
    if (!product.inStock) return;
    setSelections((current) => {
      const rest =
        group.selectionMode === "replace"
          ? current.filter((row) => row.groupId !== group.id)
          : current.filter((row) => !(row.groupId === group.id && row.sku === product.sku));
      return [...rest, { groupId: group.id, sku: product.sku, quantity: 1 }];
    });
    track("promotion_product_selected");
  }

  function removeSelection(groupId: string, sku: string) {
    setSelections((current) => current.filter((item) => !(item.groupId === groupId && item.sku === sku)));
    track("promotion_product_removed");
  }

  async function addSelected() {
    if (!preview?.readyToAdd || adding) return;
    setAdding(true);
    setAddFailed(false);
    try {
      const cart = await addCartItems(
        selections.map((row) => ({ sku: row.sku, quantity: row.quantity })),
        cartId,
      );
      setCartFromApi(cart);
      setCartOpen(true);
      track("promotion_multi_add");
    } catch {
      setAddFailed(true);
    } finally {
      setAdding(false);
    }
  }

  const groupFilled = (group: OfferShopGroup) => {
    const have = selections
      .filter((row) => row.groupId === group.id)
      .reduce((sum, row) => sum + row.quantity, 0);
    return group.requiredQuantity ? have >= group.requiredQuantity : have > 0;
  };
  const isSelected = (groupId: string, sku: string) =>
    selections.some((row) => row.groupId === groupId && row.sku === sku);
  const unfilled = shop ? shop.groups.filter((group) => !groupFilled(group)) : [];
  const activeId = unfilled[0]?.id ?? shop?.groups[0]?.id;

  return {
    status,
    shop,
    selections,
    preview,
    productsBySku,
    currency,
    adding,
    addFailed,
    choose,
    removeSelection,
    addSelected,
    groupFilled,
    isSelected,
    unfilled,
    activeId,
    /** Every group filled and the API says the bundle can be added. */
    ready: unfilled.length === 0 && Boolean(preview?.readyToAdd) && !adding,
    subtotal: moneyNumber(preview?.subtotalAmount),
    savings: moneyNumber(preview?.savingsAmount),
    total: moneyNumber(preview?.totalAmount),
  };
}
