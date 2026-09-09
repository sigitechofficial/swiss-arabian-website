"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { TOPBAR_CURRENCIES, TOPBAR_LANGUAGES, TOPBAR_REGIONS } from "@/features/home/constants/chromeNav";
import { useMarket } from "@/providers/MarketProvider";

export function useNavbarChrome() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const persistedItemCount = useCartStore((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const itemCount = mounted ? persistedItemCount : 0;
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const [openUtil, setOpenUtil] = useState<"region" | "lang" | "currency" | null>(null);
  const [languageId, setLanguageId] = useState<(typeof TOPBAR_LANGUAGES)[number]["id"]>("en");
  const [currencyId, setCurrencyId] = useState<(typeof TOPBAR_CURRENCIES)[number]["id"]>("AED");
  const { marketId, setMarketId } = useMarket();
  const regionId = TOPBAR_REGIONS.find((region) => region.id === marketId)?.id ?? "UAE";
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeaderHeight = () => {
      const topbar = header.querySelector(".topbar");
      const shell = header.querySelector(".nav-shell");
      const nav = header.querySelector(".primary-nav");
      const navVisible =
        nav instanceof HTMLElement && getComputedStyle(nav).display !== "none";
      const height =
        (topbar?.getBoundingClientRect().height ?? 0) +
        (shell?.getBoundingClientRect().height ?? 0) +
        (navVisible ? nav.getBoundingClientRect().height : 0);
      document.documentElement.style.setProperty(
        "--site-header-h",
        `${Math.round(height)}px`,
      );
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

  return {
    headerRef,
    isAuthenticated,
    itemCount,
    setCartOpen,
    setSearchOpen,
    searchOpen,
    openMega,
    setOpenMega,
    mobileOpen,
    setMobileOpen,
    mobileGroup,
    setMobileGroup,
    openUtil,
    setOpenUtil,
    languageId,
    setLanguageId,
    currencyId,
    setCurrencyId,
    regionId,
    setMarketId,
  };
}

export type NavbarChrome = ReturnType<typeof useNavbarChrome>;
