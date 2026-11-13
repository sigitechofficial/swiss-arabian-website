import { describe, expect, it } from "vitest";
import type { NavItem } from "@/features/navigation/types/navigation";
import {
  allOptions,
  featuredPriceTier,
  footerColumnsFromNav,
  isCurrentHref,
  menuItemsFromNav,
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
  });
});
