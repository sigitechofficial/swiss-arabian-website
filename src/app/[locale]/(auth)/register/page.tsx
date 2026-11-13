import { Suspense } from "react";
import { PageLoading, RegisterPageView } from "@brand-ui";

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" />}>
      <RegisterPageView />
    </Suspense>
  );
}
