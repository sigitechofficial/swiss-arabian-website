import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { AccountWishlistPageView } from "@/features/wishlist";

export const metadata = {
  title: "Saved Items",
};

export default function AccountSavedPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading saved items…" fill />}>
      <AccountWishlistPageView title="Saved Items" />
    </Suspense>
  );
}
