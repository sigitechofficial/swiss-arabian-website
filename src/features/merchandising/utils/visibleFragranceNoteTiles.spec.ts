import { describe, expect, it } from "vitest";
import type { FragranceNotesView } from "../types/merch";
import {
  fragranceNotesPlpHref,
  visibleFragranceNoteTiles,
} from "./visibleFragranceNoteTiles";

function view(
  partial: Pick<FragranceNotesView, "available" | "tiles">,
): FragranceNotesView {
  return {
    context: {
      zoneId: null,
      zoneCode: "UAE",
      salesChannelCode: "platform_uae",
      languageCode: "en",
      currencyCode: "AED",
      legalEntityCode: null,
    },
    sectionTitle: "Shop by Fragrance Notes",
    collection: null,
    ...partial,
  };
}

describe("visibleFragranceNoteTiles", () => {
  it("hides when available is false", () => {
    expect(
      visibleFragranceNoteTiles(
        view({
          available: false,
          tiles: [
            {
              code: "woody",
              name: "Woody",
              imageUrl: "https://cdn.example/woody.jpg",
              sortOrder: 0,
              fragranceFamily: "woody",
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("drops tiles without a family and sorts", () => {
    const tiles = visibleFragranceNoteTiles(
      view({
        available: true,
        tiles: [
          {
            code: "oud",
            name: "Oud",
            imageUrl: null,
            sortOrder: 2,
            fragranceFamily: "oud",
          },
          {
            code: "skip",
            name: "Skip",
            imageUrl: null,
            sortOrder: 0,
            fragranceFamily: "  ",
          },
          {
            code: "woody",
            name: "Woody",
            imageUrl: null,
            sortOrder: 1,
            fragranceFamily: "woody",
          },
        ],
      }),
    );
    expect(tiles.map((t) => t.fragranceFamily)).toEqual(["woody", "oud"]);
  });
});

describe("fragranceNotesPlpHref", () => {
  it("deep-links to the products PLP with fragranceFamily", () => {
    expect(fragranceNotesPlpHref("woody")).toBe("/products?fragranceFamily=woody");
  });
});
