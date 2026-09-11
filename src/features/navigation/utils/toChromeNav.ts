import {
  PRIMARY_NAV,
  type ChromeLink,
  type ChromeNavItem,
} from "@/features/home/constants/chromeNav";
import type { NavItem } from "../types/navigation";

/**
 * `/storefront/navigation` describes structure only — it carries no artwork or
 * marketing copy for the desktop mega panels. So reuse the designed promo from
 * the matching static menu where the labels line up, and fall back to a house
 * default for menus the CMS added that the design never anticipated.
 */
const PROMO_BY_LABEL = new Map(
  PRIMARY_NAV.flatMap((item) =>
    item.type === "mega" ? ([[normalize(item.label), item.promo]] as const) : [],
  ),
);

const DEFAULT_PROMO = {
  image: "/assets/collection-1.jpg",
  copy: "Extrait de parfum, composed in Dubai since 1974.",
  cta: "Shop all",
  href: "/products",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** "PERFUME OILS" → "perfume-oils" — used as the mega panel's DOM id. */
function slugId(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toLinks(items: readonly NavItem[]): ChromeLink[] {
  return items.flatMap((item) =>
    item.href ? [{ label: item.label, href: item.href }] : [],
  );
}

/**
 * Adapt the navigation API tree to the chrome navbar's shape.
 *
 * The API nests three levels, and a top-level menu mixes two child styles:
 *   item → GROUP_HEADER → links   (a titled column, e.g. PERFUMES → TYPE)
 *   item → links                  (loose links, e.g. INCENSE → DUKHOON…)
 * Loose links have no heading of their own, so they're gathered into a single
 * column titled after their parent. A menu with no usable children degrades to
 * a plain link rather than an empty mega panel.
 */
export function apiNavToChromeNav(items: readonly NavItem[]): ChromeNavItem[] {
  const result: ChromeNavItem[] = [];

  for (const item of items) {
    // A GROUP_HEADER is a non-clickable label; it has no meaning at top level.
    if (item.type === "GROUP_HEADER") continue;

    const children = item.children ?? [];
    const groups: Array<{ heading: string; links: ChromeLink[] }> = [];
    const loose: NavItem[] = [];

    for (const child of children) {
      if (child.type === "GROUP_HEADER") {
        const links = toLinks(child.children ?? []);
        if (links.length) groups.push({ heading: child.label, links });
      } else {
        loose.push(child);
      }
    }

    const looseLinks = toLinks(loose);
    if (looseLinks.length) {
      groups.unshift({ heading: item.label, links: looseLinks });
    }

    // `href` is required on a mega panel — fall back to the first child link
    // so the panel title is never a dead target.
    const href = item.href ?? groups[0]?.links[0]?.href ?? null;

    if (!groups.length || !href) {
      if (item.href) {
        result.push({ type: "link", label: item.label, href: item.href });
      }
      continue;
    }

    const promo = PROMO_BY_LABEL.get(normalize(item.label)) ?? {
      ...DEFAULT_PROMO,
      href,
      cta: `Shop ${normalize(item.label)}`,
    };

    result.push({
      type: "mega",
      id: slugId(item.label),
      label: item.label,
      href,
      groups,
      promo,
    });
  }

  return result;
}
