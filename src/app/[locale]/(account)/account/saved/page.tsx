import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { Suspense } from "react";
import { AccountWishlistPageView, PageLoading } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.saved"),
  };
}

export default function AccountSavedPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading saved items…" labelKey="savedItems" fill />}>
      <AccountWishlistPageView title="Saved Items" />
    </Suspense>
  );
}
