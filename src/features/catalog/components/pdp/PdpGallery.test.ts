import { describe, expect, it } from "vitest";
import { galleryImageAlt } from "./PdpGallery";

describe("galleryImageAlt", () => {
  it("names every product image (SEO audit: image alt text)", () => {
    expect(galleryImageAlt("VALENCIA", 0, 1)).toBe("VALENCIA");
    expect(galleryImageAlt(" VALENCIA ", 2, 4)).toBe("VALENCIA – image 3 of 4");
  });
});
