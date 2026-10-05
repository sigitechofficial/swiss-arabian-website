import { OfferShop } from "@/features/promotions/components/OfferShop";

export default async function OfferPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="container container--full" style={{ padding: "32px 0 64px" }}>
      <OfferShop code={decodeURIComponent(code)} />
    </main>
  );
}
