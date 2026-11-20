"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { PREFERENCES_PATH, useUnsubscribe } from "../hooks/useEmailLinks";

/** Swiss Arabian's unsubscribe page (logic: useUnsubscribe, every brand). */
export function UnsubscribeView() {
  const copy = useShopCopy();
  const { status, confirm } = useUnsubscribe();

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
      {(status === "done" || status === "failed") && (
        <LocaleLink
          href={PREFERENCES_PATH}
          className="rounded-full bg-black px-6 py-3 text-sm uppercase tracking-wider text-white"
        >
          {copy("unsubscribeManage")}
        </LocaleLink>
      )}
      <LocaleLink href="/" className="text-sm underline">
        {copy("unsubscribeBack")}
      </LocaleLink>
    </main>
  );
}
