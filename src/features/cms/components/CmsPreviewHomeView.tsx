import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { loadCmsPreviewHome } from "../preview/loadPreviewHome";
import { CmsSectionList } from "./CmsSectionList";

export async function CmsPreviewHomeView() {
  const [preview, { t }] = await Promise.all([loadCmsPreviewHome(), routeTranslator()]);

  if (preview.status === "expired") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--ink,#241f1b)]">
          {t("cms.preview.expired")}
        </h1>
        <p className="mt-2 text-[var(--ink-2,#5b5148)]">
          {t("cms.preview.expiredBody")}
        </p>
        <LocaleLink className="mt-6 inline-block underline" href="/">
          {t("cms.preview.back")}
        </LocaleLink>
      </div>
    );
  }

  return (
    <div data-cms-home="preview" data-zone={preview.zoneCode} data-locale={preview.languageCode}>
      <div className="sticky top-0 z-50 border-b border-[var(--line,#E7DDCB)] bg-[#2C241D] px-4 py-2 text-center text-sm text-white">
        {t("cms.preview.banner", { zone: preview.zoneCode, language: preview.languageCode })}
        {" · "}
        <LocaleLink className="underline" href="/">
          {t("cms.preview.exit")}
        </LocaleLink>
      </div>
      {preview.status === "ready" ? (
        <CmsSectionList sections={preview.result.sections} logUnknown />
      ) : (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">{t("cms.preview.empty")}</h1>
          <p className="mt-2 text-[var(--ink-2,#5b5148)]">
            {t("cms.preview.emptyBody")}
          </p>
        </div>
      )}
    </div>
  );
}
