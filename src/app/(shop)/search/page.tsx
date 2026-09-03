import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { SearchPageView } from "@/features/search";

export default function SearchPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading search…" fill />}>
      <SearchPageView />
    </Suspense>
  );
}
