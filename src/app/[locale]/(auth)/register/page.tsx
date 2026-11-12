import { Suspense } from "react";
import { RegisterPageView } from "@/features/auth";
import { PageLoading } from "@/components/ui";

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" />}>
      <RegisterPageView />
    </Suspense>
  );
}
