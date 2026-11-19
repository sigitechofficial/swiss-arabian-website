import { describe, expect, it } from "vitest";
import { groupQuestionSections, isQuestionList, splitHtmlSections } from "./htmlSections";

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

describe("question groups (policies)", () => {
  it("a heading with no text of its own titles the questions after it", () => {
    const html =
      "<h2>Return Policy</h2><h3>Do you offer free returns?</h3><p>Yes, within 7 days.</p>" +
      "<h3>What conditions apply?</h3><ul><li>Unused</li></ul>" +
      "<h2>Refund Policy</h2><h3>How long does a refund take?</h3><p>10 business days.</p>";
    const split = splitHtmlSections(html);
    expect(isQuestionList(split)).toBe(true);
    const groups = groupQuestionSections(split);
    expect(groups.map((g) => g.title)).toEqual(["Return Policy", "Refund Policy"]);
    expect(groups.map((g) => g.items.map((i) => i.title))).toEqual([
      ["Do you offer free returns?", "What conditions apply?"],
      ["How long does a refund take?"],
    ]);
  });

  it("a plain FAQ stays one untitled group", () => {
    const split = splitHtmlSections("<h3>A?</h3><p>a</p><h3>B?</h3><p>b</p><h3>C?</h3><p>c</p>");
    expect(groupQuestionSections(split)).toEqual([{ title: null, items: split.sections }]);
  });
});
