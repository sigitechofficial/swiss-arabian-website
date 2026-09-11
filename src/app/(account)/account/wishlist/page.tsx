import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { AccountWishlistPageView } from "@/features/wishlist";

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
