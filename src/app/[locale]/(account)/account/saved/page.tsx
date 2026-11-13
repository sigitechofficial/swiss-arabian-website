import { Suspense } from "react";
import { AccountWishlistPageView, PageLoading } from "@brand-ui";

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
