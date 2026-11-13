"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";

/** "Skip to content" in the page's language (the shell itself renders on the server). */
export function SkipLink({ className }: { className: string }) {
  const t = useShopCopy();
  return (
    <a className={className} href="#main">
      {t("nav.skip")}
    </a>
  );
}
