import { Suspense } from "react";
import { ResetPasswordPageView } from "@/features/auth";
import { PageLoading } from "@/components/ui";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" />}>
      <ResetPasswordPageView />
    </Suspense>
  );
}
