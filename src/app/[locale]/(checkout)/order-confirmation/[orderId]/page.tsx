import { routeTranslator } from "@/lib/i18n/routeLocale";
import { Suspense } from "react";
import type { Metadata } from "next";
import { OrderConfirmationView, PageLoading } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.orderConfirmation"),
    robots: { index: false, follow: false },
  };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <Suspense fallback={<PageLoading label="Loading your order…" fill />}>
      <OrderConfirmationView orderId={orderId} />
    </Suspense>
  );
}
