import { hostFromSiteKey } from "@/lib/site/siteKey";
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
  const host = hostFromSiteKey((await params).site);
  if (!host) return new Response("Not found", { status: 404 });
  const body = await withSiteHost(host, async () => sitemapXml(await siteSitemap()));
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
