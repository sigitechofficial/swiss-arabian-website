export type TextPart =
  | { kind: "text"; value: string }
  | { kind: "path"; value: string }
  | { kind: "url"; value: string };

/** Our own policy, page and order-tracking paths, and ordinary web addresses. Nothing else becomes a link. */
const LINK = /(https?:\/\/[^\s<>()]+|\/(?:policies|pages)\/[a-z0-9][a-z0-9-]*|\/track(?![\w/-]))/gi;

/**
 * Splits a reply into plain text and links. Only `https://` addresses and our own
 * `/policies/…` and `/pages/…` paths become links, so a reply can never carry a
 * `javascript:` or other script link.
 */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ kind: "text", value: text.slice(last, start) });
    const raw = match[0].replace(/[.,;:!?]+$/, "");
    const trailing = match[0].slice(raw.length);
    if (raw.startsWith("/")) parts.push({ kind: "path", value: raw });
    else if (/^https:\/\//i.test(raw)) parts.push({ kind: "url", value: raw });
    else parts.push({ kind: "text", value: raw });
    if (trailing) parts.push({ kind: "text", value: trailing });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}
