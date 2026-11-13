"use client";

import { usePathname } from "next/navigation";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useMarket } from "@/providers/MarketProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { StorefrontShell } from "@brand-ui/client";

const buttonPrimary =
  "inline-flex h-11 items-center justify-center rounded-md bg-terra px-5 text-sm font-semibold text-white hover:bg-[var(--sa-action-primary-hover)]";
const buttonSecondary =
  "inline-flex h-11 items-center justify-center rounded-md border border-sa-border px-5 text-sm font-semibold text-sa-primary";

/**
 * Products, collections and pages differ per market: say which market was
 * searched, so a shopper who just switched country understands why.
 */
export default function NotFound() {
  const pathname = usePathname() ?? "";
  const t = useShopCopy();
  const { marketId, regionOptions } = useMarket();
  const marketName = regionOptions.find(
    (option) => option.id === marketId,
  )?.label;
  const catalogPath =
    /\/(products|collections|categories|pages|policies)\//.test(pathname);

  const title = t("notFound.title");
  const message =
    catalogPath && marketName
      ? t("notFound.marketMessage", { market: marketName })
      : t("notFound.message");

  return (
    <StorefrontShell>
      <section
        data-page-not-found=""
        className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center"
      >
        <h1 className="font-display text-4xl text-sa-primary">{title}</h1>
        <p className="text-sa-muted">{message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {catalogPath ? (
            <LocaleLink className={buttonPrimary} href="/collections">
              {t("notFound.browseCollections")}
            </LocaleLink>
          ) : null}
          <LocaleLink
            className={catalogPath ? buttonSecondary : buttonPrimary}
            href="/"
          >
            {t("notFound.backHome")}
          </LocaleLink>
        </div>
      </section>
    </StorefrontShell>
  );
}
