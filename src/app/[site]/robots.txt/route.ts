import { hostFromSiteKey } from "@/lib/site/siteKey";
import { withSiteHost } from "@/lib/site/siteScope";
import { staticSiteKeys } from "@/lib/site/staticSites";
import { siteRobotsTxt } from "@/lib/seo/siteRobots";

/** Rebuilt at most once an hour per website address (no request data is read). */
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await staticSiteKeys()).map((site) => ({ site }));
}

/** `/robots.txt` of each website address (the proxy rewrites it to `/<site>/robots.txt`). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ site: string }> },
) {
  const host = hostFromSiteKey((await params).site);
  if (!host) return new Response("Not found", { status: 404 });
  const body = await withSiteHost(host, siteRobotsTxt);
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
