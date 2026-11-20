"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

const action =
  "inline-flex h-11 items-center justify-center rounded-md bg-terra px-5 text-sm font-semibold text-white hover:bg-[var(--sa-action-primary-hover)]";

export function ShopUnavailableView() {
  const t = useShopCopy();
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl text-sa-primary">
        {t("shopUnavailable.title")}
      </h1>
      <p className="text-sa-muted">
        {t("shopUnavailable.body")}
      </p>
      <LocaleLink className={action} href="/">
        {t("tryAgain")}
      </LocaleLink>
    </div>
  );
}
