import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { Suspense } from "react";
import { PageLoading, VerifyPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  // A form or the bag, not content: named in the tab, kept out of search.
  return { title: t("pages.title.verify"), robots: { index: false, follow: true } };
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" labelKey="page" />}>
      <VerifyPageView />
    </Suspense>
  );
}
