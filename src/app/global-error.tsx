"use client";

import { useEffect } from "react";
import { CrashFallback } from "@/components/ui/CrashFallback";
import { reportClientError } from "@/lib/observability/reportClientError";
import "./globals.css";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { boundary: "root", digest: error.digest });
    try {
      const mode = localStorage.getItem("sa-color-mode");
      document.documentElement.classList.toggle("dark", mode === "dark");
    } catch {
      // Storage can be blocked. The page still renders in the light theme.
    }
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-dvh flex-col bg-[var(--cream)] font-sans text-[var(--ink)]">
        <CrashFallback
          onRetry={() => {
            window.location.reload();
          }}
        />
      </body>
    </html>
  );
}
