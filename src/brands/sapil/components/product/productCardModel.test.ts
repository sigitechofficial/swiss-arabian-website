import { describe, expect, it } from "vitest";
import { formatMessage } from "@/lib/i18n/messages";
import type { ProductSummary } from "@/features/catalog/types/product";
import { ENGLISH } from "../../i18n/catalog";
import type { SapilTranslator } from "../../i18n/SapilCopy";
import {
  discountPercent,
  formatSapilPrice,
  productGender,
  productTile,
  toSapilCardModel,
} from "./productCardModel";

const messages = Object.fromEntries(
  Object.entries(ENGLISH).flatMap(([area, entries]) => Object.entries(entries).map(([k, v]) => [`${area}.${k}`, v])),
);
const t: SapilTranslator = (key, values) => formatMessage("en", messages as never, key, values);

const berry: ProductSummary = {
  id: "p1",
  slug: "berry-crush",
  title: "Berry Crush",
  price: 63,
  compareAtPrice: 90,
  currency: "AED",
  imageUrl: "https://cdn/berry.webp",
  concentration: "edp",
  tags: ["Unisex", "Fruity"],
  tileColor: "pink",
};

describe("productCardModel", () => {
  it("formats prices like v9 in English and with Intl elsewhere", () => {
    expect(formatSapilPrice(63, "AED", "en")).toBe("AED 63");
    expect(formatSapilPrice(19.75, "AED", "en")).toBe("AED 19.75");
    expect(formatSapilPrice(63, "AED", "ar")).toMatch(/٦٣|63/);
  });

  it("uses the API tile colour, else the neutral sand tile", () => {
    expect(productTile({ tileColor: "MINT" })).toBe("mint");
    expect(productTile({ tileColor: "#ff00aa" })).toBe("sand");
    expect(productTile({})).toBe("sand");
  });

  it("computes the markdown only from a real was-price", () => {
    expect(discountPercent({ price: 63, compareAtPrice: 90 })).toBe(30);
    expect(discountPercent({ price: 63, compareAtPrice: 50 })).toBe(0);
    expect(discountPercent({ price: 63 })).toBe(0);
  });

  it("reads who it's for from catalog tags", () => {
    expect(productGender({ tags: ["Women"] })).toBe("her");
    expect(productGender({ tags: ["gender:men"] })).toBe("him");
    expect(productGender({ tags: ["Fruity"] })).toBeNull();
  });

  it("maps a product summary to the card", () => {
    const model = toSapilCardModel(berry, t, "en");
    expect(model).toMatchObject({
      name: "Berry Crush",
      href: "/products/berry-crush",
      tile: "pink",
      price: "AED 63",
      was: "AED 90",
      discountPercent: 30,
      tags: ["EDP", "Unisex"],
      shape: "bottle",
      outOfStock: false,
      unavailable: false,
    });
    expect(toSapilCardModel({ ...berry, inStock: false }, t, "en").outOfStock).toBe(true);
    expect(toSapilCardModel({ ...berry, price: null }, t, "en").price).toBe("Unavailable");
    expect(toSapilCardModel({ ...berry, title: "Nancy Pink Gift Set" }, t, "en").shape).toBe("gift");
  });
});
