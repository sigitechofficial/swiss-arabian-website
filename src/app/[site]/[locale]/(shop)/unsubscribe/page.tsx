import type { Metadata } from "next";
import { Suspense } from "react";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { UnsubscribeView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return { title: t("unsubscribeTitle"), robots: { index: false, follow: false } };
}

/** The unsubscribe link of every marketing email (each brand draws its own page). */
export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeView />
    </Suspense>
  );
}
