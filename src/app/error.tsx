"use client";

import { useEffect } from "react";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { CrashFallback } from "@/components/ui/CrashFallback";
import { reportClientError } from "@/lib/observability/reportClientError";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { boundary: "route", digest: error.digest });
  }, [error]);

  return (
    <StorefrontShell>
      <CrashFallback onRetry={reset} />
    </StorefrontShell>
  );
}
