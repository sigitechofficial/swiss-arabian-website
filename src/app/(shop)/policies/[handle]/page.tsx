import type { Metadata } from "next";
import {
  SitePageRoute,
  sitePageMetadata,
} from "@/features/site-pages/sitePageRoute";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return sitePageMetadata("POLICY", decodeURIComponent(handle));
}

export default async function SitePolicyPage({ params }: Props) {
  const { handle } = await params;
  return <SitePageRoute kind="POLICY" handle={decodeURIComponent(handle)} />;
}
