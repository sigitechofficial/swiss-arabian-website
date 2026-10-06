import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoading } from "@/components/ui";
import { GuestTrackingPageView } from "@/features/tracking/components/GuestTrackingPageView";

export const metadata: Metadata = {
  title: "Track your order",
  robots: { index: false, follow: false },
};

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
