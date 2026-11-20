import { describe, expect, it } from "vitest";
import { answerHtml, answerText } from "./seoFaqText";

describe("FAQ answers (plain or rich)", () => {
  it("plain text: escaped paragraphs, line breaks kept", () => {
    expect(answerHtml("Use <3 drops\nmorning\n\nNight too")).toBe("<p>Use &lt;3 drops<br>morning</p><p>Night too</p>");
    expect(answerText("  Plain  ")).toBe("Plain");
  });

  it("rich text: cleaned HTML on the page, plain text for search engines", () => {
    const html = '<p>See <a href="/pages/contact" onclick="x()">contact</a> &amp; <strong>shop</strong></p><script>x()</script><ul><li>One</li><li>Two</li></ul>';
    const shown = answerHtml(html);
    expect(shown).toContain("<strong>shop</strong>");
    expect(shown).toContain('href="/pages/contact"');
    expect(shown).not.toMatch(/script|onclick/);
    expect(answerText(html)).toBe("See contact & shop\nOne\nTwo");
  });
});
