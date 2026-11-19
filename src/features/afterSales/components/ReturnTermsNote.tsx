"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { TextWithLinks, linkSlots } from "@/lib/i18n/TextWithLinks";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

/**
 * One line before purchase pointing to the market's return terms (generated from
 * its settings): how offers, free gifts and free delivery work on a return.
 */
export function ReturnTermsNote({ className }: { className?: string }) {
  const t = useShopCopy();
  return (
    <p className={className ?? "text-[12px] leading-relaxed text-sa-muted"}>
      <TextWithLinks
        text={t("returnsPolicy.bagNote", linkSlots(["terms"]))}
        links={{
          terms: (
            <LocaleLink href="/return-terms" className="font-semibold text-terra underline">
              {t("returnsPolicy.termsLink")}
            </LocaleLink>
          ),
        }}
      />
    </p>
  );
}
