import { describe, expect, it } from "vitest";
import { sanitizePageHtml } from "./sanitizePageHtml";

describe("sanitizePageHtml", () => {
  it("keeps headings, lists, tables, images and site links", () => {
    const html =
      '<h2>Returns</h2><ul><li>14 days</li></ul><table><tr><td colspan="2">x</td></tr></table>' +
      '<img src="https://blob/x.png" alt="x"><a href="/pages/contact-us">Contact</a>';
    const out = sanitizePageHtml(html);
    expect(out).toContain("<h2>Returns</h2>");
    expect(out).toContain('<td colspan="2">x</td>');
    expect(out).toContain(
      '<img src="https://blob/x.png" alt="x" loading="lazy" />',
    );
    expect(out).toContain('<a href="/pages/contact-us"');
  });

  it("removes scripts, handlers, styles, forms and unsafe links", () => {
    const out = sanitizePageHtml(
      '<p onclick="x()" style="color:red">Hi</p><script>alert(1)</script><form><input></form>' +
        '<a href="javascript:alert(1)">bad</a><iframe src="https://evil.example"></iframe>',
    );
    expect(out).not.toMatch(
      /script|onclick|style=|<form|<input|javascript:|evil/,
    );
    expect(out).toContain("<p>Hi</p>");
  });

  it("opens other sites in a new tab and keeps YouTube embeds", () => {
    const out = sanitizePageHtml(
      '<a href="https://wa.me/971">WhatsApp</a><iframe src="https://www.youtube.com/embed/abc"></iframe>',
    );
    expect(out).toContain('target="_blank" rel="noopener noreferrer"');
    expect(out).toContain('src="https://www.youtube.com/embed/abc"');
  });

  it("turns a heading 1 into a heading 2 under the page's own title", () => {
    const html = "<h1>Privacy Policy</h1><h2>Data</h2>";
    expect(sanitizePageHtml(html, { demoteH1: true })).toBe(
      "<h2>Privacy Policy</h2><h2>Data</h2>",
    );
    expect(sanitizePageHtml(html)).toContain("<h1>Privacy Policy</h1>");
  });

  it("returns nothing for empty text", () => {
    expect(sanitizePageHtml("  ")).toBe("");
    expect(sanitizePageHtml(null)).toBe("");
  });
});
