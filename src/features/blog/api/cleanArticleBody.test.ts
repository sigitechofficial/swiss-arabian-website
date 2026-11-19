import { describe, expect, it } from "vitest";
import { cleanArticleBody } from "./blogApi";

describe("blog rich-text blocks", () => {
  it("keep formatting, lose scripts and handlers, drop when empty", () => {
    const body = cleanArticleBody([
      { type: "p", text: "Plain" },
      { type: "rich", html: '<h1>Title</h1><p onclick="x()">Oud <strong>rose</strong></p><script>alert(1)</script>' },
      { type: "rich", html: "<script>alert(1)</script>" },
    ]);
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({ type: "p", text: "Plain" });
    const rich = body[1] as { type: "rich"; html: string };
    expect(rich.html).toContain("<strong>rose</strong>");
    expect(rich.html).toContain("<h2>Title</h2>");
    expect(rich.html).not.toMatch(/script|onclick/);
  });
});
