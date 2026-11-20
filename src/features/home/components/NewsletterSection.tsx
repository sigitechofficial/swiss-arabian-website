"use client";

import { useNewsletterSignup } from "@/features/newsletter/hooks/useNewsletterSignup";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

export type NewsletterSectionProps = {
  eyebrow?: string | null;
  heading?: string | null;
  description?: string | null;
  placeholder?: string | null;
  buttonLabel?: string | null;
  successMessage?: string | null;
};

export function NewsletterSection({
  eyebrow: eyebrowProp,
  heading: headingProp,
  description: descriptionProp,
  placeholder = "your@email.com",
  buttonLabel: buttonProp,
  successMessage: successProp,
}: NewsletterSectionProps = {}) {
  const t = useShopCopy();
  // Not set by the CMS (undefined): the house wording in the page's language.
  const eyebrow = eyebrowProp === undefined ? t("newsletter.eyebrow") : eyebrowProp;
  const heading = headingProp === undefined ? t("newsletter.heading") : headingProp;
  const description = descriptionProp === undefined ? t("newsletter.description") : descriptionProp;
  const buttonLabel = buttonProp === undefined ? t("newsletter.signUp") : buttonProp;
  const successMessage = successProp === undefined ? t("newsletter.thanks") : successProp;
  // Consent/provider integration lives in the shared hook (not connected yet).
  const { email, setEmail, submitted, onSubmit } = useNewsletterSignup();

  return (
    <section
      className="bg-cream py-20 text-center dark:bg-section-soft"
      aria-label={t("newsletter.label")}
    >
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-3 font-sans text-3xl font-medium tracking-tight text-sa-primary lg:text-4xl">
          {heading}
        </h2>
        {description ? (
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-sa-muted">
            {description}
          </p>
        ) : null}
        {submitted ? (
          <p className="mt-7 text-[14px] font-medium text-sa-primary" role="status">
            {successMessage}
          </p>
        ) : (
          <form
            className="mx-auto mt-7 flex max-w-md overflow-hidden border border-bone bg-surface"
            onSubmit={onSubmit}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder || "your@email.com"}
              aria-label={t("newsletter.email")}
              className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[14px] text-sa-primary outline-none placeholder:text-sa-muted"
            />
            <button
              type="submit"
              className="shrink-0 bg-inverse px-7 text-[13px] font-semibold text-cream transition-colors hover:opacity-90"
            >
              {buttonLabel || t("newsletter.signUp")}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
