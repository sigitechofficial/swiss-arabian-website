import { useMemo } from "react";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useQuery } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { useUiStore } from "@/stores/useUiStore";
import type { MobileNavItem, MobileNavLink } from "@/features/home/constants/homeAssets";
import type { ChromeNavItem } from "@/features/home/constants/chromeNav";
import { fetchNavigation } from "../api/navigation.service";
import { apiNavToChromeNav } from "../utils/toChromeNav";
import { withDirectNavHrefs } from "../utils/directNavHrefs";
import { withoutDisabledSections } from "../utils/brandSections";
import type { NavItem, NavigationPayload } from "../types/navigation";

type MobileNavHeading = { label: string; kind: "heading" };

function flattenNavChildren(
  children: NavItem[],
): Array<MobileNavLink | MobileNavHeading> {
  const result: Array<MobileNavLink | MobileNavHeading> = [];

  for (const child of children) {
    if (child.type === "GROUP_HEADER") {
      result.push({ label: child.label, kind: "heading" });
      for (const grandchild of child.children ?? []) {
        if (grandchild.href) {
          result.push({ label: grandchild.label, href: grandchild.href });
        }
      }
    } else if (child.href) {
      result.push({ label: child.label, href: child.href });
    }
  }

  return result;
}

export function apiNavToMobileNav(items: NavItem[]): MobileNavItem[] {
  const result: MobileNavItem[] = [];

  for (const item of items) {
    if (item.type === "GROUP_HEADER") continue;

    if (item.children?.length) {
      result.push({
        type: "group",
        label: item.label,
        href: item.href ?? undefined,
        children: flattenNavChildren(item.children),
      });
    } else if (item.href) {
      result.push({ type: "link", label: item.label, href: item.href });
    }
  }

  return result;
}

type UseNavigationReturn = {
  /** Drawer/mobile shape. */
  headerItems: MobileNavItem[];
  /** Desktop chrome shape, incl. mega panels. Empty until loaded — callers
   *  fall back to the static menu so the header never renders bare. */
  chromeItems: ChromeNavItem[];
  footerItems: NavItem[];
  /** The header menu as the API sends it (with direct links), for brand chromes. */
  headerNav: NavItem[];
  /** The market's "Shop by" menu (direct links, switched-off sections removed);
   *  empty when the market has none or the backend doesn't send it. */
  shopByNav: NavItem[];
  isLoading: boolean;
  isCatalogFallback: boolean;
};

/** The payload's "Shop by" menu, prepared like the header and footer (direct
 *  hrefs, no links into switched-off sections). Missing or malformed → empty. */
export function shopByNavFrom(data: Pick<NavigationPayload, "shopBy"> | null | undefined): NavItem[] {
  const items = data?.shopBy;
  if (!Array.isArray(items) || !items.length) return [];
  return withoutDisabledSections(withDirectNavHrefs(items));
}

/** 4xx (e.g. 422 "context could not be resolved" for a zone the backend
 *  hasn't configured) won't succeed on retry — only retry server errors. */
function retryServerErrors(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function useNavigation(zoneCode?: string | null): UseNavigationReturn {
  const zone = zoneCode?.trim() ?? "";
  const salesChannelCode = useUiStore((s) =>
    s.catalogContext?.zoneCode === zone ? s.catalogContext.salesChannelCode : "",
  );
  // The menu is translated, so a language change is a different menu.
  const language = useShopLocale();
  const zoneQuery = useQuery({
    queryKey: ["storefront", "navigation", zone, salesChannelCode ?? "", language],
    queryFn: () => fetchNavigation(zone),
    enabled: Boolean(zone),
    placeholderData: (previous, previousQuery) => {
      const key = previousQuery?.queryKey ?? [];
      if (!zone || !key.includes(zone)) return undefined;
      return previous;
    },
    staleTime: 30_000,
    gcTime: 60_000,
    retry: retryServerErrors,
  });

  const data = zoneQuery.data;
  const isLoading = !zone || zoneQuery.isLoading;
  // Links into sections the brand has switched off are never shown (brand features).
  const header = useMemo(
    () => (data ? withoutDisabledSections(withDirectNavHrefs(data.header)) : []),
    [data],
  );
  const footer = useMemo(
    () => (data ? withoutDisabledSections(withDirectNavHrefs(data.footer)) : []),
    [data],
  );

  const shopBy = useMemo(() => shopByNavFrom(data), [data]);

  return {
    headerItems: apiNavToMobileNav(header),
    chromeItems: apiNavToChromeNav(header),
    footerItems: footer,
    headerNav: header,
    shopByNav: shopBy,
    isLoading,
    isCatalogFallback: data?.metadata.source === "catalog_categories",
  };
}
