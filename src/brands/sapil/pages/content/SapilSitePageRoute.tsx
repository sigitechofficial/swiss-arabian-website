import {
  SitePageRouteBase,
  type SitePagePreviewInfo,
  type SitePageRouteProps,
} from "@/features/site-pages/sitePageRouteBase";
import { intlLocale } from "@/lib/i18n/locales";
import { sapilTranslator } from "../../i18n/server";
import { SapilSitePage } from "./SapilSitePage";

/** Admin preview notice, in Sapil's wording and look (butter band above the page). */
async function SapilSitePagePreviewNotice({ preview }: { preview: SitePagePreviewInfo }) {
  const { locale, t } = await sapilTranslator();
  const state =
    preview.status === "SCHEDULED" && preview.effectiveFrom
      ? t("content.previewScheduled", {
          date: new Date(preview.effectiveFrom).toLocaleString(intlLocale(locale), {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          }),
        })
      : preview.status === "ACTIVE"
        ? t("content.previewLive")
        : t("content.previewNotLive");
  return (
    <div
      role="status"
      className="bg-sapil-p-butter text-sapil-ink px-sapil-gut py-[10px] text-center text-[13px] font-[500]"
    >
      {t("content.previewVersion", { number: preview.number, label: preview.label })} · {state}.{" "}
      {t("content.previewHidden")}
    </div>
  );
}

/** Sapil's /pages/[handle] and /policies/[handle]: shared loading, Sapil's view. */
export function SapilSitePageRoute(props: SitePageRouteProps) {
  return <SitePageRouteBase {...props} View={SapilSitePage} PreviewNotice={SapilSitePagePreviewNotice} />;
}
