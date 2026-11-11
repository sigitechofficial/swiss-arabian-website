import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import type { NavItem } from "../types/navigation";

/**
 * Menus imported from Shopify keep the old store's addresses
 * (/pages/faqs, /blogs/blog, /pages/store-locator, nested product URLs …).
 * Those addresses redirect, so menu links point straight at the page instead:
 * no redirect hop for shoppers or crawlers. Other links stay as they are.
 */
export function directNavHref(href: string | null): string | null {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return href;
  const [path, rest = ""] = href.split(/(?=[?#])/, 2);
  const target = shopifyLegacyRedirect(path);
  return target ? `${target}${rest}` : href;
}

export function withDirectNavHrefs(items: readonly NavItem[]): NavItem[] {
  return items.map((item) => ({
    ...item,
    href: directNavHref(item.href),
    ...(item.children ? { children: withDirectNavHrefs(item.children) } : {}),
  }));
}
