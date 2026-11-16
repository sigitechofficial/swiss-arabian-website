import { describe, expect, it } from "vitest";
import type { NavItem } from "@/features/navigation/types/navigation";
import {
  allOptions,
  featuredPriceTier,
  footerColumnsFromNav,
  isCurrentHref,
  menuItemsFromNav,
  MAX_SHOP_BY_CHIPS,
  shopByChips,
  shopByChipsFromMenu,
  shopByChipsFromNav,
} from "./shellData";

const nav = (id: string, type: NavItem["type"], href: string | null, children: NavItem[] = []): NavItem => ({
  id,
  label: id,
  slug: null,
  type,
  href,
  children,
});

const HEADER: NavItem[] = [
  nav("Home", "URL", "/"),
  nav("Collections", "URL", "/collections", [
    nav("Sarab", "COLLECTION", "/collections/sarab"),
    nav("Royale", "COLLECTION", "/collections/royale"),
  ]),
  nav("Seasons", "URL", null, [
    nav("Seasons-h", "GROUP_HEADER", null, [nav("Summer", "COLLECTION", "/collections/summer")]),
    nav("Sarab again", "COLLECTION", "/collections/sarab"),
  ]),
  nav("Empty", "URL", null),
];

describe("menuItemsFromNav", () => {
  it("keeps links and dropdowns, splits group headers into columns, drops empty items", () => {
    const items = menuItemsFromNav(HEADER);
    expect(items.map((i) => i.id)).toEqual(["Home", "Collections", "Seasons"]);
    expect(items[1].options.map((o) => o.href)).toEqual(["/collections/sarab", "/collections/royale"]);
    expect(items[2].columns).toEqual([
      { id: "Seasons-h", heading: "Seasons-h", links: [{ id: "Summer", label: "Summer", href: "/collections/summer", image: null }] },
    ]);
    expect(allOptions(items[2]).map((o) => o.id)).toEqual(["Sarab again", "Summer"]);
  });
});

describe("shopByChipsFromNav", () => {
  it("takes nested collection links once each, with v9 chip colours", () => {
    const chips = shopByChipsFromNav(HEADER);
    expect(chips.map((c) => c.href)).toEqual(["/collections/sarab", "/collections/royale", "/collections/summer"]);
    expect(chips.map((c) => c.color)).toEqual(["peach", "sky", "lilac"]);
    expect(shopByChipsFromNav(HEADER, 1)).toHaveLength(1);
    expect(shopByChipsFromNav([])).toEqual([]);
  });
});

const SHOP_BY: NavItem[] = [
  nav("For her", "COLLECTION", "/collections/for-her", [nav("Nested", "COLLECTION", "/collections/nested")]),
  nav("Find your mood", "URL", "/#mood"),
  nav("Group", "GROUP_HEADER", null),
  nav("Gifts", "CATEGORY", "/categories/gifts"),
  nav("Sarab EDP", "PRODUCT", "/products/sarab-edp"),
  nav("Lookbook", "URL", "https://lookbook.example.com"),
];

describe("shopByChipsFromMenu", () => {
  it("makes a chip of every top-level item with a link, any link type, in menu order", () => {
    const chips = shopByChipsFromMenu(SHOP_BY);
    expect(chips.map((c) => [c.label, c.href])).toEqual([
      ["For her", "/collections/for-her"],
      ["Find your mood", "/#mood"],
      ["Gifts", "/categories/gifts"],
      ["Sarab EDP", "/products/sarab-edp"],
      ["Lookbook", "https://lookbook.example.com"],
    ]);
    // colours in v9 chip order, counted over chips (the link-less item takes none)
    expect(chips.map((c) => c.color)).toEqual(["peach", "sky", "lilac", "butter", "mint"]);
  });

  it("keeps at most 8 chips", () => {
    const many = Array.from({ length: 12 }, (_, i) => nav(`C${i}`, "COLLECTION", `/collections/c${i}`));
    const chips = shopByChipsFromMenu(many);
    expect(MAX_SHOP_BY_CHIPS).toBe(8);
    expect(chips).toHaveLength(8);
    expect(chips.at(-1)?.label).toBe("C7");
    expect(chips.map((c) => c.color)).toEqual(["peach", "sky", "lilac", "butter", "mint", "sage", "sand", "lime"]);
  });
});

describe("shopByChips", () => {
  it("uses the Shop-by menu when it has items", () => {
    expect(shopByChips(SHOP_BY, HEADER).map((c) => c.label)[0]).toBe("For her");
  });

  it("falls back to the header's collection links when the Shop-by menu is empty or missing", () => {
    const fallback = shopByChipsFromNav(HEADER);
    expect(shopByChips([], HEADER)).toEqual(fallback);
    expect(shopByChips(undefined, HEADER)).toEqual(fallback);
    expect(shopByChips(null, HEADER)).toEqual(fallback);
    // a Shop-by menu with no linked item draws nothing of its own either
    expect(shopByChips([nav("Heading", "GROUP_HEADER", null)], HEADER)).toEqual(fallback);
  });
});

describe("featuredPriceTier", () => {
  it("picks the middle edit", () => {
    expect(featuredPriceTier([50, 99, 199])).toBe(99);
    expect(featuredPriceTier([50, 99])).toBe(50);
    expect(featuredPriceTier([])).toBeNull();
  });
});

describe("footerColumnsFromNav", () => {
  it("makes a column per heading and one for loose links", () => {
    const cols = footerColumnsFromNav([
      nav("Help", "URL", null, [nav("Track", "URL", "/track"), nav("x", "URL", null)]),
      nav("FAQ", "URL", "/faq"),
    ]);
    expect(cols).toEqual([
      { id: "Help", heading: "Help", links: [{ label: "Track", href: "/track" }] },
      { id: "links", heading: "", links: [{ label: "FAQ", href: "/faq" }] },
    ]);
  });
});

describe("isCurrentHref", () => {
  it("matches paths, ignoring queries", () => {
    expect(isCurrentHref("/blog?tag=x", "/blog")).toBe(true);
    expect(isCurrentHref("/blog", "/faq")).toBe(false);
    expect(isCurrentHref("https://x.test/blog", "/blog")).toBe(false);
    // in-page anchors are never the current page (they marked every chip current on /)
    expect(isCurrentHref("#her", "/")).toBe(false);
  });
});
