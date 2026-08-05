import { AccountPlaceholderPageView } from "@/features/account";

export const metadata = {
  title: "Wishlist",
};

export default function AccountWishlistPage() {
  return (
    <AccountPlaceholderPageView
      title="Wishlist"
      description="Saved wishlist items will appear here once the storefront wishlist API is available."
    />
  );
}
