"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api/apiClient";
import { localizeHref } from "@/lib/i18n/localePath";

type LinkOpenResult = { ok: boolean; destination: string | null };

/** Only ever forward to a path on this site: the backend checks too, this is the second lock. */
export function isSitePath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"));
}

export type UnsubscribeStatus = "idle" | "working" | "done" | "failed";

/**
 * The unsubscribe link at the bottom of every marketing email, for every brand.
 * The customer confirms with one click (a button, not the page load, so mail
 * scanners that prefetch links cannot unsubscribe anyone). The signed token in
 * the link identifies them; no sign-in is needed.
 */
export function useUnsubscribe() {
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<UnsubscribeStatus>(token ? "idle" : "failed");
  const confirm = async () => {
    setStatus("working");
    try {
      const result = await apiPost<{ ok: boolean }>("/storefront/email-preferences/unsubscribe", { token });
      setStatus(result.ok ? "done" : "failed");
    } catch {
      setStatus("failed");
    }
  };
  return { status, confirm };
}

/**
 * A journey email's button (`/r?t=<token>`), for every brand: tells the backend
 * it was pressed (so the click can be reported), then forwards to the page the
 * email meant, in the reader's language. Never signs anyone in. Runs in the
 * browser, so mail scanners that only fetch the address do not count as clicks.
 */
export function useEmailLinkRedirect() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const token = useSearchParams().get("t") ?? "";
  const [failed, setFailed] = useState(!token);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    apiPost<LinkOpenResult>("/storefront/email-links/open", { token })
      .then((result) => {
        if (result.ok && isSitePath(result.destination)) {
          router.replace(localizeHref(result.destination, pathname));
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
  }, [token, router, pathname]);

  return { failed };
}
