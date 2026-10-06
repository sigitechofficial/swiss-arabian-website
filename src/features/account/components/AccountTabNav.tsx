"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { accountTabNav } from "@/lib/navigation/storeNavigation";

import { accountContainer } from "../constants/accountLayout";

export function AccountTabNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-sa-border bg-surface"
      aria-label="Account sections"
    >
      <div className={`${accountContainer} flex gap-6 overflow-x-auto sm:gap-8`}>
        {accountTabNav.map((item) => {
          const active =
            item.href === "/account"
              ? pathname === "/account"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative shrink-0 py-[15px] text-[12.5px] whitespace-nowrap transition-colors ${
                active
                  ? "font-semibold text-sa-primary"
                  : "font-normal text-sa-secondary hover:text-sa-primary"
              }`}
            >
              {item.label}
              {active ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-terra"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
