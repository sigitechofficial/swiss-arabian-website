import { cache } from "react";
import { apiGet } from "@/lib/api/apiClient";
import { dir } from "@/lib/i18n/locales";

/**
 * Questions and answers shown on a page as a visible FAQ section and as FAQPage
 * schema (SEO audit p19): the home page (Website → SEO content, per market and
 * language) and collection pages (the collection's SEO text tab). Plain text.
 */
export type SeoFaqEntry = { question: string; answer: string };

/** As the storefront API sends it: the entries and the language they are written in. */
export type SeoFaqContent = { entries: SeoFaqEntry[]; locale?: string | null };

export type SeoFaqView = {
  entries: SeoFaqEntry[];
  lang: string;
  dir: "ltr" | "rtl";
};

/** Render model; null when there are no complete questions (nothing is shown, no schema). */
export function seoFaqView(content: SeoFaqContent | null | undefined, fallbackLocale: string): SeoFaqView | null {
  const entries = (content?.entries ?? [])
    .map((e) => ({ question: e?.question?.trim() ?? "", answer: e?.answer?.trim() ?? "" }))
    .filter((e) => e.question && e.answer);
  if (!entries.length) return null;
  const lang = (content?.locale || fallbackLocale).toLowerCase().split(/[-_]/)[0] || "en";
  return { entries, lang, dir: dir(lang) };
}

export { answerHtml, answerParagraphs, answerText } from "./seoFaqText";

/** The home page FAQ for a market and language; null when off, empty or unreachable. */
export const loadHomeFaq = cache(async (locale: string, zoneCode: string): Promise<SeoFaqContent | null> => {
  if (!zoneCode) return null;
  try {
    const qs = new URLSearchParams({ locale, zoneCode });
    const data = await apiGet<{ faq: SeoFaqContent | null }>(
      `/storefront/website/seo/home-faq?${qs.toString()}`,
      { skipAuth: true },
    );
    return data?.faq ?? null;
  } catch {
    return null;
  }
});
