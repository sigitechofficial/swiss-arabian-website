"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
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
  const t = useShopCopy();
  return (
    <div className={navActions} data-nav-actions>
      <LocaleLink
        className={iconBtn}
        data-icon-btn
        href={chrome.isAuthenticated ? "/account" : "/login"}
        aria-label={t("nav.account")}
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
            aria-label={t("nav.search")}
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
          aria-label={t("nav.bag")}
          aria-haspopup="dialog"
          onClick={() => chrome.setCartOpen(true)}
        >
          <BagIcon />
          <span className={bagCount} hidden={chrome.itemCount < 1} aria-hidden={chrome.itemCount < 1}>
            {chrome.itemCount}
          </span>
          <span className={visuallyHidden}>{t("nav.bagCount", { count: chrome.itemCount })}</span>
        </button>
      </div>
    </div>
  );
}
