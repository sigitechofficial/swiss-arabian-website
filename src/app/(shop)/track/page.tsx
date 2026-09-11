import type { Metadata } from "next";
import { TrackLookupView } from "@/features/tracking/components/TrackLookupView";

export const metadata: Metadata = {
  title: "Track your order",
  robots: { index: false, follow: true },
};

export default function TrackLookupPage() {
  return <TrackLookupView />;
}
