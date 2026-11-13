"use client";

import { iconBtn, navStart, navStartSearch, navToggle, visuallyHidden } from "@/styles/siteChrome";
import { SearchIcon } from "./NavbarIcons";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { NavbarChrome } from "./useNavbarChrome";

export function NavbarStart({ chrome }: { chrome: NavbarChrome }) {
  const t = useShopCopy();
  return (
    <div className={navStart} data-nav-start>
      <button
        className={navToggle}
        type="button"
        aria-label={chrome.mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        aria-expanded={chrome.mobileOpen}
        aria-controls="mobile-nav"
        onClick={() => chrome.setMobileOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
        <span className={visuallyHidden}>
          {chrome.mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        </span>
      </button>
      <button
        className={`${iconBtn} ${navStartSearch}`}
        data-icon-btn
        type="button"
        aria-label={t("nav.search")}
        aria-expanded={chrome.searchOpen}
        aria-controls="ai-search"
        onClick={() => chrome.setSearchOpen(true)}
      >
        <SearchIcon />
      </button>
    </div>
  );
}
