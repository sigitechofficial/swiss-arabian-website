import { OfferShop } from "@/features/promotions/components/OfferShop";
import { pageContainer } from "@/styles/siteChrome";

export default async function OfferPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className={`${pageContainer} pt-8 pb-16`}>
      <OfferShop code={decodeURIComponent(code)} />
    </main>
  );
}
