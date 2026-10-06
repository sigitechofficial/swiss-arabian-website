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
  const { chromeItems } = useNavigation(marketId || undefined);
  const boutique = variant === "minimal";
  const navInShell = variant === "inline" || variant === "inline-locale";

  // Menus come from `/storefront/navigation`; the static menu is the fallback
  // for the first paint and for any API failure, so the header is never bare.
  // The synthetic "Offers" entry only applies to that fallback — once the CMS
  // is driving the nav, its own list is the source of truth.
  const base = chromeItems.length
    ? chromeItems
    : boutique
      ? LP5_NAV
      : PRIMARY_NAV;

  const navItems = navInShell
    ? base.filter((item) => !LP2_HIDDEN_MENUS.has(item.label))
    : base;

  return (
    <header
      className={siteHeader}
      data-navbar={variant}
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
      {navInShell ? null : <NavbarPrimary chrome={chrome} items={navItems} />}
      <NavbarMobile chrome={chrome} items={navItems} />
    </header>
  );
}
