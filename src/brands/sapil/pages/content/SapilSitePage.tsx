import type { SitePage } from "@/features/site-pages/api/sitePages.service";
import { sanitizePageHtml } from "@/lib/html/sanitizePageHtml";
import type { ShopLocale } from "@/lib/i18n/locales";
import { Accordion, EYEBROW, Wrap, cx } from "../../ui";
import {
  dropRepeatedTitle,
  groupQuestionSections,
  isQuestionList,
  splitHtmlSections,
} from "../../components/content/htmlSections";
import { SAPIL_PROSE } from "../../components/content/prose";
import { SapilContentCrumbs } from "../../components/content/SapilContentCrumbs";

/**
 * Sapil's `SitePageView`: a text page or policy (the market's cleaned HTML) in the
 * v9 blog typography. Question-and-answer pages fold into the v9 accordion. A
 * contact page also shows the market's contact details.
 */
export function SapilSitePage({
  page,
  contactDetails,
  contactDetailsLabel = "Contact details",
}: {
  page: SitePage;
  contactDetails?: SitePage | null;
  locale: ShopLocale;
  contactDetailsLabel?: string;
}) {
  // The page title below is the page's one H1; a first heading that repeats it is dropped.
  const body = dropRepeatedTitle(sanitizePageHtml(page.bodyHtml, { demoteH1: true }), page.title);
  const contact = contactDetails ? sanitizePageHtml(contactDetails.bodyHtml, { demoteH1: true }) : "";
  const split = splitHtmlSections(body);
  const folded = isQuestionList(split);
  return (
    <div className="pb-[88px]">
      <Wrap>
        <SapilContentCrumbs current={page.title} />
      </Wrap>
      <article className="max-w-[760px] mx-auto px-sapil-gut">
        <h1 className="font-sapil-display !font-[400] text-[clamp(40px,5vw,72px)] !leading-[1.02] mt-[24px] mb-[32px]">{page.title}</h1>
        {folded ? (
          <>
            {split.intro.trim() ? <div className={SAPIL_PROSE} dangerouslySetInnerHTML={{ __html: split.intro }} /> : null}
            {groupQuestionSections(split).map((group, g) => (
              <section key={`g-${g}`} aria-labelledby={group.title ? `qg-${g}` : undefined} className="mt-[32px] first:mt-[24px]">
                {group.title ? (
                  <h2 id={`qg-${g}`} className="font-sapil-display !font-[400] text-[28px] !leading-[1.15] mb-[12px]">
                    {group.title}
                  </h2>
                ) : null}
                <Accordion
                  className="border-t border-sapil-line"
                  items={group.items.map((s, i) => ({
                    id: `q-${g}-${i}`,
                    title: s.title,
                    content: <div className={cx(SAPIL_PROSE, "!text-[15px]")} dangerouslySetInnerHTML={{ __html: s.html }} />,
                  }))}
                />
              </section>
            ))}
          </>
        ) : body ? (
          <div className={SAPIL_PROSE} dangerouslySetInnerHTML={{ __html: body }} />
        ) : null}
        {contact ? (
          <section className="mt-[40px] rounded-[24px] bg-sapil-white p-[28px] shadow-sapil" aria-labelledby="contact-details">
            <h2 id="contact-details" className={EYEBROW}>
              {contactDetailsLabel}
            </h2>
            <div className={cx(SAPIL_PROSE, "mt-[12px]")} dangerouslySetInnerHTML={{ __html: contact }} />
          </section>
        ) : null}
      </article>
    </div>
  );
}
