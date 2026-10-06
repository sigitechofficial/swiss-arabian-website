"use client";

import { iconBtn, navStart, navStartSearch, navToggle, visuallyHidden } from "@/styles/siteChrome";
import { SearchIcon } from "./NavbarIcons";
import type { NavbarChrome } from "./useNavbarChrome";

export function NavbarStart({ chrome }: { chrome: NavbarChrome }) {
  return (
    <div className={navStart} data-nav-start>
      <button
        className={navToggle}
        type="button"
        aria-label={chrome.mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={chrome.mobileOpen}
        aria-controls="mobile-nav"
        onClick={() => chrome.setMobileOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
        <span className={visuallyHidden}>
          {chrome.mobileOpen ? "Close menu" : "Open menu"}
        </span>
      </button>
      <button
        className={`${iconBtn} ${navStartSearch}`}
        data-icon-btn
        type="button"
        aria-label="Search"
        aria-expanded={chrome.searchOpen}
        aria-controls="ai-search"
        onClick={() => chrome.setSearchOpen(true)}
      >
        <SearchIcon />
      </button>
    </div>
  );
}
