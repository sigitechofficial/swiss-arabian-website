import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { CatalogPageView } from "@/features/catalog";

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading fragrances…" fill />}>
      <CatalogPageView />
    </Suspense>
  );
}
