import { sanitizePageHtml } from "@/lib/html/sanitizePageHtml";
import type { SitePage } from "../api/sitePages.service";

/**
 * A text page or policy. The body is the market's HTML, cleaned before it is
 * shown. A contact page also shows the market's contact details (the
 * "contact information" policy), because the old store's form is not carried over.
 */
export function SitePageView({
  page,
  contactDetails,
  locale,
}: {
  page: SitePage;
  contactDetails?: SitePage | null;
  locale: "en" | "ar";
}) {
  const body = sanitizePageHtml(page.bodyHtml);
  const contact = contactDetails
    ? sanitizePageHtml(contactDetails.bodyHtml)
    : "";
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-normal leading-tight text-[var(--ink,#241f1b)]">
        {page.title}
      </h1>
      {body ? (
        <div
          className="site-page-body mt-8"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : null}
      {contact ? (
        <section
          className="mt-10 rounded-lg border border-black/10 p-6"
          aria-labelledby="contact-details"
        >
          <h2
            id="contact-details"
            className="text-lg font-semibold text-[var(--ink,#241f1b)]"
          >
            {locale === "ar" ? "معلومات التواصل" : "Contact details"}
          </h2>
          <div
            className="site-page-body mt-4"
            dangerouslySetInnerHTML={{ __html: contact }}
          />
        </section>
      ) : null}
    </article>
  );
}
