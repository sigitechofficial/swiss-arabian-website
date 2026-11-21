import type { Metadata } from "next";
import { Suspense } from "react";
import { StopStockAlertView } from "@/features/journeys/components/StopStockAlertView";
import { routeTranslator } from "@/lib/i18n/routeLocale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return { title: t("stockAlertStopTitle"), robots: { index: false, follow: false } };
}

/** The "Stop alerts for this product" link of a back-in-stock email. */
export default function StopStockAlertPage() {
  return (
    <Suspense fallback={null}>
      <StopStockAlertView />
    </Suspense>
  );
}
