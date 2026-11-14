import { routeTranslator } from "@/lib/i18n/routeLocale";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading, PaymentCancelView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.paymentCancel"),
    robots: { index: false, follow: false },
  };
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" fill />}>
      <PaymentCancelView />
    </Suspense>
  );
}
