import { describe, expect, it } from "vitest";
import { faqEntriesFromHtml } from "./faqContent";

describe("faqEntriesFromHtml", () => {
  it("reads numbered questions in one paragraph, split by <br>, and skips bold section headings", () => {
    const html =
      "<p><br><strong>GENERAL</strong><br>1. Why the name?<br>A blend of two worlds.<br>Founded in 1974.</p>" +
      "<p><strong>ORDER</strong> <br>1. Can I cancel?<br>Yes, contact us &amp; we help.<br><br>2. Free shipping?<br>Over AED&nbsp;250.</p>";
    expect(faqEntriesFromHtml(html)).toEqual([
      { question: "Why the name?", answer: "A blend of two worlds.\nFounded in 1974." },
      { question: "Can I cancel?", answer: "Yes, contact us & we help." },
      { question: "Free shipping?", answer: "Over AED 250." },
    ]);
  });

  it("reads unnumbered bold Arabic questions and Arabic-Indic numbering", () => {
    const html =
      "<p><strong><u>الحساب</u></strong>&nbsp;</p>" +
      "<p><strong>كيف يمكنني إنشاء حساب؟</strong></p><p>من أعلى الصفحة.</p>" +
      "<p>٤. هل يوجد توصيل مجاني؟<br>نعم.</p>";
    expect(faqEntriesFromHtml(html)).toEqual([
      { question: "كيف يمكنني إنشاء حساب؟", answer: "من أعلى الصفحة." },
      { question: "هل يوجد توصيل مجاني؟", answer: "نعم." },
    ]);
  });

  it("keeps list items under the current answer and drops questions without an answer", () => {
    const html =
      "<p>Intro text that is not an answer.</p><p>1. Unanswered?</p><p><b>TIPS</b></p>" +
      "<p>2. How to make it last?<br>Some tips:</p><ul><li>Layer</li><li>Store cool</li></ul>";
    expect(faqEntriesFromHtml(html)).toEqual([
      { question: "How to make it last?", answer: "Some tips:\nLayer\nStore cool" },
    ]);
  });

  it("returns nothing for empty or question-free content", () => {
    expect(faqEntriesFromHtml("")).toEqual([]);
    expect(faqEntriesFromHtml(null)).toEqual([]);
    expect(faqEntriesFromHtml("<p>About us.</p>")).toEqual([]);
  });
});
