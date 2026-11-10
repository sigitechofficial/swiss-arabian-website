import { describe, expect, it } from "vitest";
import type { NavItem } from "@/features/navigation/types/navigation";
import { footerColumns, socialNetwork } from "./SiteFooter";

const link = (id: string, label: string, href: string | null): NavItem => ({
  id,
  label,
  slug: null,
  type: "URL",
  href,
});

describe("site footer", () => {
  it("turns the market footer menu into columns: heading + its links", () => {
    const columns = footerColumns([
      {
        ...link("shop", "SHOP", null),
        type: "GROUP_HEADER",
        children: [link("a", "Men", "/collections/men"), link("b", "No link", null)],
      },
      {
        ...link("more", "MORE LINKS", null),
        type: "GROUP_HEADER",
        children: [link("c", "Careers", "https://careers.example.com")],
      },
      link("d", "FAQ", "/pages/faq"),
    ]);
    expect(columns).toEqual([
      { id: "shop", heading: "SHOP", links: [{ label: "Men", href: "/collections/men" }] },
      {
        id: "more",
        heading: "MORE LINKS",
        links: [{ label: "Careers", href: "https://careers.example.com" }],
      },
      { id: "links", heading: "", links: [{ label: "FAQ", href: "/pages/faq" }] },
    ]);
  });

  it("no footer menu means no link columns (nothing made up)", () => {
    expect(footerColumns([])).toEqual([]);
  });

  it("recognises configured social links; unknown ones are not shown", () => {
    expect(
      socialNetwork({ id: "ig", label: "Instagram", href: "https://instagram.com/swissarabian" })?.label,
    ).toBe("Instagram");
    expect(socialNetwork({ id: "chat", label: "Chat", href: "https://wa.me/971" })?.label).toBe(
      "WhatsApp",
    );
    expect(socialNetwork({ id: "x", label: "Blog", href: "https://example.com" })).toBeNull();
  });
});
