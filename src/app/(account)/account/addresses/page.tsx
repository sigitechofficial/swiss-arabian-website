import type { Metadata } from "next";
import { AccountAddressesPageView } from "@/features/account/components/AccountAddressesPageView";

export const metadata: Metadata = {
  title: "Addresses",
};

export default function AddressesPage() {
  return <AccountAddressesPageView />;
}
