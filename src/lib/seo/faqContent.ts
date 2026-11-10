/**
 * Questions and answers read from a FAQ page's HTML (Pages & policies), as
 * plain text, for FAQPage structured data. Only what the page shows is used:
 * a question is a line ending in "?" or "؟" (numbering such as "3." removed);
 * its answer is every following line up to the next question or section
 * heading (a line that is entirely bold, e.g. "DELIVERY"). Questions without
 * an answer are left out.
 */
export type FaqEntry = { question: string; answer: string };

/** Tags that start a new line of text in the page. */
const LINE_BREAK =
  /<\s*\/?\s*(?:br|p|div|li|ul|ol|h[1-6]|dt|dd|dl|tr|table|thead|tbody|blockquote|section|article|hr)\b[^>]*>/gi;

const EMPHASIS = /<\s*(strong|b)\b[^>]*>([\s\S]*?)<\s*\/\s*\1\s*>/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const point =
        code[1] === "x" || code[1] === "X"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Visible text of an HTML fragment on one line. */
function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/[\s ​‎‏]+/g, " ")
    .trim();
}

const compact = (text: string) => text.replace(/\s+/g, "");

/** True when every visible character of the line is bold (a section heading). */
function isWhollyEmphasized(segment: string, text: string): boolean {
  const bold = [...segment.matchAll(EMPHASIS)]
    .map((match) => plainText(match[2] ?? ""))
    .join("");
  return Boolean(bold) && compact(bold) === compact(text);
}

/** "3.", "3)", "(3)", "٣." (Arabic-Indic digits) before a question. */
const NUMBERING = /^\(?[0-9٠-٩۰-۹]{1,3}\s*[.)\-–:٫]\s*/;
const QUESTION_END = /[?؟]$/;
/** Longer lines ending in "?" are sentences inside an answer, not questions. */
const MAX_QUESTION_LENGTH = 250;

function asQuestion(text: string): string | null {
  const question = text.replace(NUMBERING, "").trim();
  if (!QUESTION_END.test(question) || question.length > MAX_QUESTION_LENGTH) {
    return null;
  }
  return question.length > 1 ? question : null;
}

export function faqEntriesFromHtml(html: string | null | undefined): FaqEntry[] {
  if (!html?.trim()) return [];
  const groups: Array<{ question: string; lines: string[] }> = [];
  let open = false;
  for (const segment of html.split(LINE_BREAK)) {
    const text = plainText(segment);
    if (!text) continue;
    const question = asQuestion(text);
    if (question) {
      groups.push({ question, lines: [] });
      open = true;
    } else if (isWhollyEmphasized(segment, text)) {
      open = false;
    } else if (open) {
      groups[groups.length - 1]!.lines.push(text);
    }
  }
  return groups
    .filter((group) => group.lines.length > 0)
    .map((group) => ({ question: group.question, answer: group.lines.join("\n") }));
}
