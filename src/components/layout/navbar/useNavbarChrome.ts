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

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const SHRINK_AT = 40;
    const RESTORE_AT = 0;
    const TOPBAR_HIDE_AFTER = 48;
    const DIR_DELTA = 8;
    let condensed = false;
    let topbarHidden = false;
    let lastY = window.scrollY;
    let overHero = header.getAttribute("data-home") === "true";
    let frame = 0;

    const apply = (next: boolean) => {
      if (next === condensed) return;
      condensed = next;
      header.dataset.scrolled = next ? "true" : "false";
    };

    const applyTopbarHidden = (next: boolean) => {
      if (next === topbarHidden) return;
      topbarHidden = next;
      header.dataset.topbarHidden = next ? "true" : "false";
    };

    const applyOverHero = (next: boolean) => {
      if (next === overHero) return;
      overHero = next;
      header.dataset.overHero = next ? "true" : "false";
    };

    const syncTopbarHeight = () => {
      if (topbarHidden) return;
      const topbar = header.querySelector(".topbar");
      const height = topbar?.getBoundingClientRect().height ?? 0;
      if (height) header.style.setProperty("--topbar-h", `${Math.round(height)}px`);
    };

    const read = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      apply(condensed ? y > RESTORE_AT : y > SHRINK_AT);
      const goingDown = y > lastY + DIR_DELTA;
      const goingUp = y < lastY - DIR_DELTA;
      if (y <= RESTORE_AT) applyTopbarHidden(false);
      else if (goingDown && y > TOPBAR_HIDE_AFTER) applyTopbarHidden(true);
      else if (goingUp) applyTopbarHidden(false);
      lastY = y;
      if (header.getAttribute("data-home") !== "true") {
        applyOverHero(false);
        return;
      }
      const hero = document.querySelector(".landing > .hero");
      if (!(hero instanceof HTMLElement)) {
        applyOverHero(y <= RESTORE_AT);
        return;
      }
      applyOverHero(hero.getBoundingClientRect().bottom > header.getBoundingClientRect().bottom);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };

    header.dataset.overHero = overHero ? "true" : "false";
    header.dataset.topbarHidden = "false";
    syncTopbarHeight();
    apply(window.scrollY > SHRINK_AT);
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let frozen = 0;

    const measureExpanded = (allowShrink = false) => {
      // Never sample the condensed/mid-transition header. Writing those
      // heights into --site-header-h resizes the spacer + hero and the
      // page jumps when scrolling back to the top.
      if (header.getAttribute("data-scrolled") === "true") return;
      const topbar = header.querySelector(".topbar");
      const shell = header.querySelector(".nav-shell");
      const nav = header.querySelector(".primary-nav");
      const navVisible =
        nav instanceof HTMLElement && getComputedStyle(nav).display !== "none";
      const height = Math.round(
        (topbar?.getBoundingClientRect().height ?? 0) +
          (shell?.getBoundingClientRect().height ?? 0) +
          (navVisible ? nav.getBoundingClientRect().height : 0),
      );
      if (!height) return;
      if (!allowShrink && frozen && height < frozen - 1) return;
      if (height === frozen) return;
      frozen = height;
      document.documentElement.style.setProperty("--site-header-h", `${frozen}px`);
    };

    measureExpanded(true);
    const onResize = () => measureExpanded(true);
    window.addEventListener("resize", onResize);
    void document.fonts?.ready.then(() => measureExpanded(true));
    const images = header.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", onResize, { once: true });
    });
    return () => {
      window.removeEventListener("resize", onResize);
      images.forEach((img) => img.removeEventListener("load", onResize));
    };
  }, []);

  return {
    headerRef,
    pathname,
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
