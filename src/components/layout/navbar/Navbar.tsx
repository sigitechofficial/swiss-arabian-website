"use client";

import { PRIMARY_NAV, type ChromeNavItem } from "@/features/home/constants/chromeNav";
import { useNavigation } from "@/features/navigation";
import { useMarket } from "@/providers/MarketProvider";
import { siteHeader } from "@/styles/siteChrome";
import type { NavbarVariant } from "./types";
import { useNavbarChrome } from "./useNavbarChrome";
import { NavbarMobile } from "./NavbarMobile";
import { NavbarPrimary } from "./NavbarPrimary";
import { NavbarShell } from "./NavbarShell";
import { NavbarTopbar } from "./NavbarTopbar";

const LP2_HIDDEN_MENUS = new Set(["Minis"]);

const LP5_NAV: ChromeNavItem[] = [
  ...PRIMARY_NAV.map((item) =>
    item.type === "link" && item.label === "Gift Sets" ? { ...item, accent: false } : item,
  ),
  { type: "link", label: "Offers", href: "/collections/best-sellers", accent: true },
];

export function Navbar({ variant = "classic" }: { variant?: NavbarVariant }) {
  const chrome = useNavbarChrome();
  // Selected country → its own menu (refetches when the country changes).
  const { marketId } = useMarket();
  const { chromeItems, isLoading } = useNavigation(marketId || undefined);
  const boutique = variant === "minimal";
  const navInShell = variant === "inline" || variant === "inline-locale";
  const designPreview = variant !== "minimal" && variant !== "classic";

  const base = designPreview
    ? boutique
      ? LP5_NAV
      : PRIMARY_NAV
    : chromeItems;

  const navItems = navInShell
    ? base.filter((item) => !LP2_HIDDEN_MENUS.has(item.label))
    : base;

  return (
    <header
      className={siteHeader}
      data-navbar={variant}
      aria-busy={!designPreview && isLoading && navItems.length === 0}
      data-home={chrome.pathname === "/" ? "true" : undefined}
      data-over-hero={chrome.pathname === "/" ? "true" : undefined}
      ref={chrome.headerRef}
    >
      <NavbarTopbar
        chrome={chrome}
        boutique={boutique}
        hideUtils={variant === "logo-center" || variant === "inline"}
      />
      <NavbarShell chrome={chrome} variant={variant} items={navItems} />
      {navInShell ? null : !designPreview && isLoading && navItems.length === 0 ? (
        <div className="flex gap-6 px-8 py-4" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} className="block h-3 w-16 animate-pulse bg-[var(--ink)]/15" />
          ))}
        </div>
      ) : (
        <NavbarPrimary chrome={chrome} items={navItems} />
      )}
      <NavbarMobile chrome={chrome} items={navItems} />
    </header>
  );
}
