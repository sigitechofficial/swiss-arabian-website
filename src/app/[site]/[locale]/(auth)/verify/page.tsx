import { Suspense } from "react";
import { PageLoading, VerifyPageView } from "@brand-ui";

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" labelKey="page" />}>
      <VerifyPageView />
    </Suspense>
  );
}
