import { routeTranslator } from "@/lib/i18n/routeLocale";
import { Suspense } from "react";
import type { Metadata } from "next";
import { GuestTrackingPageView, PageLoading } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.track.title"),
    robots: { index: false, follow: false },
  };
}

export default async function GuestTrackingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return (
    <Suspense fallback={<PageLoading label="Looking up your order…" fill />}>
      <GuestTrackingPageView orderNumber={decodeURIComponent(orderNumber)} />
    </Suspense>
  );
}
