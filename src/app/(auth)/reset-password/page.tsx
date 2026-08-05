import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { ResetPasswordPageView } from "@/features/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading…" fill />}>
      <ResetPasswordPageView />
    </Suspense>
  );
}
