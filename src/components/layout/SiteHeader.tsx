"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/useCartStore";
import { useColorMode } from "@/providers/ThemeProvider";
import { useUiStore } from "@/stores/useUiStore";
import { homeAssets } from "@/features/home/constants/homeAssets";
import { DesktopNav } from "./DesktopNav";
import { IconCart, IconPin, IconSearch, IconTheme, IconUser } from "./HeaderIcons";

/**
 * Global header — matches prototype Landing Page 001
 * logo · search · Login · Stores · theme · cart · burger (< lg)
 * desktop nav row from lg+ (with dropdowns matching mobile hierarchy)
 */
export function SiteHeader() {
  const itemCount = useCartStore((s) =>
    s.lines.reduce((sum, line) => sum + line.quantity, 0),
  );
  const { toggleMode, mode } = useColorMode();
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const cartOpen = useUiStore((s) => s.cartOpen);
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sa-border bg-page text-sa-primary">
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
            href="/login"
            className="hidden items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide sm:flex"
            aria-label="Login"
          >
            <IconUser />
            Login
          </Link>

          <Link
            href="/search"
            className="hidden items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide sm:flex"
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
            className="relative"
            aria-label={`Cart, ${itemCount} items`}
            aria-controls="cart-sheet"
            aria-expanded={cartOpen}
            onClick={() => setCartOpen(true)}
          >
            <IconCart />
            <span className="absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-terra px-1 text-[10px] font-bold text-white">
              {itemCount}
            </span>
          </button>

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
        </div>
      </div>

      <DesktopNav />
    </header>
  );
}
