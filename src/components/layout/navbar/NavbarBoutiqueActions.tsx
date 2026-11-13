"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { bagCount, bagCountOnTool, navActions, navActionsBoutique, navTool, navToolIcon, navToolLabel, navToolSep } from "@/styles/siteChrome";
import { AccountIcon, BagIcon, HeartIcon } from "./NavbarIcons";
import type { NavbarChrome } from "./useNavbarChrome";

export function NavbarBoutiqueActions({ chrome }: { chrome: NavbarChrome }) {
  return (
    <div className={`${navActions} ${navActionsBoutique}`} data-nav-actions>
      <LocaleLink
        className={navTool}
        href={chrome.isAuthenticated ? "/account" : "/login"}
        aria-label="Account"
      >
        <AccountIcon />
        <span className={navToolLabel}>Account</span>
      </LocaleLink>
      <LocaleLink className={navTool} href="/account/wishlist" aria-label="Wishlist">
        <HeartIcon />
        <span className={navToolLabel}>Wishlist</span>
      </LocaleLink>
      <span className={navToolSep} aria-hidden="true" />
      <button
        className={navTool}
        type="button"
        aria-haspopup="dialog"
        aria-label={chrome.itemCount > 0 ? `Cart, ${chrome.itemCount} items` : "Cart"}
        onClick={() => chrome.setCartOpen(true)}
      >
        <span className={navToolIcon}>
          <BagIcon />
          <span className={`${bagCount} ${bagCountOnTool}`} hidden={chrome.itemCount < 1} aria-hidden={chrome.itemCount < 1}>
            {chrome.itemCount}
          </span>
        </span>
        <span className={navToolLabel}>Cart</span>
      </button>
    </div>
  );
}
