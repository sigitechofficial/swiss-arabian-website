import { brandFeatures, brandLinkEnabled, type BrandFeatures } from "@/lib/brand/features";
import type { NavItem } from "../types/navigation";

/**
 * The menu without links into sections this brand has switched off (brand
 * `features`, e.g. a CMS menu item to /stores on a brand with no store
 * locator). A group left with no link and no children is dropped too.
 */
export function withoutDisabledSections(
  items: readonly NavItem[],
  features: BrandFeatures = brandFeatures(),
): NavItem[] {
  const out: NavItem[] = [];
  for (const item of items) {
    if (item.href && !brandLinkEnabled(item.href, features)) continue;
    if (!item.children?.length) {
      out.push(item);
      continue;
    }
    const children = withoutDisabledSections(item.children, features);
    if (!item.href && children.length === 0) continue;
    out.push(children.length === item.children.length ? item : { ...item, children });
  }
  return out;
}
