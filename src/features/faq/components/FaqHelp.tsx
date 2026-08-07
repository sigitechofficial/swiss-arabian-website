import Link from "next/link";

import { faqContact } from "../data/faqContent";

/** Figma help-section 997:8630 */
export function FaqHelp() {
  return (
    <section
      className="bg-cream px-4 py-14 text-center dark:bg-section-soft sm:px-6 sm:py-16 lg:px-10 lg:py-[60px]"
      aria-labelledby="faq-help-heading"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
        Nothing in the drawers?
      </p>
      <h2
        id="faq-help-heading"
        className="mt-3 font-sans text-[28px] font-bold text-sa-primary sm:text-[36px]"
      >
        Speak to a consultant
      </h2>
      <p className="mx-auto mt-4 max-w-[480px] text-[15px] leading-[1.6] text-sa-secondary">
        Our customer care and perfume consultant team can help you find your
        signature, track an order, or answer anything else.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3.5">
        <Link
          href={faqContact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 min-w-[226px] items-center justify-center rounded border border-terra px-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-terra transition-colors hover:bg-terra hover:text-white"
        >
          {faqContact.whatsappLabel}
        </Link>
        <Link
          href={faqContact.emailHref}
          className="inline-flex h-11 min-w-[226px] items-center justify-center rounded border border-terra px-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-terra transition-colors hover:bg-terra hover:text-white"
        >
          {faqContact.emailLabel}
        </Link>
      </div>
    </section>
  );
}
