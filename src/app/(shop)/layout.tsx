import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { FooterSeoText } from "@/features/seo-footer/FooterSeoText";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StorefrontShell beforeFooter={<FooterSeoText />}>{children}</StorefrontShell>;
}
