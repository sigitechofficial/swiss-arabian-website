"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { bagCount, bagCountOnTool, navActions, navActionsBoutique, navTool, navToolIcon, navToolLabel, navToolSep } from "@/styles/siteChrome";
import { AccountIcon, BagIcon, HeartIcon } from "./NavbarIcons";
import type { NavbarChrome } from "./useNavbarChrome";

export function NavbarBoutiqueActions({ chrome }: { chrome: NavbarChrome }) {
  const t = useShopCopy();
  return (
    <div className={`${navActions} ${navActionsBoutique}`} data-nav-actions>
      <LocaleLink
        className={navTool}
        href={chrome.isAuthenticated ? "/account" : "/login"}
        aria-label={t("nav.account")}
      >
        <AccountIcon />
        <span className={navToolLabel}>{t("nav.account")}</span>
      </LocaleLink>
      <LocaleLink className={navTool} href="/account/wishlist" aria-label={t("account.tab.wishlist")}>
        <HeartIcon />
        <span className={navToolLabel}>{t("account.tab.wishlist")}</span>
      </LocaleLink>
      <span className={navToolSep} aria-hidden="true" />
      <button
        className={navTool}
        type="button"
        aria-haspopup="dialog"
        aria-label={chrome.itemCount > 0 ? t("nav.cartCount", { count: chrome.itemCount }) : t("nav.cart")}
        onClick={() => chrome.setCartOpen(true)}
      >
        <span className={navToolIcon}>
          <BagIcon />
          <span className={`${bagCount} ${bagCountOnTool}`} hidden={chrome.itemCount < 1} aria-hidden={chrome.itemCount < 1}>
            {chrome.itemCount}
          </span>
        </span>
        <span className={navToolLabel}>{t("nav.cart")}</span>
      </button>
    </div>
  );
}
