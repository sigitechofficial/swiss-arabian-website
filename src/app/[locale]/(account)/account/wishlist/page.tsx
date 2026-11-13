import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { Suspense } from "react";
import { AccountWishlistPageView, PageLoading } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.wishlist"),
  };
}

export default function AccountWishlistPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading wishlist…" fill />}>
      <AccountWishlistPageView title="Wishlist" />
    </Suspense>
  );
}
