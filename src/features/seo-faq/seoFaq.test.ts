import { describe, expect, it } from "vitest";
import { answerParagraphs, seoFaqView } from "./seoFaq";

/** SEO audit p19: FAQ on the home page and collection pages. */
describe("seoFaqView", () => {
  it("keeps complete questions, in the language they are written in", () => {
    expect(
      seoFaqView(
        {
          locale: "ar-AE",
          entries: [
            { question: " كم يدوم العطر؟ ", answer: " حتى ١٢ ساعة. " },
            { question: "No answer", answer: " " },
          ],
        },
        "en",
      ),
    ).toEqual({ entries: [{ question: "كم يدوم العطر؟", answer: "حتى ١٢ ساعة." }], lang: "ar", dir: "rtl" });
  });

  it("falls back to the page language, and shows nothing (no schema) without questions", () => {
    expect(seoFaqView({ entries: [{ question: "Q", answer: "A" }] }, "en")?.lang).toBe("en");
    expect(seoFaqView({ entries: [] }, "en")).toBeNull();
    expect(seoFaqView(null, "en")).toBeNull();
  });

  it("splits answers into paragraphs at blank lines", () => {
    expect(answerParagraphs("One\nline two\n\n\nTwo")).toEqual(["One\nline two", "Two"]);
  });
});
