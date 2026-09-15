"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { TOPBAR_LANGUAGES, TOPBAR_REGIONS } from "@/features/home/constants/chromeNav";
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
  const pathname = usePathname();

  useEffect(() => {
    setOpenMega(null);
    setMobileOpen(false);
    setMobileGroup(null);
  }, [pathname]);
  const [openUtil, setOpenUtil] = useState<"region" | "lang" | null>(null);
  const [languageId, setLanguageId] = useState<(typeof TOPBAR_LANGUAGES)[number]["id"]>("en");
  const { marketId, setMarketId, regionOptions } = useMarket();
  const regionId =
    marketId ||
    regionOptions[0]?.id ||
    TOPBAR_REGIONS[0].id;
  const headerRef = useRef<HTMLElement>(null);
  // Past this many pixels the header condenses: ticker bar out, logo smaller.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const SHRINK_AT = 40;
    const RESTORE_AT = 8;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      // Hysteresis: the header changes height, so a single threshold would
      // flip-flop as the page reflows under it.
      setScrolled((current) => (current ? y > RESTORE_AT : y > SHRINK_AT));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };
    // Deferred, not called inline: a sync setState in an effect body
    // triggers a cascading render.
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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

    let debounce = 0;
    const syncAfterMotion = () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(syncHeaderHeight, 80);
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncAfterMotion);
    observer.observe(header);
    header.addEventListener("transitionend", syncAfterMotion);
    window.addEventListener("resize", syncHeaderHeight);
    return () => {
      observer.disconnect();
      header.removeEventListener("transitionend", syncAfterMotion);
      window.removeEventListener("resize", syncHeaderHeight);
      window.clearTimeout(debounce);
    };
  }, [scrolled]);

  return {
    headerRef,
    scrolled,
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
    regionId,
    regionOptions,
    setMarketId,
  };
}

export type NavbarChrome = ReturnType<typeof useNavbarChrome>;
