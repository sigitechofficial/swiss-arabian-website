import { AccountPlaceholderPageView } from "@/features/account";

export const metadata = {
  title: "Addresses",
};

export default function AccountAddressesPage() {
  return (
    <AccountPlaceholderPageView
      title="Addresses"
      description="Saved shipping addresses will be managed here once the customer address API (Phase 2) is available."
    />
  );
}
