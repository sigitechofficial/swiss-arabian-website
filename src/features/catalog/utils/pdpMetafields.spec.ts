import { describe, expect, it } from "vitest";
import {
  familyChips,
  notesSectionTitle,
  pickPdpMetafields,
  pyramidFromMetafields,
} from "./pdpMetafields";

describe("pdpMetafields", () => {
  it("builds a pyramid only from filled note keys", () => {
    expect(
      pyramidFromMetafields({
        top_note: "Apple, Grapes",
        middle_note: "Iris",
        base_note: "Musk",
      }),
    ).toEqual([
      { level: "Top", names: "Apple, Grapes" },
      { level: "Heart", names: "Iris" },
      { level: "Base", names: "Musk" },
    ]);
  });

  it("hides the pyramid when notes are empty", () => {
    expect(pyramidFromMetafields({})).toEqual([]);
    expect(pyramidFromMetafields(undefined)).toEqual([]);
  });

  it("ignores unknown / woo keys", () => {
    expect(
      pickPdpMetafields({
        top_note: "Apple",
        "woo/video": "https://example.com",
        filter_by: "x",
      }),
    ).toEqual({ top_note: "Apple" });
  });

  it("splits family chips and defaults the notes heading", () => {
    expect(familyChips({ fragrance_family_text: "Fruity, Woody" })).toEqual([
      "Fruity",
      "Woody",
    ]);
    expect(notesSectionTitle({})).toBe("Notes");
    expect(notesSectionTitle({ ingredient_heading: "Notes" })).toBe("Notes");
  });
});
