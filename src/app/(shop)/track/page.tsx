import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { TrackLookupView } from "@/features/tracking/components/TrackLookupView";

export async function generateMetadata(): Promise<Metadata> {
  const base = await pageMetadata({
    path: "/track",
    title: "Track your order",
    titleAr: "تتبع طلبك",
    description: "Track your Swiss Arabian order with your order number and email or phone.",
    descriptionAr: "تتبع طلبك من سويس أرابيان برقم الطلب والبريد الإلكتروني أو رقم الهاتف.",
  });
  // A lookup form, not content: kept out of search.
  return { ...base, robots: { index: false, follow: true } };
}

export default function TrackLookupPage() {
  return <TrackLookupView />;
}
