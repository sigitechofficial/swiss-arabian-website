"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useColorMode } from "@/providers/ThemeProvider";
import { useUiStore } from "@/stores/useUiStore";
import { homeAssets } from "@/features/home/constants/homeAssets";
import { DesktopNav } from "./DesktopNav";
import { IconCart, IconPin, IconSearch, IconTheme, IconUser } from "./HeaderIcons";

/**
 * Global header — matches prototype Landing Page 001
 * logo · search · Login · Stores · theme · cart · burger (< lg)
 * desktop nav row from lg+ (with dropdowns matching mobile hierarchy)
 * Category nav is hidden on /account so account tabs own that chrome.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isAccountSection = pathname.startsWith("/account");
  const itemCount = useCartStore((s) =>
    s.lines.reduce((sum, line) => sum + line.quantity, 0),
  );
  const { toggleMode, mode } = useColorMode();
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const cartOpen = useUiStore((s) => s.cartOpen);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    function onScroll() {
      setElevated(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-page text-sa-primary transition-shadow duration-300 ${
        elevated
          ? "shadow-[0_1px_0_rgba(44,36,29,0.06),0_8px_20px_rgba(44,36,29,0.06)] dark:shadow-[0_1px_0_rgba(0,0,0,0.35),0_8px_20px_rgba(0,0,0,0.25)]"
          : "shadow-none"
      }`}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-5 px-4 py-3.5 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="relative h-[50px] w-[90px] shrink-0"
          aria-label="Swiss Arabian home"
        >
          <Image
            src={homeAssets.logo}
            alt="Swiss Arabian"
            fill
            priority
            className="site-logo object-contain object-left"
            sizes="90px"
          />
        </Link>

        <div className="ml-auto flex items-center gap-5">
          <label className="hidden items-center gap-2.5 border border-bone bg-cream px-4 py-2 md:flex dark:bg-section-soft dark:border-sa-input">
            <IconSearch />
            <span className="sr-only">Search products</span>
            <input
              type="search"
              placeholder="What are you looking for?"
              className="w-40 bg-transparent font-sans text-[12.4px] text-sa-muted outline-none placeholder:text-sa-muted"
              aria-label="Search products"
            />
          </label>

          <Link
            href={isAuthenticated ? "/account" : "/login"}
            className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide"
            aria-label={isAuthenticated ? "Account" : "Login"}
          >
            <IconUser />
            {isAuthenticated ? "Account" : "Login"}
          </Link>

          <Link
            href="/stores"
            className="hidden items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide lg:flex"
            aria-label="Stores"
          >
            <IconPin />
            Stores
          </Link>

          <button
            type="button"
            onClick={toggleMode}
            className="flex size-9 items-center justify-center text-sa-primary transition-opacity hover:opacity-70"
            aria-label="Toggle dark mode"
            aria-pressed={mode === "dark"}
          >
            <IconTheme />
          </button>

          <button
            type="button"
            className="relative flex size-9 items-center justify-center pt-1"
            aria-label={`Cart, ${itemCount} items`}
            aria-controls="cart-sheet"
            aria-expanded={cartOpen}
            onClick={() => setCartOpen(true)}
          >
            <IconCart />
            <span className="absolute right-0 top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-terra px-1 text-[10px] font-bold text-white">
              {itemCount}
            </span>
          </button>

          {!isAccountSection ? (
            <button
              type="button"
              className="flex size-9 flex-col items-center justify-center gap-[5px] lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              aria-controls="nav-sheet"
              onClick={() => setMobileNavOpen(true)}
            >
              <span className="h-[2px] w-5 bg-sa-primary" />
              <span className="h-[2px] w-5 bg-sa-primary" />
              <span className="h-[2px] w-5 bg-sa-primary" />
            </button>
          ) : null}
        </div>
      </div>

      {!isAccountSection ? <DesktopNav /> : null}
    </header>
  );
}
