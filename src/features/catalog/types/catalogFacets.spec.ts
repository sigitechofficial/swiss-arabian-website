import { describe, expect, it } from "vitest";
import {
  catalogListingHasActiveFilters,
  catalogListingHref,
  parseCatalogFacets,
  parseCatalogListingParams,
} from "../types/catalogFacets";

describe("parseCatalogFacets", () => {
  it("returns null when facets are omitted", () => {
    expect(parseCatalogFacets(undefined)).toBeNull();
    expect(parseCatalogFacets({})).toBeNull();
  });

  it("parses listing facets and drops empty option codes", () => {
    const facets = parseCatalogFacets({
      price: { min: "110", max: "900", currencyCode: "AED" },
      concentration: [
        { code: "edp", label: "Eau de Parfum", count: 15 },
        { code: "", count: 1 },
      ],
      houseCollection: [],
      featuredNote: [{ code: "oud", label: "Oud", count: 21 }],
    });
    expect(facets?.price).toEqual({
      min: "110",
      max: "900",
      currencyCode: "AED",
    });
    expect(facets?.concentration).toEqual([
      { code: "edp", label: "Eau de Parfum", count: 15 },
    ]);
    expect(facets?.houseCollection).toEqual([]);
    expect(facets?.featuredNote[0]?.code).toBe("oud");
  });
});

describe("catalog listing query", () => {
  it("parses and serializes filter params", () => {
    const query = parseCatalogListingParams({
      minPrice: "110",
      concentration: "edp",
      page: "2",
      sort: "price_asc",
    });
    expect(query).toEqual({
      page: 2,
      minPrice: "110",
      concentration: "edp",
      sort: "price_asc",
    });
    expect(
      catalogListingHref("/products", query),
    ).toBe("/products?minPrice=110&concentration=edp&sort=price_asc&page=2");
    expect(catalogListingHasActiveFilters(query)).toBe(true);
  });

  it("omits defaults from the href", () => {
    expect(catalogListingHref("/products", { page: 1 })).toBe("/products");
  });
});
