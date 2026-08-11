import { useQuery } from "@tanstack/react-query";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import type { MobileNavItem, MobileNavLink } from "@/features/home/constants/homeAssets";
import { fetchNavigation } from "../api/navigation.service";
import type { NavItem } from "../types/navigation";

// ─── Adapter: API NavItem[] → MobileNavItem[] ─────────────────────────────

type MobileNavHeading = { label: string; kind: "heading" };

/**
 * Flatten the children of a top-level nav item into the flat list that
 * MobileNavGroup.children expects: [heading?, link, link, heading?, link…]
 *
 * Handles the 3-level API structure:
 *   L1 item → L2 GROUP_HEADER (heading) → L3 links
 *   L1 item → L2 regular links (no heading)
 */
function flattenNavChildren(
  children: NavItem[],
): Array<MobileNavLink | MobileNavHeading> {
  const result: Array<MobileNavLink | MobileNavHeading> = [];

  for (const child of children) {
    if (child.type === "GROUP_HEADER") {
      // Section heading inside the dropdown
      result.push({ label: child.label, kind: "heading" });
      // Its children are the actual links under this heading
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

/**
 * Convert API NavItem[] into the MobileNavItem[] shape that
 * DesktopNav and MobileNav already know how to render.
 */
export function apiNavToMobileNav(items: NavItem[]): MobileNavItem[] {
  const result: MobileNavItem[] = [];

  for (const item of items) {
    // GROUP_HEADER at level 1 is a non-clickable label — skip it.
    if (item.type === "GROUP_HEADER") continue;

    if (item.children?.length) {
      const children = flattenNavChildren(item.children);

      result.push({
        type: "group",
        label: item.label,
        href: item.href ?? undefined,
        children,
      });
    } else if (item.href) {
      result.push({ type: "link", label: item.label, href: item.href });
    }
  }

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

type UseNavigationReturn = {
  headerItems: MobileNavItem[];
  footerItems: NavItem[];
  isLoading: boolean;
  isCatalogFallback: boolean;
};

/**
 * Fetch and cache storefront navigation for the given zone.
 * Falls back to empty arrays on error — never breaks the layout.
 * Cache TTL: 30 s stale / 60 s gc (per guide §7).
 */
export function useNavigation(
  zoneCode: string = DEFAULT_ZONE_CODE,
): UseNavigationReturn {
  const { data, isLoading } = useQuery({
    queryKey: ["storefront", "navigation", zoneCode],
    queryFn: () => fetchNavigation(zoneCode),
    staleTime: 30_000,
    gcTime: 60_000,
    retry: 1,
  });

  return {
    headerItems: data ? apiNavToMobileNav(data.header) : [],
    footerItems: data?.footer ?? [],
    isLoading,
    isCatalogFallback: data?.metadata.source === "catalog_categories",
  };
}
