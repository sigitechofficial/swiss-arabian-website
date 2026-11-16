import { sapilTranslator } from "../../i18n/server";
import { Button } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import { SapilStatePanel } from "./SapilStatePanel";

/** Sapil's `FeaturePlaceholder`: a page whose content is not published yet, in the v9 state panel. */
export function SapilFeaturePlaceholder({ title, description }: { title: string; description: string }) {
  return <SapilStatePanel title={title} lead={description} />;
}

/**
 * Sapil's `OurStoryFallbackView`: /our-story before the market publishes its
 * story page. Sapil's own words (never another brand's history).
 */
export async function SapilOurStoryFallback() {
  const { t } = await sapilTranslator();
  return (
    <SapilStatePanel
      eyebrow={t("content.storyEyebrow")}
      title={t("content.storyTitle")}
      accent={t("content.storyAccent")}
      lead={t("content.storyLead")}
      actions={
        <Button href="/products" LinkComponent={SapilLink}>
          {t("content.storyCta")}
        </Button>
      }
    />
  );
}
