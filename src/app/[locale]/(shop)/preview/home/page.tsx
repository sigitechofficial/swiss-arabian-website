import type { Metadata } from "next";
import { CmsPreviewHomeView } from "@/features/cms/components/CmsPreviewHomeView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Homepage Draft Preview",
  robots: { index: false, follow: false, nocache: true },
};

export default function PreviewHomePage() {
  return <CmsPreviewHomeView />;
}
