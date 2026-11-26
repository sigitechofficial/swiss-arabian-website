import { parseSiteKey } from "@/lib/site/siteKey";
import { withSiteHost } from "@/lib/site/siteScope";
import { siteSitemap, sitemapXml } from "@/lib/seo/siteSitemap";

/** Rebuilt at most once an hour per website address (no request data is read). */
export const revalidate = 3600;

/** Rendered per address on first request (no build-time environment, W4). */
export function generateStaticParams(): Array<{ site: string }> {
  return [];
}

/** `/sitemap.xml` of each website address: its own market's pages and hreflang. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ site: string }> },
) {
  // `swissarabian.com~KWT`: the sitemap of a market the shared address serves (/~KWT/sitemap.xml).
  const key = parseSiteKey((await params).site);
  if (!key) return new Response("Not found", { status: 404 });
  const body = await withSiteHost(
    key.host,
    async () => sitemapXml(await siteSitemap()),
    key.marketCode,
  );
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
