import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { FooterSeoText } from "@/features/seo-footer/FooterSeoText";
import { MarketSeoTextSlot } from "@/features/seo-footer/MarketSeoTextSlot";

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
