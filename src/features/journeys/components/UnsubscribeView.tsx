"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api/apiClient";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

type Status = "idle" | "working" | "done" | "failed";

/**
 * Opened from the link at the bottom of every marketing email. The customer confirms with one
 * click (a button, not the page load, so mail scanners that prefetch links cannot unsubscribe
 * anyone). The signed token in the link identifies them; no sign-in is needed.
 */
export function UnsubscribeView() {
  const copy = useShopCopy();
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "idle" : "failed");

  const confirm = async () => {
    setStatus("working");
    try {
      const result = await apiPost<{ ok: boolean }>("/storefront/email-preferences/unsubscribe", { token });
      setStatus(result.ok ? "done" : "failed");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-light">{copy("unsubscribeTitle")}</h1>
      {status === "done" && <p role="status">{copy("unsubscribeDone")}</p>}
      {status === "failed" && <p role="alert">{copy("unsubscribeFailed")}</p>}
      {(status === "idle" || status === "working") && (
        <>
          <p>{copy("unsubscribeBody")}</p>
          <button
            type="button"
            onClick={confirm}
            disabled={status === "working"}
            className="rounded-full bg-black px-6 py-3 text-sm uppercase tracking-wider text-white disabled:opacity-60"
          >
            {copy("unsubscribeAction")}
          </button>
        </>
      )}
      <LocaleLink href="/" className="text-sm underline">
        {copy("unsubscribeBack")}
      </LocaleLink>
    </main>
  );
}
