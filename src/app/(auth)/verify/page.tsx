import { Suspense } from "react";
import { VerifyPageView } from "@/features/auth";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageView />
    </Suspense>
  );
}
