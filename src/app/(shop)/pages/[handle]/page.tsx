import type { Metadata } from "next";
import {
  SitePageRoute,
  sitePageMetadata,
} from "@/features/site-pages/sitePageRoute";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return sitePageMetadata("PAGE", decodeURIComponent(handle));
}

export default async function SiteTextPage({ params }: Props) {
  const { handle } = await params;
  return <SitePageRoute kind="PAGE" handle={decodeURIComponent(handle)} />;
}
