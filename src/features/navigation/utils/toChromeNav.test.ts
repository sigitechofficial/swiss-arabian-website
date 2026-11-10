import { describe, expect, it } from "vitest";
import type { NavItem } from "../types/navigation";
import { apiNavToChromeNav } from "./toChromeNav";

const nav = (
  id: string,
  label: string,
  href: string | null,
  children: NavItem[] = [],
  type: NavItem["type"] = "COLLECTION",
): NavItem => ({ id, label, slug: null, type, href, children });

describe("apiNavToChromeNav", () => {
  it("a link with its own links becomes a linked column (Shopify mega menu shape)", () => {
    const [perfumes] = apiNavToChromeNav([
      nav("p", "PERFUMES", "/collections/perfumes", [
        nav("m", "MEN", "/collections/men"),
        nav("h", "HAIR MIST", "/collections/hair-mist", [
          nav("g", "GHARAAM", "/products/gharam", [], "PRODUCT"),
          nav("r", "ROSE 01", "/products/rose-1-hair-mist", [], "PRODUCT"),
        ]),
        nav("t", "TYPE", null, [nav("o", "OUD", "/collections/oud")], "GROUP_HEADER"),
      ]),
    ]);
    expect(perfumes).toMatchObject({
      type: "mega",
      label: "PERFUMES",
      groups: [
        { heading: "PERFUMES", links: [{ label: "MEN", href: "/collections/men" }] },
        {
          heading: "HAIR MIST",
          href: "/collections/hair-mist",
          links: [
            { label: "GHARAAM", href: "/products/gharam" },
            { label: "ROSE 01", href: "/products/rose-1-hair-mist" },
          ],
        },
        { heading: "TYPE", links: [{ label: "OUD", href: "/collections/oud" }] },
      ],
    });
  });

  it("a top-level link without children stays a plain link", () => {
    expect(apiNavToChromeNav([nav("s", "SALE", "/collections/sale")])).toEqual([
      { type: "link", label: "SALE", href: "/collections/sale" },
    ]);
  });
});
