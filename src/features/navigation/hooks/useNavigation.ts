import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import type { MobileNavItem, MobileNavLink } from "@/features/home/constants/homeAssets";
import type { ChromeNavItem } from "@/features/home/constants/chromeNav";
import { fetchNavigation } from "../api/navigation.service";
import { apiNavToChromeNav } from "../utils/toChromeNav";
import type { NavItem } from "../types/navigation";

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
  isLoading: boolean;
  isCatalogFallback: boolean;
};

/** 4xx (e.g. 422 "context could not be resolved" for a zone the backend
 *  hasn't configured) won't succeed on retry — only retry server errors. */
function retryServerErrors(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function useNavigation(
  zoneCode: string = DEFAULT_ZONE_CODE,
): UseNavigationReturn {
  // Keyed by zone, so changing the country refetches the menu. The previous
  // menu stays on screen while the new one loads.
  const zoneQuery = useQuery({
    queryKey: ["storefront", "navigation", zoneCode],
    queryFn: () => fetchNavigation(zoneCode),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 60_000,
    retry: retryServerErrors,
  });

  // A zone the backend can't resolve yet falls back to the default zone's menu
  // rather than dropping to the static one.
  const fallbackActive = zoneCode !== DEFAULT_ZONE_CODE && zoneQuery.isError;
  const fallbackQuery = useQuery({
    queryKey: ["storefront", "navigation", DEFAULT_ZONE_CODE],
    queryFn: () => fetchNavigation(DEFAULT_ZONE_CODE),
    enabled: fallbackActive,
    staleTime: 30_000,
    gcTime: 60_000,
    retry: retryServerErrors,
  });

  const data = zoneQuery.data ?? (fallbackActive ? fallbackQuery.data : undefined);
  const isLoading = zoneQuery.isLoading || (fallbackActive && fallbackQuery.isLoading);

  return {
    headerItems: data ? apiNavToMobileNav(data.header) : [],
    chromeItems: data ? apiNavToChromeNav(data.header) : [],
    footerItems: data?.footer ?? [],
    isLoading,
    isCatalogFallback: data?.metadata.source === "catalog_categories",
  };
}
