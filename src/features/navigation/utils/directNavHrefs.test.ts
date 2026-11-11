import { describe, expect, it } from "vitest";
import type { NavItem } from "../types/navigation";
import { directNavHref, withDirectNavHrefs } from "./directNavHrefs";

describe("directNavHref", () => {
  it("points old Shopify page addresses at the page itself", () => {
    expect(directNavHref("/pages/faqs")).toBe("/faq");
    expect(directNavHref("/pages/store-locator")).toBe("/stores");
    expect(directNavHref("/pages/our-story-1")).toBe("/our-story");
    expect(directNavHref("/blogs/blog")).toBe("/blog");
    expect(directNavHref("/collections/oud/products/oud-01?variant=1")).toBe(
      "/products/oud-01?variant=1",
    );
  });

  it("keeps site links, other sites and empty links as they are", () => {
    expect(directNavHref("/collections/perfumes")).toBe("/collections/perfumes");
    expect(directNavHref("/pages/contact-us")).toBe("/pages/contact-us");
    expect(directNavHref("https://track.iqfulfillment.com/")).toBe(
      "https://track.iqfulfillment.com/",
    );
    expect(directNavHref(null)).toBeNull();
  });
});

describe("withDirectNavHrefs", () => {
  it("rewrites nested menu links", () => {
    const items: NavItem[] = [
      {
        id: "1",
        label: "HELP",
        slug: null,
        type: "URL",
        href: null,
        children: [
          { id: "2", label: "FAQ's", slug: null, type: "URL", href: "/pages/faqs" },
        ],
      },
    ];
    expect(withDirectNavHrefs(items)[0].children?.[0].href).toBe("/faq");
  });
});
