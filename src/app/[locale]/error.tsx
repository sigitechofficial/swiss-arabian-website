"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/observability/reportClientError";
import { CrashFallback, StorefrontShell } from "@brand-ui/client";

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
