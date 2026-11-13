import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api/apiClient";
import { ApiClientError } from "@/lib/api/apiError";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { storefrontContextQuery } from "@/lib/storefront/context";
import { pageContainer } from "@/styles/siteChrome";
import { OfferShop } from "@brand-ui";

/**
 * True when the offer exists and runs in the request's market; false when it
 * does not (the page answers "not found", so empty offer pages never get
 * indexed); null when the store could not be asked (the page still renders and
 * shows its own error).
 */
async function offerAvailable(code: string): Promise<boolean | null> {
  const { locale, zoneCode, market } = await resolveRequestCatalogMarket();
  if (!zoneCode) return null;
  try {
    const params = new URLSearchParams(
      storefrontContextQuery({ ...market, zoneCode }),
    );
    params.set("locale", locale);
    const data = await apiGet<{ offer?: unknown; available?: boolean }>(
      `/storefront/promotions/offers/${encodeURIComponent(code)}?${params.toString()}`,
      { skipAuth: true },
    );
    return Boolean(data && "offer" in data && data.offer);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return false;
    return null;
  }
}

export default async function OfferPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  if ((await offerAvailable(decoded)) === false) notFound();
  return (
    <main className={`${pageContainer} pt-8 pb-16`}>
      <OfferShop code={decoded} />
    </main>
  );
}
