"use client";

import { toast } from "@/components/ui/Toaster";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/auth/token";
import {
  createOrResolveCart,
  getActiveCart,
} from "@/features/cart/api/cart.service";
import {
  getStoredCartId,
  readGuestToken,
  storeCartId,
} from "@/features/cart/utils/guestToken";
import { useStorefrontMarkets } from "@/features/markets";
import { fallbackCatalogContext } from "@/features/markets/utils/fallbackCatalogContext";
import { marketContentLanguage } from "@/features/markets/utils/marketContentLanguage";
import {
  flagForMarket,
  isoForMarket,
} from "@/features/markets/utils/flagForMarket";
import {
  readZoneCookie,
  writeZoneCookie,
} from "@/features/markets/utils/zoneCookie";
import type { StorefrontMarket } from "@/features/markets/types/market";
import { employeeBenefitsKeys } from "@/features/employeeBenefits/api/employeeBenefits.keys";
import { loyaltyKeys } from "@/features/loyalty/api/loyalty.keys";
import { promotionKeys } from "@/features/promotions/api/promotions.keys";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore, type PersistedCatalogContext } from "@/stores/useUiStore";
import { filterMarketsForTenant } from "@/lib/storefront/brand";
import { usePersistHydrated } from "@/hooks/usePersistHydrated";

type RegionOption = {
  id: string;
  label: string;
  flag?: string;
  countryCode?: string;
};

type MarketContextValue = {
  marketId: string | null;
  setMarketId: (id: string | null) => void;
  catalogContext: PersistedCatalogContext | null;
  regionOptions: RegionOption[];
  /**
   * The selected market's own code for the language being read (for example "en-us").
   * Published content is stored under it. Null until the market's languages are known.
   */
  contentLanguage: string | null;
};

const MarketContext = createContext<MarketContextValue | null>(null);

function contextFromMarket(
  market: StorefrontMarket,
  languageCode: string,
): PersistedCatalogContext {
  const ctx = market.catalogContext;
  return {
    zoneCode: ctx.zoneCode,
    salesChannelCode: market.salesChannelCode?.trim() || ctx.salesChannelCode,
    languageCode,
    currencyCode: ctx.currencyCode ?? market.defaultCurrencyCode,
    countryCode: ctx.countryCode || market.countryCode,
    legalEntityCode:
      ctx.legalEntityCode ?? market.primaryLegalEntityCode ?? null,
    zoneId: ctx.zoneId,
    brandId: ctx.brandId ?? null,
    brandCode: ctx.brandCode ?? null,
  };
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const pathLanguage = localeFromPathname(pathname || "/");
  const marketId = useUiStore((s) => s.selectedMarketId);
  const router = useRouter();
  /**
   * Redraw the server-rendered parts of the page for the market now chosen
   * (product, collection, page text, first prices, titles). A "not found"
   * screen stays up on a refresh, and the page may exist in the new market:
   * load it again.
   */
  const redrawForMarket = useCallback(() => {
    if (document.querySelector("[data-page-not-found]")) {
      window.location.reload();
    } else {
      router.refresh();
    }
  }, [router]);
  const catalogContext = useUiStore((s) => s.catalogContext);
  const selectMarket = useUiStore((s) => s.selectMarket);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const setCartId = useCartStore((s) => s.setCartId);
  const clearPromotions = useCartStore((s) => s.clearPromotions);
  const setSyncing = useCartStore((s) => s.setSyncing);
  const clearCartLines = useCartStore((s) => s.clear);
  const hydrated = usePersistHydrated(useUiStore);
  const marketsQuery = useStorefrontMarkets();

  useEffect(() => {
    // The UI store skips automatic hydration; load it once on the client.
    void useUiStore.persist.rehydrate();
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

    const saved = useUiStore.getState().selectedMarketId || readZoneCookie();

    if (!marketsQuery.data) {
      if (saved && !useUiStore.getState().catalogContext) {
        selectMarket(saved, {
          ...fallbackCatalogContext(saved),
          languageCode: pathLanguage,
        });
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
    const nextCtx = contextFromMarket(pick, pathLanguage);
    // The server drew this page for the market in the cookie. When the saved
    // choice differs (cookie cleared or stale), redraw it for the chosen market.
    const serverMarket = readZoneCookie();
    const syncServer = () => {
      writeZoneCookie(pick.zoneCode);
      if (serverMarket && serverMarket !== pick.zoneCode) redrawForMarket();
    };
    if (
      current.selectedMarketId === pick.zoneCode &&
      current.catalogContext?.zoneCode === nextCtx.zoneCode &&
      current.catalogContext?.currencyCode === nextCtx.currencyCode &&
      current.catalogContext?.salesChannelCode === nextCtx.salesChannelCode &&
      current.catalogContext?.legalEntityCode === nextCtx.legalEntityCode
    ) {
      if (
        current.catalogContext?.languageCode !== pathLanguage &&
        current.catalogContext
      ) {
        selectMarket(pick.zoneCode, {
          ...current.catalogContext,
          languageCode: pathLanguage,
        });
      }
      syncServer();
      return;
    }

    selectMarket(pick.zoneCode, nextCtx);
    syncServer();
  }, [
    hydrated,
    marketsQuery.data,
    pathLanguage,
    redrawForMarket,
    shoppable,
    selectMarket,
  ]);

  // The server sets lang and dir on a full load only. Moving between an Arabic page
  // and an English-only one (sign in, checkout) is a client navigation, so follow it here.
  useEffect(() => {
    const root = document.documentElement;
    const dir = pathLanguage === "ar" ? "rtl" : "ltr";
    if (root.lang !== pathLanguage) root.lang = pathLanguage;
    if (root.dir !== dir) root.dir = dir;
  }, [pathLanguage]);

  const refreshMarketScopedData = useCallback(
    (previous?: { marketName: string; itemCount: number }) => {
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      void queryClient.invalidateQueries({
        queryKey: ["storefront", "navigation"],
      });
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      void queryClient.removeQueries({ queryKey: promotionKeys.all });
      void queryClient.removeQueries({ queryKey: loyaltyKeys.all });
      void queryClient.removeQueries({ queryKey: employeeBenefitsKeys.all });
      clearPromotions();
      setSyncing(true);

      // Each market has its own cart (the backend keeps one per market for the
      // same shopper). Load the new market's cart; the old market's lines must
      // never stay on screen under the new market's currency.
      const cartId = getStoredCartId();
      const authed = Boolean(getAccessToken());
      if (!cartId && !authed && !readGuestToken()) {
        clearCartLines();
        setSyncing(false);
        return;
      }

      const load = () =>
        (cartId ? getActiveCart(cartId) : getActiveCart(null)).catch(() =>
          createOrResolveCart({}),
        );
      const apply = (cart: Awaited<ReturnType<typeof getActiveCart>>) => {
        storeCartId(cart.cartId);
        setCartId(cart.cartId);
        setCartFromApi(cart);
        // The other market's bag is kept on the server: say so, so the shopper
        // does not think it was lost.
        if (
          previous &&
          previous.itemCount > 0 &&
          (cart.items?.length ?? 0) === 0
        ) {
          toast(
            `Your ${previous.marketName} bag is saved. Switch back to ${previous.marketName} to see it.`,
          );
        }
      };
      void load()
        .then(apply)
        .catch(
          () =>
            // One retry (e.g. the server was restarting); until then the bag is
            // shown empty rather than with the other market's prices.
            new Promise<void>((resolve) => {
              clearCartLines();
              window.setTimeout(() => {
                void load()
                  .then(apply)
                  .catch(() => {
                    // Soft failure: the next page load reads the cart again.
                  })
                  .finally(resolve);
              }, 3000);
            }),
        )
        .finally(() => setSyncing(false));
    },
    [
      clearCartLines,
      clearPromotions,
      queryClient,
      setCartFromApi,
      setCartId,
      setSyncing,
    ],
  );

  const setMarketId = useCallback(
    (id: string | null) => {
      if (!id || id === marketId) return;
      const market = shoppable.find((item) => item.zoneCode === id);
      const next = {
        ...(market
          ? contextFromMarket(market, pathLanguage)
          : { ...fallbackCatalogContext(id), languageCode: pathLanguage }),
      };
      selectMarket(id, next);
      writeZoneCookie(id);
      const previousMarket = shoppable.find(
        (item) => item.zoneCode === marketId,
      );
      refreshMarketScopedData({
        marketName: previousMarket?.name?.trim() || marketId || "",
        itemCount: useCartStore.getState().lines.length,
      });
      redrawForMarket();
    },
    [
      marketId,
      pathLanguage,
      redrawForMarket,
      refreshMarketScopedData,
      selectMarket,
      shoppable,
    ],
  );

  const contentLanguage = useMemo(() => {
    const selected = shoppable.find((market) => market.zoneCode === marketId);
    // No market list to read from: do not hold the page, ask with the address language.
    if (!selected) return marketsQuery.isError ? pathLanguage : null;
    // A market that does not offer this language has nothing published in it either.
    return (
      marketContentLanguage(selected.languages, pathLanguage) ?? pathLanguage
    );
  }, [marketId, marketsQuery.isError, pathLanguage, shoppable]);

  const value = useMemo(
    () => ({
      marketId,
      setMarketId,
      catalogContext,
      regionOptions,
      contentLanguage,
    }),
    [catalogContext, contentLanguage, marketId, regionOptions, setMarketId],
  );

  return (
    <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
  );
}

/** The market, or null outside MarketProvider (shared widgets, tests). */
export function useOptionalMarket() {
  return useContext(MarketContext);
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return ctx;
}
