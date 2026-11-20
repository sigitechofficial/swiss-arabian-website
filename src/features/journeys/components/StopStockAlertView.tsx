"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api/apiClient";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

type Status = "idle" | "working" | "done" | "failed";

/**
 * Opened from "Stop alerts for this product" in a back-in-stock email (D3-4b). Like unsubscribe, the
 * shopper confirms with a button (mail scanners that prefetch links must not cancel anything). The
 * signed token names this one request; other alerts and marketing consent are not touched.
 */
export function StopStockAlertView() {
  const copy = useShopCopy();
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "idle" : "failed");
  const [product, setProduct] = useState<string | null>(null);

  const confirm = async () => {
    setStatus("working");
    try {
      const result = await apiPost<{ ok: boolean; productName?: string }>(
        "/storefront/catalog/stock-alerts/cancel",
        { token },
      );
      setProduct(result.productName ?? null);
      setStatus(result.ok ? "done" : "failed");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-light">{copy("stockAlertStopTitle")}</h1>
      {status === "done" && (
        <p role="status">
          {product ? copy("stockAlertStopDone", { product }) : copy("stockAlertStopDoneGeneric")}
        </p>
      )}
      {status === "failed" && <p role="alert">{copy("stockAlertStopFailed")}</p>}
      {(status === "idle" || status === "working") && (
        <>
          <p>{copy("stockAlertStopBody")}</p>
          <button
            type="button"
            onClick={confirm}
            disabled={status === "working"}
            className="rounded-full bg-black px-6 py-3 text-sm uppercase tracking-wider text-white disabled:opacity-60"
          >
            {copy("stockAlertStopAction")}
          </button>
        </>
      )}
      <LocaleLink href="/" className="text-sm underline">
        {copy("unsubscribeBack")}
      </LocaleLink>
    </main>
  );
}
