import { Suspense } from "react";
import { LoginPageView } from "@/features/auth";
import { PageLoading } from "@/components/ui";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" />}>
      <LoginPageView />
    </Suspense>
  );
}
