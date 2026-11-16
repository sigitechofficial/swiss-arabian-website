import { FooterSeoText, MarketSeoTextSlot, StorefrontShell } from "@brand-ui";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontShell
      beforeFooter={
        // Collection pages render their own SEO text block (collection text, else this one).
        <MarketSeoTextSlot>
          <FooterSeoText />
        </MarketSeoTextSlot>
      }
    >
      {children}
    </StorefrontShell>
  );
}
