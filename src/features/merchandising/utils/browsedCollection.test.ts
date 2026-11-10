import { describe, expect, it } from "vitest";
import { pickBrowsedCollection } from "./browsedCollection";

const collections = [
  { slug: "perfumes", name: "Perfumes" },
  { slug: "cities-collection", name: "Cities Collection" },
];

describe("breadcrumb collection", () => {
  it("uses the collection the shopper came from when the product is in it", () => {
    expect(pickBrowsedCollection({ slug: "cities-collection" }, collections)).toEqual({
      slug: "cities-collection",
      name: "Cities Collection",
    });
  });
  it("ignores a browsed collection the product is not in (falls back)", () => {
    expect(pickBrowsedCollection({ slug: "sale" }, collections)).toBeNull();
    expect(pickBrowsedCollection(null, collections)).toBeNull();
  });
});
