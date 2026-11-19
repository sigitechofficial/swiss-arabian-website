import { sanitizePageHtml } from "@/lib/html/sanitizePageHtml";

const HTML_TAG = /<\/?[a-zA-Z][^>]*>/;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Answer paragraphs (a blank line starts a new one). */
export function answerParagraphs(answer: string): string[] {
  return answer
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * An answer as safe HTML: rich text from the admin editor is cleaned with the
 * page allow-list; plain text becomes escaped paragraphs (a blank line starts a
 * new one, a single line break stays a line break).
 */
export function answerHtml(answer: string): string {
  if (HTML_TAG.test(answer)) return sanitizePageHtml(answer, { demoteH1: true });
  return answerParagraphs(answer)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** An answer as plain text (for FAQPage structured data). */
export function answerText(answer: string): string {
  if (!HTML_TAG.test(answer)) return answer.trim();
  return answer
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(br|\/p|\/li|\/h[1-6])\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}
