import { describe, expect, it } from "vitest";
import { footerBodyHtml } from "./footerSeoText.service";

describe("footerBodyHtml", () => {
  it("keeps plain-text paragraphs and escapes markup characters", () => {
    expect(footerBodyHtml("Oud in Doha\nand Al Wakrah\n\nOrders over 5 & < 10 items")).toBe(
      "<p>Oud in Doha<br>and Al Wakrah</p><p>Orders over 5 &amp; &lt; 10 items</p>",
    );
  });

  it("sanitizes editor HTML", () => {
    const html = footerBodyHtml('<p>Perfumes <strong>in Qatar</strong></p><script>alert(1)</script>');
    expect(html).toContain("<strong>in Qatar</strong>");
    expect(html).not.toContain("script");
  });

  it("is empty for blank text", () => {
    expect(footerBodyHtml("  ")).toBe("");
  });
});
