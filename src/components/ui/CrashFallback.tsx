"use client";

import { usePathname } from "next/navigation";
import { localizeHref } from "@/lib/i18n/localePath";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

type CrashFallbackProps = {
  onRetry: () => void;
};

const retryClass =
  "inline-flex h-11 items-center justify-center rounded-md bg-terra px-5 text-sm font-semibold text-white hover:bg-[var(--sa-action-primary-hover)]";

export function CrashFallback({ onRetry }: CrashFallbackProps) {
  // English outside the locale provider (the root error page); the page's language inside it.
  const t = useShopCopy();
  const home = localizeHref("/", usePathname() || "/");
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-balance font-display text-4xl text-sa-primary">
        {t("crash.title")}
      </h1>
      <p className="text-sa-muted">
        {t("crash.body")}
      </p>
      <button type="button" className={retryClass} onClick={onRetry}>
        {t("tryAgain")}
      </button>
      {/* Deliberate full document load: after a crash the client state may be
          corrupt, so a soft <Link> navigation would keep it. */}
      <a className="text-sm text-sa-muted underline underline-offset-4" href={home}>
        {t("crash.home")}
      </a>
    </section>
  );
}
