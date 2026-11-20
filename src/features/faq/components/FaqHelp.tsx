"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { faqContact } from "../data/faqContent";

const buttonClass =
  "inline-flex h-12 min-w-[230px] items-center justify-center gap-2 rounded-full border border-terra px-6 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors";

/** "Speak to a consultant" — the contact block the account "Get help" links land on. */
export function FaqHelp() {
  const t = useShopCopy();
  return (
    <section
      id="contact"
      className="scroll-mt-40 bg-section-soft px-4 py-14 text-center sm:py-16"
      aria-labelledby="faq-help-heading"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{t("faq.help.eyebrow")}</p>
      <h2 id="faq-help-heading" className="mt-3 text-[26px] font-bold text-sa-primary sm:text-[32px]">
        {t("faq.help.title")}
      </h2>
      <p className="mx-auto mt-4 max-w-[480px] text-[14.5px] leading-[1.65] text-sa-secondary">
        {t("faq.help.body")}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={faqContact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-terra text-white hover:opacity-90`}
        >
          {faqContact.whatsappLabel}
        </a>
        <a href={faqContact.emailHref} className={`${buttonClass} text-terra hover:bg-terra hover:text-white`}>
          {t("faq.help.email")}
        </a>
      </div>
    </section>
  );
}
