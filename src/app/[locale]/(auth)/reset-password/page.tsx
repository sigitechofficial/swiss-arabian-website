import { Suspense } from "react";
import { PageLoading, ResetPasswordPageView } from "@brand-ui";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" />}>
      <ResetPasswordPageView />
    </Suspense>
  );
}
