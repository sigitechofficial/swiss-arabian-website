import { Suspense } from "react";
import { GuestTrackingPageView } from "@/features/tracking/components/GuestTrackingPageView";

export const metadata = { title: "Track Your Order — Swiss Arabian" };

export default async function GuestTrackingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page">
          <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        </div>
      }
    >
      <GuestTrackingPageView orderNumber={orderNumber} />
    </Suspense>
  );
}
