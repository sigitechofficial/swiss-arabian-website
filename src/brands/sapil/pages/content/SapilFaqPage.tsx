"use client";

import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button } from "../../ui";
import { SapilLink } from "../../components/shared/SapilLink";
import { SapilStatePanel } from "../../components/states/SapilStatePanel";

/**
 * Sapil's `FaqPageView`: shown only when the market has no FAQ page of its own
 * (Pages & policies). The built-in FAQ is another brand's text, so Sapil shows
 * help links instead of questions it hasn't written.
 */
export function SapilFaqPage(_props: { initialDrawer?: string }) {
  const t = useSapilCopy();
  return (
    <SapilStatePanel
      eyebrow={t("content.faqEyebrow")}
      title={t("content.faqTitle")}
      accent={t("content.faqAccent")}
      lead={t("content.faqLead")}
      sticker="?"
      actions={
        <>
          <Button href="/track" LinkComponent={SapilLink}>
            {t("content.faqTrack")}
          </Button>
          <Button href="/pages/contact" variant="line" LinkComponent={SapilLink}>
            {t("content.faqContact")}
          </Button>
        </>
      }
    />
  );
}
