import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { TrackLookupView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  const base = await pageMetadata({
    path: "/track",
    title: t("pages.track.title"),
    description: t("pages.track.description"),
  });
  // A lookup form, not content: kept out of search.
  return { ...base, robots: { index: false, follow: true } };
}

export default function TrackLookupPage() {
  return <TrackLookupView />;
}
