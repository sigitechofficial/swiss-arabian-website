"use client";

import { usePathname } from "next/navigation";
import { useMarket } from "@/providers/MarketProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import { SapilStatePanel } from "./SapilStatePanel";

/** Sapil's `CrashFallback` (route error boundary). */
export function SapilCrashFallback({ onRetry }: { onRetry: () => void }) {
  const t = useSapilCopy();
  return (
    <SapilStatePanel
      eyebrow={t("shell.errorEyebrow")}
      title={t("shell.errorTitle")}
      accent={t("shell.errorAccent")}
      lead={t("shell.errorLead")}
      sticker="!"
      actions={
        <>
          <Button onClick={onRetry}>{t("common.tryAgain")}</Button>
          {/* Deliberate full document load: after a crash the client state may be corrupt. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="font-[600] text-[15px] border-b border-current pb-[2px] hover:text-sapil-accent">
            {t("shell.backHome")}
          </a>
        </>
      }
    />
  );
}

/** The shop can't be loaded (no market answered): full-page state, outside the shell. */
export function SapilShopUnavailableContent() {
  const t = useSapilCopy();
  return (
    <div className="flex min-h-dvh flex-col justify-center">
      <SapilStatePanel
        eyebrow={t("shell.unavailableEyebrow")}
        title={t("shell.unavailableTitle")}
        accent={t("shell.unavailableAccent")}
        lead={t("shell.unavailableLead")}
        actions={
          <Button href="/" LinkComponent={SapilLink}>
            {t("common.tryAgain")}
          </Button>
        }
      />
    </div>
  );
}

/**
 * Sapil's not-found content. Products, collections and pages differ per market:
 * say which market was searched, so a shopper who just switched country understands why.
 */
export function SapilNotFoundView() {
  const t = useSapilCopy();
  const pathname = usePathname() ?? "";
  const { marketId, regionOptions } = useMarket();
  const marketName = regionOptions.find((option) => option.id === marketId)?.label;
  const catalogPath = /\/(products|collections|categories|pages|policies)\//.test(pathname);
  return (
    <div data-page-not-found="">
      <SapilStatePanel
        eyebrow={t("shell.notFoundEyebrow")}
        title={t("shell.notFoundTitle")}
        accent={t("shell.notFoundAccent")}
        lead={catalogPath && marketName ? t("shell.notFoundMarket", { market: marketName }) : t("shell.notFoundLead")}
        sticker="404"
        actions={
          <>
            {catalogPath ? (
              <Button href="/collections" LinkComponent={SapilLink}>
                {t("shell.browseCollections")}
              </Button>
            ) : null}
            <Button href="/" variant={catalogPath ? "line" : "dark"} LinkComponent={SapilLink}>
              {t("shell.backHome")}
            </Button>
          </>
        }
      />
    </div>
  );
}
