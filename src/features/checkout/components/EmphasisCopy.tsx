import { linkSlots, TextWithLinks } from "@/lib/i18n/TextWithLinks";

/** Placeholder values for a sentence with one emphasised phrase (`{em}`). */
export const EM_SLOT = linkSlots(["em"]);

/**
 * A translated sentence with one emphasised phrase ("Payment was <em>declined</em>."),
 * kept as one message so each language orders the words its own way:
 * `text` is `t(key, EM_SLOT)`, `em` the phrase's own message.
 */
export function EmphasisCopy({ text, em, className }: { text: string; em: string; className?: string }) {
  return <TextWithLinks text={text} links={{ em: <em className={className}>{em}</em> }} />;
}
