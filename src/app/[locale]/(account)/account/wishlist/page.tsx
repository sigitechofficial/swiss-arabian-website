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

export default async function AccountWishlistPage() {
  const { t } = await routeTranslator();
  return (
    <Suspense fallback={<PageLoading label="Loading wishlist…" labelKey="wishlist" fill />}>
      <AccountWishlistPageView title={t("pages.title.wishlist")} />
    </Suspense>
  );
}
