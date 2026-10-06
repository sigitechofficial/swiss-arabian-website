"use client";

import Link from "next/link";
import { bagCount, bagCountOnTool, navActions, navActionsBoutique, navTool, navToolIcon, navToolLabel, navToolSep } from "@/styles/siteChrome";
import { AccountIcon, BagIcon, HeartIcon } from "./NavbarIcons";
import type { NavbarChrome } from "./useNavbarChrome";

export function NavbarBoutiqueActions({ chrome }: { chrome: NavbarChrome }) {
  return (
    <div className={`${navActions} ${navActionsBoutique}`} data-nav-actions>
      <Link
        className={navTool}
        href={chrome.isAuthenticated ? "/account" : "/login"}
      >
        <AccountIcon />
        <span className={navToolLabel}>Account</span>
      </Link>
      <Link className={navTool} href="/account/wishlist">
        <HeartIcon />
        <span className={navToolLabel}>Wishlist</span>
      </Link>
      <span className={navToolSep} aria-hidden="true" />
      <button
        className={navTool}
        type="button"
        aria-controls="cart-drawer"
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
