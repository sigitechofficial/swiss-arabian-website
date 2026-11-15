/**
 * Pure mapping from the shared navigation / CMS data to what the Sapil chrome draws.
 * No fetching here: the containers read the shared hooks and pass their data in.
 */
import type { NavItem } from "@/features/navigation/types/navigation";
import { SAPIL_PASTELS, type SapilPastel } from "../../ui/shared";

export type MenuLink = { id: string; label: string; href: string; image?: string | null };

/** One main-menu entry: a plain link, or a dropdown with options (optionally in headed columns). */
export type MenuItem = {
  id: string;
  label: string;
  href: string | null;
  options: MenuLink[];
  columns: Array<{ id: string; heading: string; links: MenuLink[] }>;
};

function link(item: NavItem): MenuLink | null {
  return item.href ? { id: item.id, label: item.label, href: item.href, image: item.image ?? null } : null;
}

/** The market's header menu as v9 menu items (dropdowns from children; group headers become columns). */
export function menuItemsFromNav(items: readonly NavItem[]): MenuItem[] {
  const out: MenuItem[] = [];
  for (const item of items) {
    if (item.type === "GROUP_HEADER" && !item.children?.length) continue;
    const children = item.children ?? [];
    const columns = children
      .filter((c) => c.type === "GROUP_HEADER")
      .map((c) => ({
        id: c.id,
        heading: c.label,
        links: (c.children ?? []).map(link).filter((l): l is MenuLink => l !== null),
      }))
      .filter((c) => c.links.length > 0);
    const options = children
      .filter((c) => c.type !== "GROUP_HEADER")
      .map(link)
      .filter((l): l is MenuLink => l !== null);
    if (!item.href && !options.length && !columns.length) continue;
    out.push({ id: item.id, label: item.label, href: item.href, options, columns });
  }
  return out;
}

/** Every option of a dropdown (columns flattened), for the phone menu. */
export function allOptions(item: MenuItem): MenuLink[] {
  return [...item.options, ...item.columns.flatMap((c) => c.links)];
}

export type ShopByChip = { id: string; label: string; href: string; color: SapilPastel; sale?: boolean };

/** v9 chip colours, in its order (For Her peach, For Him sky, …). */
const CHIP_COLOURS: SapilPastel[] = ["peach", "sky", "lilac", "butter", "mint", "sage", "sand", "lime"];

export function pastelAt(index: number, palette: readonly SapilPastel[] = SAPIL_PASTELS): SapilPastel {
  return palette[((index % palette.length) + palette.length) % palette.length];
}

/**
 * "Shop by" chips: the collection links of the header menu (its dropdown options
 * that open a collection), first seen first, at most `max`. There is no dedicated
 * CMS menu for this row yet (see docs/sapil/pages/shell.md).
 */
export function shopByChipsFromNav(items: readonly NavItem[], max = 7): ShopByChip[] {
  const seen = new Set<string>();
  const chips: ShopByChip[] = [];
  const visit = (nodes: readonly NavItem[], depth: number) => {
    for (const node of nodes) {
      if (chips.length >= max) return;
      if (depth > 0 && node.type === "COLLECTION" && node.href && !seen.has(node.href)) {
        seen.add(node.href);
        chips.push({ id: node.id, label: node.label, href: node.href, color: pastelAt(chips.length, CHIP_COLOURS) });
      }
      if (node.children?.length) visit(node.children, depth + 1);
    }
  };
  visit(items, 0);
  return chips;
}

/** The middle price edit (v9: "Under AED 99" of 50 / 99 / 199). */
export function featuredPriceTier(tiers: readonly number[]): number | null {
  if (!tiers.length) return null;
  return tiers[Math.floor((tiers.length - 1) / 2)] ?? null;
}

export type FooterLink = { label: string; href: string };
export type FooterColumn = { id: string; heading: string; links: FooterLink[] };

/** The market's footer menu: each heading with links becomes a column; loose links share one. */
export function footerColumnsFromNav(items: readonly NavItem[]): FooterColumn[] {
  const columns: FooterColumn[] = [];
  const loose: FooterLink[] = [];
  for (const item of items) {
    const links = (item.children ?? []).flatMap((child) => (child.href ? [{ label: child.label, href: child.href }] : []));
    if (links.length) columns.push({ id: item.id, heading: item.label, links });
    else if (item.href) loose.push({ label: item.label, href: item.href });
  }
  if (loose.length) columns.push({ id: "links", heading: "", links: loose });
  return columns;
}

/** Is `href` the page at `pathname` (locale prefix already stripped)? Query strings are ignored. */
export function isCurrentHref(href: string, pathname: string): boolean {
  if (/^https?:/i.test(href) || href.startsWith("#")) return false;
  const path = href.split(/[?#]/)[0] || "/";
  return path === pathname;
}
