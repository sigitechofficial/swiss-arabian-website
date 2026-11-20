import type { Metadata } from "next";
import { Suspense } from "react";
import { StopStockAlertView } from "@/features/journeys/components/StopStockAlertView";

export const metadata: Metadata = {
  title: "Stop back-in-stock alert",
  robots: { index: false, follow: false },
};

export default function StopStockAlertPage() {
  return (
    <Suspense fallback={null}>
      <StopStockAlertView />
    </Suspense>
  );
}
