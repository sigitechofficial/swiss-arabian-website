import { loadCmsPreviewHome } from "@/features/cms/preview/loadPreviewHome";
import { sapilTranslator } from "../../i18n/server";
import { Button } from "../../ui";
import { SapilHomeSections } from "../../components/home/SapilHomeSections";
import { SapilLink } from "../../components/shared/SapilLink";
import { SapilStatePanel } from "../../components/states/SapilStatePanel";

/**
 * Sapil's `CmsPreviewHomeView` (/preview/home, opened from the admin): the
 * Draft homepage drawn with Sapil's own home sections, the same way
 * `SapilHomePage` draws the published one. Loading is shared
 * (`loadCmsPreviewHome`).
 */
export async function SapilCmsPreviewHome() {
  const [preview, { t }] = await Promise.all([loadCmsPreviewHome(), sapilTranslator()]);

  if (preview.status === "expired") {
    return (
      <SapilStatePanel
        eyebrow={t("home.previewExpiredEyebrow")}
        title={t("home.previewExpiredTitle")}
        accent={t("home.previewExpiredAccent")}
        lead={t("home.previewExpiredLead")}
        actions={
          <Button href="/" LinkComponent={SapilLink}>
            {t("home.previewBack")}
          </Button>
        }
      />
    );
  }

  return (
    <div data-cms-home="preview" data-zone={preview.zoneCode} data-locale={preview.languageCode}>
      <div
        role="status"
        className="sticky top-0 z-50 bg-sapil-accent text-sapil-white px-sapil-gut py-[10px] text-center text-[13px] font-[500]"
      >
        {t("home.previewBar", { zone: preview.zoneCode, language: preview.languageCode })}
        {" · "}
        <SapilLink href="/" className="underline underline-offset-2">
          {t("home.previewExit")}
        </SapilLink>
      </div>
      {preview.status === "ready" ? (
        <SapilHomeSections sections={preview.result.sections} />
      ) : (
        <SapilStatePanel
          eyebrow={t("home.previewEmptyEyebrow")}
          title={t("home.previewEmptyTitle")}
          accent={t("home.previewEmptyAccent")}
          lead={t("home.previewEmptyLead")}
        />
      )}
    </div>
  );
}
