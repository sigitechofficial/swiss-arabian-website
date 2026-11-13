/** A page's cleaned HTML split at its headings: the text before the first one, then one part per heading. */
export type HtmlSections = { intro: string; sections: Array<{ title: string; html: string }> };

const HEADING = /<(h[2-4])\b[^>]*>([\s\S]*?)<\/\1>/gi;

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function splitHtmlSections(html: string): HtmlSections {
  const matches = [...html.matchAll(HEADING)];
  if (!matches.length) return { intro: html, sections: [] };
  const intro = html.slice(0, matches[0].index);
  const sections = matches.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? html.length) : html.length;
    return { title: text(m[2]), html: html.slice(start, end).trim() };
  });
  return { intro, sections: sections.filter((s) => s.title) };
}

/**
 * Question-and-answer pages (FAQ, help) fold into an accordion: at least three
 * headed parts and most headings are questions.
 */
export function isQuestionList(split: HtmlSections): boolean {
  const n = split.sections.length;
  if (n < 3) return false;
  const questions = split.sections.filter((s) => /[?؟]\s*$/.test(s.title)).length;
  return questions / n >= 0.6;
}
