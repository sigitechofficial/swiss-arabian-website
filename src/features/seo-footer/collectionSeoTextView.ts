import { dir } from "@/lib/i18n/locales";
import { footerBodyHtml } from "./footerSeoText.service";

/** Collection SEO text from the storefront API (plain text, blank line = paragraph). */
export type CollectionSeoContent = {
  heading: string | null;
  body: string | null;
  /** Language the text is written in (English when the page language has none). */
  locale?: string | null;
};

export type CollectionSeoTextView = {
  heading: string;
  /** Safe HTML paragraphs. */
  bodyHtml: string;
  lang: string;
  dir: "ltr" | "rtl";
};

/** Render model for the collection SEO block; null when there is no text. */
export function collectionSeoTextView(
  content: CollectionSeoContent | null | undefined,
  fallbackLocale: string,
): CollectionSeoTextView | null {
  if (!content) return null;
  const heading = content.heading?.trim() ?? "";
  const bodyHtml = footerBodyHtml(content.body ?? "");
  if (!heading && !bodyHtml) return null;
  const lang =
    (content.locale || fallbackLocale).toLowerCase().split(/[-_]/)[0] || "en";
  return { heading, bodyHtml, lang, dir: dir(lang) };
}
