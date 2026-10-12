"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { usePathname } from "next/navigation";

import { stripLocalePrefix } from "@/lib/i18n/localePath";
import { accountTabNav } from "@/lib/navigation/storeNavigation";
import { accountTab, accountTabs, accountTabsList } from "@/styles/accountChrome";

import { accountContainer } from "../constants/accountLayout";

export function AccountTabNav() {
  const pathname = stripLocalePrefix(usePathname() || "/");

  return (
    <nav className={accountTabs} aria-label="Account sections">
      <div className={`${accountContainer} ${accountTabsList}`}>
        {accountTabNav.map((item) => {
          const active =
            item.href === "/account"
              ? pathname === "/account"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <LocaleLink
              key={item.href}
              href={item.href}
              className={accountTab}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </LocaleLink>
          );
        })}
      </div>
    </nav>
  );
}
