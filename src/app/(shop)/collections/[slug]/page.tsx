import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { CollectionDetailPageView } from "@/features/collections";

export default function CollectionDetailPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading collection…" fill />}>
      <CollectionDetailPageView />
    </Suspense>
  );
}
