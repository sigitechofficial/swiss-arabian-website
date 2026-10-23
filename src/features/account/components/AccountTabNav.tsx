"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  CreditCard,
  Gift,
  Heart,
  LayoutGrid,
  Repeat,
  MapPin,
  Package,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { stripLocalePrefix } from "@/lib/i18n/localePath";
import { accountTabNav } from "@/lib/navigation/storeNavigation";
import { accountTab, accountTabs, accountTabsList } from "@/styles/accountChrome";

import { accountContainer } from "../constants/accountLayout";

/** Same icons the dashboard shortcuts use, so a section looks the same wherever it is linked. */
const TAB_ICONS: Record<string, LucideIcon> = {
  "/account": LayoutGrid,
  "/account/orders": Package,
  "/account/profile": UserRound,
  "/account/addresses": MapPin,
  "/account/payments": CreditCard,
  "/account/rewards": Gift,
  "/account/wishlist": Heart,
  "/account/saved": Bookmark,
  "/account/subscription": Repeat,
};

export function AccountTabNav() {
  const pathname = stripLocalePrefix(usePathname() || "/");
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll only far enough to reveal the current section. Centering it clips the first tab.
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !current || list.scrollWidth <= list.clientWidth) {
      if (list) list.scrollLeft = 0;
      return;
    }
    const row = list.getBoundingClientRect();
    const tab = current.getBoundingClientRect();
    if (tab.left < row.left) {
      list.scrollLeft -= row.left - tab.left;
    } else if (tab.right > row.right) {
      list.scrollLeft += tab.right - row.right;
    }
  }, [pathname]);

  return (
    <nav className={accountTabs} aria-label="Account sections">
      <div className={`${accountContainer} ${accountTabsList}`} ref={listRef}>
        {accountTabNav.map((item) => {
          const active =
            item.href === "/account"
              ? pathname === "/account"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = TAB_ICONS[item.href];

          return (
            <LocaleLink
              key={item.href}
              href={item.href}
              className={accountTab}
              aria-current={active ? "page" : undefined}
            >
              {Icon ? <Icon size={14} strokeWidth={1.8} aria-hidden="true" /> : null}
              {item.label}
            </LocaleLink>
          );
        })}
      </div>
    </nav>
  );
}
