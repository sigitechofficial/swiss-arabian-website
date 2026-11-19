"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { CookieSettingsLink } from "@/components/layout/CookieSettingsLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useNavigation } from "@/features/navigation";
import type { NavItem } from "@/features/navigation/types/navigation";
import { useMarket } from "@/providers/MarketProvider";
import type { FormEvent } from "react";
import { socialNetwork } from "@/lib/social/socialNetworks";
import { useFooterContent } from "@/features/cms/hooks/useCmsGlobalRegion";
import {
  footerColLinks,
  footerColTitle,
  footerColTitleCaps,
  footerCols,
  footerLegal,
  footerNewsletter,
  footerNewsletterInput,
  footerNewsletterRow,
  footerNewsletterSubmit,
  footerNewsletterTitle,
  footerPayments,
  footerSocial,
  pageContainer,
  payMark,
  payMarkAmex,
  payMarkApple,
  payMarkGpay,
  payMarkMc,
  payMarkVisa,
  siteFooter,
  socialLink,
  visuallyHidden,
} from "@/styles/siteChrome";

type FooterLink = { label: string; href: string };
type FooterColumn = { id: string; heading: string; links: FooterLink[] };

/** The market's footer menu: each heading with links becomes a column. */
export function footerColumns(items: readonly NavItem[]): FooterColumn[] {
  const columns: FooterColumn[] = [];
  const loose: FooterLink[] = [];
  for (const item of items) {
    const links = (item.children ?? []).flatMap((child) =>
      child.href ? [{ label: child.label, href: child.href }] : [],
    );
    if (links.length) {
      columns.push({ id: item.id, heading: item.label, links });
    } else if (item.href) {
      loose.push({ label: item.label, href: item.href });
    }
  }
  if (loose.length) columns.push({ id: "links", heading: "", links: loose });
  return columns;
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function FooterAnchor({ link }: { link: FooterLink }) {
  return isExternal(link.href) ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer">
      {link.label}
    </a>
  ) : (
    <LocaleLink href={link.href}>{link.label}</LocaleLink>
  );
}

function onNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

export function SiteFooter() {
  const copy = useShopCopy();
  const { marketId } = useMarket();
  const { footerItems, isLoading } = useNavigation(marketId || undefined);
  const columns = footerColumns(footerItems);
  const cms = useFooterContent();
  const socialLinks = cms.socialLinks.flatMap((link) => {
    const network = socialNetwork(link);
    return network ? [{ ...link, network }] : [];
  });

  return (
    <footer className={siteFooter}>
      <div className={pageContainer}>
        <form className={footerNewsletter} onSubmit={onNewsletterSubmit}>
          <p className={footerNewsletterTitle}>
            {cms.newsletterHeading?.trim() || copy("newsletter")}
          </p>
          <div className={footerNewsletterRow}>
            <label className={visuallyHidden} htmlFor="footer-email">
              {copy("email")}
            </label>
            <input
              className={footerNewsletterInput}
              id="footer-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={cms.newsletterPlaceholder?.trim() || copy("email")}
              required
            />
            <button className={footerNewsletterSubmit} type="submit">
              {cms.newsletterButtonLabel?.trim() || copy("signUp")}
            </button>
          </div>
        </form>

        <div className={footerCols}>
          {isLoading && columns.length === 0 ? (
            <section aria-busy="true" aria-label={copy("shop")}>
              <span className="mt-3 block h-24 w-28 animate-pulse bg-[var(--ink)]/10" />
            </section>
          ) : (
            columns.map((column) => (
              <section
                key={column.id}
                aria-labelledby={column.heading ? `fc-${column.id}` : undefined}
                aria-label={column.heading ? undefined : copy("moreLinks")}
              >
                {column.heading ? (
                  <p className={`${footerColTitle} ${footerColTitleCaps}`} id={`fc-${column.id}`}>
                    {column.heading}
                  </p>
                ) : null}
                <ul className={footerColLinks} role="list">
                  {column.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <FooterAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          {socialLinks.length ? (
            <section aria-labelledby="fc-follow">
              <p className={`${footerColTitle} ${footerColTitleCaps}`} id="fc-follow">
                {copy("followUs")}
              </p>
              <ul className={footerSocial} role="list">
                {socialLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      className={socialLink}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.network.label}
                    >
                      {link.network.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className={footerLegal}>
          <p>
            {cms.copyrightText?.trim() || copy("footer.copyright")}
            <CookieSettingsLink className="ms-2 before:me-2 before:content-['·'] before:no-underline before:inline-block" />
          </p>
          {cms.showPaymentBadges === false ? null : (
          <ul className={footerPayments} aria-label={copy("footer.payments")}>
            <li>
              <span className={`${payMark} ${payMarkAmex}`} role="img" aria-label="American Express">
                AMEX
              </span>
            </li>
            <li>
              <span className={`${payMark} ${payMarkApple}`} role="img" aria-label="Apple Pay">
                <svg viewBox="0 0 40 16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M8.1 3.5c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.2 1.2-.5.6-.9 1.5-.8 2.3.9.1 1.7-.4 2.2-1.1zM10.4 4.7c-1.2 0-2.1.7-2.7.7s-1.4-.7-2.4-.7c-1.2 0-2.4.7-3 1.8-1.3 2.2-.3 5.5.9 7.3.6.9 1.3 1.8 2.2 1.8s1.2-.6 2.3-.6 1.4.6 2.3.6 1.5-.9 2.1-1.8c.7-1 1-1.9 1-2 0 0-1.9-.7-1.9-2.8 0-1.8 1.4-2.5 1.5-2.6-.9-1.3-2.2-1.3-2.6-1.3z"
                  />
                  <text x="16" y="12.2" fill="currentColor" fontSize="8.5" fontWeight="600" fontFamily="Arial, sans-serif">
                    Pay
                  </text>
                </svg>
              </span>
            </li>
            <li>
              <span className={`${payMark} ${payMarkGpay}`} role="img" aria-label="Google Pay">
                <svg viewBox="0 0 48 16" aria-hidden="true">
                  <text x="0" y="12.4" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">
                    <tspan fill="#4285F4">G</tspan>
                    <tspan fill="#EA4335">o</tspan>
                    <tspan fill="#FBBC05">o</tspan>
                    <tspan fill="#4285F4">g</tspan>
                    <tspan fill="#34A853">l</tspan>
                    <tspan fill="#EA4335">e</tspan>
                    <tspan fill="#5F6368"> Pay</tspan>
                  </text>
                </svg>
              </span>
            </li>
            <li>
              <span className={`${payMark} ${payMarkMc}`} role="img" aria-label="Mastercard">
                <svg viewBox="0 0 32 20" aria-hidden="true">
                  <circle cx="12.5" cy="10" r="7.2" fill="#eb001b" />
                  <circle cx="19.5" cy="10" r="7.2" fill="#f79e1b" />
                  <path
                    fill="#ff5f00"
                    d="M16 4.8a7.2 7.2 0 0 1 0 10.4 7.2 7.2 0 0 1 0-10.4z"
                  />
                </svg>
              </span>
            </li>
            <li>
              <span className={`${payMark} ${payMarkVisa}`} role="img" aria-label="Visa">
                VISA
              </span>
            </li>
          </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

/** Kept here for existing imports; the list lives in src/lib/social. */
export { socialNetwork };
