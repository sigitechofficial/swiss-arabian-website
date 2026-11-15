import { describe, expect, it } from "vitest";
import { isQuestionList, splitHtmlSections } from "./htmlSections";

describe("splitHtmlSections", () => {
  it("returns the whole body as intro without headings", () => {
    expect(splitHtmlSections("<p>Hello</p>")).toEqual({ intro: "<p>Hello</p>", sections: [] });
  });

  it("splits at h2-h4 and keeps each part's HTML", () => {
    const split = splitHtmlSections("<p>Intro</p><h2>Do you ship?</h2><p>Yes.</p><h3 class='x'>Returns &amp; <b>refunds</b>?</h3><ul><li>14 days</li></ul>");
    expect(split.intro).toBe("<p>Intro</p>");
    expect(split.sections).toEqual([
      { title: "Do you ship?", html: "<p>Yes.</p>" },
      { title: "Returns & refunds?", html: "<ul><li>14 days</li></ul>" },
    ]);
  });
});

describe("isQuestionList", () => {
  const page = (titles: string[]) => splitHtmlSections(titles.map((x) => `<h3>${x}</h3><p>a</p>`).join(""));
  it("folds pages of questions", () => {
    expect(isQuestionList(page(["Ship?", "Pay?", "Return?"]))).toBe(true);
    expect(isQuestionList(page(["هل تشحنون؟", "الدفع؟", "الإرجاع؟"]))).toBe(true);
  });
  it("keeps policies and short pages as text", () => {
    expect(isQuestionList(page(["Scope", "Data we keep", "Your rights"]))).toBe(false);
    expect(isQuestionList(page(["Ship?", "Pay?"]))).toBe(false);
  });
});
