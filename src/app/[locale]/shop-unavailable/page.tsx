import type { Metadata } from "next";
import { ShopUnavailableView } from "@brand-ui";

export const metadata: Metadata = {
  title: "Shop unavailable",
  robots: { index: false, follow: false },
};

export default function ShopUnavailablePage() {
  return <ShopUnavailableView />;
}
