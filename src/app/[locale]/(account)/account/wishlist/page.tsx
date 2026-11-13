import { Suspense } from "react";
import { AccountWishlistPageView, PageLoading } from "@brand-ui";

export const metadata = {
  title: "Wishlist",
};

export default function AccountWishlistPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading wishlist…" fill />}>
      <AccountWishlistPageView title="Wishlist" />
    </Suspense>
  );
}
