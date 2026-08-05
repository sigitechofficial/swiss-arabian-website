import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { LoginPageView } from "@/features/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" fill />}>
      <LoginPageView />
    </Suspense>
  );
}
