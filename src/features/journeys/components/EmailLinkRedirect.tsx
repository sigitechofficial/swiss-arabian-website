"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api/apiClient";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { localizeHref } from "@/lib/i18n/localePath";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

type LinkOpenResult = { ok: boolean; destination: string | null };

/** Only ever forward to a path on this site: the backend checks too, this is the second lock. */
function isSitePath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"));
}

/**
 * Opened from the button in a journey email (`/r?t=<token>`). It tells the backend the button was
 * pressed (so the click can be reported), then forwards the customer to the page the email meant,
 * in the language they are reading. It never signs anyone in: the destination page asks for a
 * sign-in itself if it needs one.
 *
 * Running in the browser matters: mail scanners that only fetch the address do not run this page,
 * so they do not register as clicks.
 */
export function EmailLinkRedirect() {
  const copy = useShopCopy();
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

  return (
    <main className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      {failed ? (
        <>
          <p role="alert">{copy("emailLinkFailed")}</p>
          <LocaleLink href="/" className="text-sm underline">
            {copy("emailLinkHome")}
          </LocaleLink>
        </>
      ) : (
        <p role="status">{copy("emailLinkOpening")}</p>
      )}
    </main>
  );
}
