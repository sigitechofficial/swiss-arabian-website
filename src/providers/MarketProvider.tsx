"use client";

import { useLocaleConfig, useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { toast } from "@/components/ui/Toaster";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { dir as textDirection } from "@/lib/i18n/locales";
import {
  marketLanguageOptions,
  type LanguageOption,
} from "@/features/markets/utils/marketLanguageOptions";
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
  answerCountrySuggestion,
  readMarketChoice,
  readZoneCookie,
  storedZoneFor,
  writeMarketChoice,
  writeZoneCookie,
} from "@/features/markets/utils/zoneCookie";
import type { StorefrontMarket } from "@/features/markets/types/market";
import { marketPageUrl } from "@/features/markets/utils/marketSiteUrl";
import {
  choiceServedHere,
  marketOfAddress,
  marketsOnAddress,
} from "@/features/markets/utils/marketsOnAddress";
import { employeeBenefitsKeys } from "@/features/employeeBenefits/api/employeeBenefits.keys";
import { loyaltyKeys } from "@/features/loyalty/api/loyalty.keys";
import { promotionKeys } from "@/features/promotions/api/promotions.keys";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore, type PersistedCatalogContext } from "@/stores/useUiStore";
import { filterMarketsForTenant } from "@/lib/storefront/brand";
import { useStorefrontHost } from "@/lib/storefront/StorefrontHostProvider";
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
  /** Language picker: the selected market's languages, else every configured one. */
  languageOptions: LanguageOption[];
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
  // The route's language: on a provider's fixed return address
  // (`/payments/tabby/return?lang=ar`) the address has no prefix, but the page
  // is served in the shopper's language and must stay in it.
  const pathLanguage = useShopLocale();
  const localeConfig = useLocaleConfig();
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
  const storefrontHost = useStorefrontHost();

  useEffect(() => {
    // The UI store skips automatic hydration; load it once on the client.
    void useUiStore.persist.rehydrate();
  }, []);

  const shoppable = useMemo(() => {
    const list = marketsQuery.data?.markets ?? [];
    const ready = list.filter((market) => market.isCatalogReady);
    const pool = ready.length ? ready : list;
    const filtered = filterMarketsForTenant(pool, storefrontHost);
    const markets = filtered.length ? filtered : pool;
    // On a market website the address decides the market (the picker offers
    // the markets reached from it); the shared address offers the ones it serves.
    return marketsOnAddress(markets, marketsQuery.data ?? {});
  }, [marketsQuery.data, storefrontHost]);

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

  useEffect(() => {
    if (!hydrated) return;

    const saved = useUiStore.getState().selectedMarketId || readZoneCookie();

    if (!marketsQuery.data) {
      // Before the brand's markets are known, only this site's own store (per
      // origin) is trusted: a cookie can come from another brand served on the
      // same host (another port locally, a sibling deployment on staging).
      const own = useUiStore.getState().selectedMarketId;
      if (own && !useUiStore.getState().catalogContext) {
        selectMarket(own, {
          ...fallbackCatalogContext(own),
          languageCode: pathLanguage,
        });
        writeZoneCookie(own);
      }
      return;
    }

    if (!shoppable.length) {
      return;
    }

    // A market website's own market always wins (no saved choice overrides
    // the address); elsewhere a stored zone counts only if it is one of this
    // brand's markets.
    const siteMarket = marketsQuery.data.siteMarketCode;
    // On the shared address, a page under `/~KWT` is that market's: the address
    // decides, as on a market website (the proxy drew it for that market).
    const addressMarket = siteMarket
      ? null
      : marketOfAddress(shoppable, marketsQuery.data, window.location.pathname);
    // Else a choice of a market it serves (the picker here), as the proxy reads it.
    const choiceHere = choiceServedHere(
      shoppable,
      marketsQuery.data,
      siteMarket ? null : readMarketChoice(),
    );
    const stored =
      siteMarket ||
      addressMarket ||
      choiceHere ||
      storedZoneFor(saved, shoppable.map((market) => market.zoneCode));
    const pick =
      shoppable.find((market) => market.zoneCode === stored) ??
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

    // The page is another market's than the one this browser was in (several
    // markets share the shared address's storage): its bag and market data follow.
    const previous = current.selectedMarketId
      ? shoppable.find((market) => market.zoneCode === current.selectedMarketId)
      : undefined;
    selectMarket(pick.zoneCode, nextCtx);
    if (current.selectedMarketId && current.selectedMarketId !== pick.zoneCode) {
      refreshMarketScopedData({
        marketName: previous?.name?.trim() || current.selectedMarketId,
        itemCount: useCartStore.getState().lines.length,
      });
    }
    syncServer();
  }, [
    hydrated,
    marketsQuery.data,
    pathLanguage,
    redrawForMarket,
    refreshMarketScopedData,
    shoppable,
    selectMarket,
  ]);

  // The server sets lang and dir on a full load only. Moving between an Arabic page
  // and an English-only one (sign in, checkout) is a client navigation, so follow it here.
  useEffect(() => {
    const root = document.documentElement;
    const dir = textDirection(pathLanguage);
    if (root.lang !== pathLanguage) root.lang = pathLanguage;
    if (root.dir !== dir) root.dir = dir;
  }, [pathLanguage]);

  const setMarketId = useCallback(
    (id: string | null) => {
      if (!id || id === marketId) return;
      // The shopper's own choice: the country suggestion is answered.
      answerCountrySuggestion(id);
      const market = shoppable.find((item) => item.zoneCode === id);
      // A market with its own website, or one the brand's shared address serves
      // (its `/~CODE` address): go there, same page and language. Its bag, prices
      // and sign-in belong to that address.
      const elsewhere = market
        ? marketPageUrl(market, marketsQuery.data?.sharedSiteUrl, {
            origin: window.location.origin,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
          })
        : null;
      if (elsewhere) {
        // Remembered for the brand's root domain (it sends the shopper back here).
        writeMarketChoice(id, marketsQuery.data?.brandDomain);
        window.location.assign(elsewhere);
        return;
      }
      const next = {
        ...(market
          ? contextFromMarket(market, pathLanguage)
          : { ...fallbackCatalogContext(id), languageCode: pathLanguage }),
      };
      selectMarket(id, next);
      writeZoneCookie(id);
      // On the shared address the choice is kept on the brand's domain too: the
      // root domain reads it first (a market link may have left another there).
      if (!marketsQuery.data?.siteMarketCode) {
        writeMarketChoice(id, marketsQuery.data?.brandDomain);
      }
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
      marketsQuery.data?.brandDomain,
      marketsQuery.data?.sharedSiteUrl,
      marketsQuery.data?.siteMarketCode,
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

  const languageOptions = useMemo(() => {
    const selected = shoppable.find((market) => market.zoneCode === marketId);
    return marketLanguageOptions(selected?.languages, pathLanguage, localeConfig);
  }, [marketId, pathLanguage, shoppable, localeConfig]);

  const value = useMemo(
    () => ({
      marketId,
      setMarketId,
      catalogContext,
      regionOptions,
      contentLanguage,
      languageOptions,
    }),
    [catalogContext, contentLanguage, languageOptions, marketId, regionOptions, setMarketId],
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
