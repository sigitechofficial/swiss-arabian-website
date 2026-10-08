"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { bagCount, iconBtn, navActions, navUtils, navUtilsSearch, visuallyHidden } from "@/styles/siteChrome";
import { AccountIcon, BagIcon, SearchIcon } from "./NavbarIcons";
import type { NavbarChrome } from "./useNavbarChrome";

export function NavbarActions({
  chrome,
  hideSearch = false,
}: {
  chrome: NavbarChrome;
  hideSearch?: boolean;
}) {
  return (
    <div className={navActions} data-nav-actions>
      <LocaleLink
        className={iconBtn}
        data-icon-btn
        href={chrome.isAuthenticated ? "/account" : "/login"}
        aria-label="Account"
      >
        <AccountIcon />
      </LocaleLink>
      <div className={navUtils}>
        {hideSearch ? null : (
          <button
            className={`${iconBtn} ${navUtilsSearch}`}
            data-icon-btn
            data-nav-utils-search
            type="button"
            aria-label="Search"
            aria-expanded={chrome.searchOpen}
            aria-controls="ai-search"
            onClick={() => chrome.setSearchOpen(true)}
          >
            <SearchIcon />
          </button>
        )}
        <button
          className={iconBtn}
          data-icon-btn
          type="button"
          aria-label="Bag"
          aria-controls="cart-drawer"
          onClick={() => chrome.setCartOpen(true)}
        >
          <BagIcon />
          <span className={bagCount} hidden={chrome.itemCount < 1} aria-hidden={chrome.itemCount < 1}>
            {chrome.itemCount}
          </span>
          <span className={visuallyHidden}>Bag ({chrome.itemCount} items)</span>
        </button>
      </div>
    </div>
  );
}
