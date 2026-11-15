import type { Metadata } from "next";
import { previewParamsFrom } from "@/features/site-pages/api/sitePages.service";
import { sitePageMetadata } from "@/features/site-pages/sitePageRouteBase";
import { SitePageRoute } from "@brand-ui";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { handle } = await params;
  return sitePageMetadata(
    "PAGE",
    decodeURIComponent(handle),
    previewParamsFrom(await searchParams),
  );
}

export default async function SiteTextPage({ params, searchParams }: Props) {
  const { handle } = await params;
  return (
    <SitePageRoute
      kind="PAGE"
      handle={decodeURIComponent(handle)}
      previewParams={previewParamsFrom(await searchParams)}
    />
  );
}
