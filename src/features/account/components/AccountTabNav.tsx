"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  CreditCard,
  Crown,
  Gift,
  Heart,
  LayoutGrid,
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
  "/account/membership": Crown,
  "/account/wishlist": Heart,
  "/account/saved": Bookmark,
};

export function AccountTabNav() {
  const pathname = stripLocalePrefix(usePathname() || "/");
  const listRef = useRef<HTMLDivElement>(null);

  // Where the row scrolls (phones, tablets), bring the current section to the middle.
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !current || list.scrollWidth <= list.clientWidth) return;
    const row = list.getBoundingClientRect();
    const tab = current.getBoundingClientRect();
    list.scrollLeft += tab.left + tab.width / 2 - (row.left + row.width / 2);
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
