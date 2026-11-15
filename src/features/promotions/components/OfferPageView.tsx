import { pageContainer } from "@/styles/siteChrome";
import { OfferShop } from "./OfferShop";

/** Swiss Arabian's /offers/[code] page: the offer builder in the site container. */
export function OfferPageView({ code }: { code: string }) {
  return (
    <main className={`${pageContainer} pt-8 pb-16`}>
      <OfferShop code={code} />
    </main>
  );
}
