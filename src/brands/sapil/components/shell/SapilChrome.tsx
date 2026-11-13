"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SapilBagDrawer } from "@/brands/sapil/components/bag/SapilBagDrawer";
import { useAnnouncementBar, useCmsGlobalRegion, useFooterContent } from "@/features/cms/hooks/useCmsGlobalRegion";
import { useMarketSettings } from "@/features/markets/hooks/useMarketSettings";
import { useStorefrontMarkets } from "@/features/markets/hooks/useStorefrontMarkets";
import { useNavigation } from "@/features/navigation";
import { GiftChoiceHost } from "@/features/promotions/components/GiftChoiceHost";
import { useHydrated } from "@/hooks/useHydrated";
import { useIsAuthenticated } from "@/hooks/useCurrentUser";
import { getBrand, localized } from "@/lib/brand";
import { stripLocalePrefix } from "@/lib/i18n/localePath";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useMarket } from "@/providers/MarketProvider";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilAnnouncement } from "./SapilAnnouncement";
import { SapilFooterView } from "./SapilFooter";
import { SapilHeader, type SapilLogo } from "./SapilHeader";
import { SapilLocaleSwitcher } from "./SapilLocaleSwitcher";
import { SapilPhoneMenu } from "./SapilPhoneMenu";
import { SapilSearchDialog } from "./SapilSearchDialog";
import { SapilShopBy, priceEditChip } from "./SapilShopBy";
import { SapilToastHost } from "./SapilToastHost";
import { footerColumnsFromNav, menuItemsFromNav, shopByChipsFromNav } from "./shellData";
import { useSapilPrice } from "../shared/useSapilPrice";

function useSapilLogo(): SapilLogo {
  const locale = useShopLocale();
  const brand = getBrand();
  return {
    src: brand.logo.src,
    alt: localized(brand.logo.alt, locale, brand.defaultLocale),
    width: brand.logo.width,
    height: brand.logo.height,
  };
}

/**
 * The Sapil chrome around every page: announcement, header, "Shop by" row, phone
 * menu, search, footer, toasts and the bag. Data comes from the shared hooks and stores.
 */
export function SapilChrome({ children, beforeFooter }: { children: ReactNode; beforeFooter?: ReactNode }) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const logo = useSapilLogo();
  const brandName = getBrand().name;
  const locale = useShopLocale();
  const pathname = stripLocalePrefix(usePathname() || "/");
  const { marketId } = useMarket();
  const { headerNav, footerItems, isLoading } = useNavigation(marketId || undefined);
  const settings = useMarketSettings();
  const announcement = useAnnouncementBar();
  // Both rows load in the browser once the market is known. Until their data
  // arrives, hold their height (server HTML included) so the page doesn't jump
  // (CLS); a market without them collapses the space once the answer is in.
  const announcementRegion = useCmsGlobalRegion("announcement-bar");
  const announcementPending = !announcementRegion.data && !announcementRegion.isError;
  const markets = useStorefrontMarkets();
  const shopByPending = (!markets.data && !markets.isError) || isLoading;
  const footer = useFooterContent();
  const isAuthenticated = useIsAuthenticated();
  const hydrated = useHydrated();
  const persistedCount = useCartStore((s) => s.itemCount());
  // The persisted bag lives in the browser: show its count after hydration.
  const bagCount = hydrated ? persistedCount : 0;
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  const menu = useMemo(() => menuItemsFromNav(headerNav), [headerNav]);
  const chips = useMemo(() => shopByChipsFromNav(headerNav), [headerNav]);
  const columns = useMemo(() => footerColumnsFromNav(footerItems), [footerItems]);
  const sale = priceEditChip(settings.priceEditTiers, settings.currencyCode, (amount) => t("shell.underPrice", { amount }), price);
  const accountHref = isAuthenticated ? "/account" : "/login";
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), [setSearchOpen]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-[8px] focus:start-[8px] focus:z-[90] focus:bg-sapil-white focus:px-[16px] focus:py-[10px] focus:rounded-full"
      >
        {t("common.skipToContent")}
      </a>
      {announcementPending ? (
        <div aria-hidden="true" data-sapil-reserve="announce" className="bg-sapil-p-mint h-[41px]" />
      ) : (
        <SapilAnnouncement items={announcement.items} intervalMs={announcement.rotationIntervalMs} />
      )}
      <SapilHeader
        logo={logo}
        menu={menu}
        menuLoading={isLoading}
        pathname={pathname}
        bagCount={bagCount}
        accountHref={accountHref}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenSearch={openSearch}
        onOpenBag={() => setCartOpen(true)}
      />
      {shopByPending ? (
        <div aria-hidden="true" data-sapil-reserve="shop-by" className="bg-sapil-white border-b border-sapil-line h-[55px] max-760:h-[53px]" />
      ) : (
        <SapilShopBy
          chips={chips}
          pathname={pathname}
          currency={settings.currencyCode}
          priceEditTiers={settings.priceEditTiers}
          freeDeliveryThreshold={settings.freeDeliveryThreshold}
          cashOnDelivery={settings.cashOnDelivery}
        />
      )}
      <SapilPhoneMenu
        open={menuOpen}
        onClose={closeMenu}
        logo={logo}
        menu={menu}
        quickLinks={[...chips, ...(sale ? [sale] : [])]}
        accountHref={accountHref}
        onOpenSearch={openSearch}
      />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      {beforeFooter}
      <SapilFooterView
        logo={logo}
        columns={columns}
        columnsLoading={isLoading}
        newsletterHeading={footer.newsletterHeading}
        newsletterPlaceholder={footer.newsletterPlaceholder}
        newsletterButtonLabel={footer.newsletterButtonLabel}
        copyright={footer.copyrightText || t("shell.copyright", { year: new Date().getFullYear(), brand: localized(brandName, locale) })}
        legalEnd={<SapilLocaleSwitcher />}
      />
      <SapilSearchDialog />
      <SapilToastHost />
      <SapilBagDrawer />
      <GiftChoiceHost />
    </div>
  );
}
