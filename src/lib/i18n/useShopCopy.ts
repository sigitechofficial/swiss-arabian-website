"use client";

import { usePathname } from "next/navigation";
import { localeFromPathname } from "./localePath";
import { shopCopy, type ShopCopyKey } from "./shopCopy";

export function useShopCopy() {
  const locale = localeFromPathname(usePathname() || "/");
  return (key: ShopCopyKey) => shopCopy(locale, key);
}
