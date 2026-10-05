"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth/token";
import { createOrResolveCart, getActiveCart } from "@/features/cart/api/cart.service";
import {
  getStoredCartId,
  storeCartId,
} from "@/features/cart/utils/guestToken";
import { useStorefrontMarkets } from "@/features/markets";
import { fallbackCatalogContext } from "@/features/markets/utils/fallbackCatalogContext";
import { flagForMarket, isoForMarket } from "@/features/markets/utils/flagForMarket";
import {
  readZoneCookie,
  writeZoneCookie,
} from "@/features/markets/utils/zoneCookie";
import type { StorefrontMarket } from "@/features/markets/types/market";
import { loyaltyKeys } from "@/features/loyalty/api/loyalty.keys";
import { promotionKeys } from "@/features/promotions/api/promotions.keys";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore, type PersistedCatalogContext } from "@/stores/useUiStore";
import { filterMarketsForTenant } from "@/lib/storefront/brand";

type RegionOption = { id: string; label: string; flag?: string; countryCode?: string };

type MarketContextValue = {
  marketId: string | null;
  setMarketId: (id: string | null) => void;
  catalogContext: PersistedCatalogContext | null;
  regionOptions: RegionOption[];
};

const MarketContext = createContext<MarketContextValue | null>(null);

function contextFromMarket(market: StorefrontMarket): PersistedCatalogContext {
  const ctx = market.catalogContext;
  return {
    zoneCode: ctx.zoneCode,
    salesChannelCode: market.salesChannelCode?.trim() || ctx.salesChannelCode,
    languageCode: ctx.languageCode ?? market.defaultLanguageCode,
    currencyCode: ctx.currencyCode ?? market.defaultCurrencyCode,
    countryCode: ctx.countryCode || market.countryCode,
    zoneId: ctx.zoneId,
    brandId: ctx.brandId ?? null,
    brandCode: ctx.brandCode ?? null,
  };
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const marketId = useUiStore((s) => s.selectedMarketId);
  const setSelectedMarketId = useUiStore((s) => s.setSelectedMarketId);
  const catalogContext = useUiStore((s) => s.catalogContext);
  const setCatalogContext = useUiStore((s) => s.setCatalogContext);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const setCartId = useCartStore((s) => s.setCartId);
  const clearPromotions = useCartStore((s) => s.clearPromotions);
  const setSyncing = useCartStore((s) => s.setSyncing);
  const [hydrated, setHydrated] = useState(false);
  const marketsQuery = useStorefrontMarkets();

  useEffect(() => {
    const unsub = useUiStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    void useUiStore.persist.rehydrate();
    if (useUiStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  const shoppable = useMemo(() => {
    const list = marketsQuery.data?.markets ?? [];
    const ready = list.filter((market) => market.isCatalogReady);
    const pool = ready.length ? ready : list;
    const filtered = filterMarketsForTenant(pool);
    return filtered.length ? filtered : pool;
  }, [marketsQuery.data]);

  const regionOptions = useMemo<RegionOption[]>(() => {
    if (marketsQuery.isError || !marketsQuery.data) {
      return [];
    }
    return shoppable.map((market) => {
      const countryCode = isoForMarket({
        zoneCode: market.zoneCode,
        countryCode: market.countryCode || market.catalogContext.countryCode,
      });
      return {
        id: market.zoneCode,
        label: market.name.trim() || market.zoneCode,
        countryCode,
        flag: flagForMarket({
          zoneCode: market.zoneCode,
          countryCode,
        }),
      };
    });
  }, [marketsQuery.data, marketsQuery.isError, shoppable]);

  useEffect(() => {
    if (!hydrated) return;

    const saved =
      useUiStore.getState().selectedMarketId || readZoneCookie();

    if (!marketsQuery.data) {
      if (saved && !useUiStore.getState().catalogContext) {
        setSelectedMarketId(saved);
        setCatalogContext(fallbackCatalogContext(saved));
        writeZoneCookie(saved);
      }
      return;
    }

    if (!shoppable.length) {
      return;
    }

    const pick =
      shoppable.find((market) => market.zoneCode === saved) ??
      marketsQuery.data.defaultMarket ??
      shoppable[0];

    if (!pick) return;

    const current = useUiStore.getState();
    const nextCtx = contextFromMarket(pick);
    if (
      current.selectedMarketId === pick.zoneCode &&
      current.catalogContext?.zoneCode === nextCtx.zoneCode &&
      current.catalogContext?.currencyCode === nextCtx.currencyCode &&
      current.catalogContext?.salesChannelCode === nextCtx.salesChannelCode
    ) {
      writeZoneCookie(pick.zoneCode);
      return;
    }

    setSelectedMarketId(pick.zoneCode);
    setCatalogContext(nextCtx);
    writeZoneCookie(pick.zoneCode);
  }, [
    hydrated,
    marketsQuery.data,
    shoppable,
    setCatalogContext,
    setSelectedMarketId,
  ]);

  const refreshMarketScopedData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["catalog"] });
    void queryClient.invalidateQueries({ queryKey: ["storefront", "navigation"] });
    void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    void queryClient.removeQueries({ queryKey: promotionKeys.all });
    void queryClient.removeQueries({ queryKey: loyaltyKeys.all });
    clearPromotions();
    setSyncing(true);

    const cartId = getStoredCartId();
    const authed = Boolean(getAccessToken());
    if (!cartId && !authed) {
      setSyncing(false);
      return;
    }

    void (cartId ? getActiveCart(cartId) : createOrResolveCart({}))
      .catch(() => createOrResolveCart({}))
      .then((cart) => {
        storeCartId(cart.cartId);
        setCartId(cart.cartId);
        setCartFromApi(cart);
      })
      .catch(() => {
        // Soft failure — shopper can still browse the new market.
      })
      .finally(() => setSyncing(false));
  }, [clearPromotions, queryClient, setCartFromApi, setCartId, setSyncing]);

  const setMarketId = useCallback(
    (id: string | null) => {
      if (!id) return;
      const market = shoppable.find((item) => item.zoneCode === id);
      const next = market
        ? contextFromMarket(market)
        : fallbackCatalogContext(id);
      setSelectedMarketId(id);
      setCatalogContext(next);
      writeZoneCookie(id);
      refreshMarketScopedData();
    },
    [
      refreshMarketScopedData,
      setCatalogContext,
      setSelectedMarketId,
      shoppable,
    ],
  );

  const value = useMemo(
    () => ({
      marketId,
      setMarketId,
      catalogContext,
      regionOptions,
    }),
    [catalogContext, marketId, regionOptions, setMarketId],
  );

  return (
    <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return ctx;
}
