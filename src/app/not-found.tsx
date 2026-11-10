"use client";

import { usePathname } from "next/navigation";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { useMarket } from "@/providers/MarketProvider";

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
  const { marketId, regionOptions } = useMarket();
  const marketName = regionOptions.find(
    (option) => option.id === marketId,
  )?.label;
  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const catalogPath =
    /\/(products|collections|categories|pages|policies)\//.test(pathname);

  const title = isArabic ? "الصفحة غير موجودة" : "Page not found";
  const message =
    catalogPath && marketName
      ? isArabic
        ? `هذه الصفحة غير متوفرة في ${marketName}. قد لا يكون المنتج متاحاً في هذا البلد، أو قد يكون الرابط غير صحيح.`
        : `This isn’t available in ${marketName}. It may not be sold in this country, or the address may be wrong.`
      : isArabic
        ? "الصفحة التي تبحث عنها غير موجودة."
        : "The page you are looking for does not exist.";

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
              {isArabic ? "تصفح المجموعات" : "Browse collections"}
            </LocaleLink>
          ) : null}
          <LocaleLink
            className={catalogPath ? buttonSecondary : buttonPrimary}
            href="/"
          >
            {isArabic ? "العودة إلى الرئيسية" : "Back home"}
          </LocaleLink>
        </div>
      </section>
    </StorefrontShell>
  );
}
