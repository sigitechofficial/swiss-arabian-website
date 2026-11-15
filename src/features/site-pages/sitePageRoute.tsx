import { SitePageView } from "./components/SitePageView";
import {
  SitePageRouteBase,
  type SitePagePreviewInfo,
  type SitePageRouteProps,
} from "./sitePageRouteBase";

export { sitePageMetadata } from "./sitePageRouteBase";

/** Admin preview banner (Swiss Arabian). */
function SitePagePreviewNotice({ preview }: { preview: SitePagePreviewInfo }) {
  return (
    <div
      role="status"
      className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900"
    >
      Preview of version {preview.number} “{preview.label}”
      {preview.status === "SCHEDULED" && preview.effectiveFrom
        ? `, scheduled for ${new Date(preview.effectiveFrom).toUTCString()}`
        : preview.status === "ACTIVE"
          ? " (live now)"
          : ` (${preview.status.toLowerCase()}, not live)`}
      . Shoppers do not see this link.
    </div>
  );
}

/** Swiss Arabian's /pages/[handle] and /policies/[handle] (logic in sitePageRouteBase). */
export function SitePageRoute(props: SitePageRouteProps) {
  return (
    <SitePageRouteBase
      {...props}
      View={SitePageView}
      PreviewNotice={SitePagePreviewNotice}
    />
  );
}
