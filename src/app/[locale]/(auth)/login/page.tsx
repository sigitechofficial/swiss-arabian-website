import { Suspense } from "react";
import { LoginPageView, PageLoading } from "@brand-ui";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" />}>
      <LoginPageView />
    </Suspense>
  );
}
