import { Suspense } from "react";
import { VerifyPageView } from "@/features/auth";
import { PageLoading } from "@/components/ui";

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" />}>
      <VerifyPageView />
    </Suspense>
  );
}
