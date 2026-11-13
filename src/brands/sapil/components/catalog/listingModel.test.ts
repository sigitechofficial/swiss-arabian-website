import { describe, expect, it } from "vitest";
import { formatMessage } from "@/lib/i18n/messages";
import { ENGLISH } from "../../i18n/catalog";
import type { SapilTranslator } from "../../i18n/SapilCopy";
import {
  bandsInRange,
  bandValue,
  buildToolbarFacets,
  editBands,
  parseBand,
  selectedBand,
  tierBands,
  toggleFacet,
} from "./listingModel";

const messages = Object.fromEntries(
  Object.entries(ENGLISH).flatMap(([area, entries]) => Object.entries(entries).map(([k, v]) => [`${area}.${k}`, v])),
);
const t: SapilTranslator = (key, values) => formatMessage("en", messages as never, key, values);
const money = (n: number) => `AED ${n}`;

describe("price bands", () => {
  it("builds shop bands from the market tiers", () => {
    expect(tierBands([50, 99, 199]).map(bandValue)).toEqual(["-50", "50-99", "99-199", "199-"]);
    expect(parseBand("50-99")).toEqual({ min: 50, max: 99 });
    expect(parseBand("199-")).toEqual({ min: 199 });
  });

  it("splits a price edit into four bands up to the ceiling (v9 priceOptions)", () => {
    expect(editBands(99).map(bandValue)).toEqual(["-25", "25-50", "50-75", "75-99"]);
  });

  it("drops bands outside the listing's price range", () => {
    const bands = tierBands([50, 99, 199]);
    expect(bandsInRange(bands, { min: "60", max: "120", currencyCode: "AED" }).map(bandValue)).toEqual(["50-99", "99-199"]);
  });
});

describe("toolbar facets", () => {
  const facets = {
    price: { min: "45", max: "149", currencyCode: "AED" },
    concentration: [{ code: "edp", label: "EDP", count: 9 }],
    houseCollection: [{ code: "sarab", label: "Sarab", count: 3 }],
    featuredNote: [],
    fragranceFamily: [{ code: "fruity", label: "Fruity", count: 4 }],
  };

  it("reads options and the selection from the API facets and the address", () => {
    const list = buildToolbarFacets({
      facets,
      query: { page: 1, houseCollection: "sarab", minPrice: "50", maxPrice: "99" },
      bands: tierBands([50, 99, 199]),
      t,
      money,
    });
    const byKey = Object.fromEntries(list.map((f) => [f.key, f]));
    expect(byKey.houseCollection.selected).toEqual(["sarab"]);
    expect(byKey.houseCollection.options[0]).toEqual({ value: "sarab", label: "Sarab", count: 3 });
    expect(byKey.price.selected).toEqual(["50-99"]);
    expect(byKey.price.options.map((o) => o.label)).toEqual(["Under AED 50", "AED 50–AED 99", "AED 99–AED 199", "Over AED 199"]);
    expect(byKey.featuredNote.options).toEqual([]);
  });

  it("selects one option per facet; the selected option clears it", () => {
    expect(toggleFacet({ page: 2 }, "houseCollection", "sarab")).toEqual({ houseCollection: "sarab" });
    expect(toggleFacet({ page: 1, houseCollection: "sarab" }, "houseCollection", "sarab")).toEqual({ houseCollection: undefined });
    expect(toggleFacet({ page: 1 }, "price", "199-")).toEqual({ minPrice: "199", maxPrice: undefined });
  });

  it("keeps a price edit under its ceiling", () => {
    expect(selectedBand({ page: 1, maxPrice: "99" }, 99)).toBe("");
    expect(toggleFacet({ page: 1, maxPrice: "99" }, "price", "-25", 99)).toEqual({ minPrice: undefined, maxPrice: "25" });
    expect(toggleFacet({ page: 1, maxPrice: "25" }, "price", "-25", 99)).toEqual({ minPrice: undefined, maxPrice: "99" });
  });
});
