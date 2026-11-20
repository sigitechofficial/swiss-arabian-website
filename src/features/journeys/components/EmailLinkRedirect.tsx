"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useEmailLinkRedirect } from "../hooks/useEmailLinks";

/** Swiss Arabian's "taking you there" page for a journey email's button (logic: useEmailLinkRedirect). */
export function EmailLinkRedirect() {
  const copy = useShopCopy();
  const { failed } = useEmailLinkRedirect();

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
