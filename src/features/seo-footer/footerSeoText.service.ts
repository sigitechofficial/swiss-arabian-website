import { cache } from "react";
import { apiGet } from "@/lib/api/apiClient";
import { sanitizePageHtml } from "@/lib/html/sanitizePageHtml";

/** SEO text shown above the footer (Website → SEO content, per market and language). */
export type FooterSeoText = {
  /** Market language the text is in (may differ from the shopper's when missing). */
  locale: string;
  heading: string;
  /** Safe HTML. */
  bodyHtml: string;
};

const HTML_TAG = /<\/?[a-z][^>]*>/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Body as safe HTML: editor HTML is sanitized; plain text keeps its paragraphs. */
export function footerBodyHtml(body: string): string {
  if (!body.trim()) return "";
  if (HTML_TAG.test(body)) return sanitizePageHtml(body);
  return body
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** The text for a market and language; null when switched off, empty or unreachable. */
export const loadFooterSeoText = cache(
  async (locale: string, zoneCode: string): Promise<FooterSeoText | null> => {
    if (!zoneCode) return null;
    try {
      const qs = new URLSearchParams({ locale, zoneCode });
      const data = await apiGet<{
        text: { locale: string; heading: string; body: string } | null;
      }>(`/storefront/website/seo/footer-text?${qs.toString()}`, { skipAuth: true });
      const text = data?.text;
      if (!text) return null;
      const heading = text.heading.trim();
      const bodyHtml = footerBodyHtml(text.body);
      if (!heading && !bodyHtml) return null;
      return { locale: text.locale, heading, bodyHtml };
    } catch {
      return null;
    }
  },
);
