import type { Metadata } from "next";
import { AccountAddressesPageView } from "@brand-ui";

export const metadata: Metadata = {
  title: "Addresses",
};

export default function AddressesPage() {
  return <AccountAddressesPageView />;
}
