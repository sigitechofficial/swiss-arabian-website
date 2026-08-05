import { AccountPlaceholderPageView } from "@/features/account";

export const metadata = {
  title: "Saved Items",
};

export default function AccountSavedPage() {
  return (
    <AccountPlaceholderPageView
      title="Saved Items"
      description="Items you save for later will appear here once the storefront wishlist API is available."
    />
  );
}
