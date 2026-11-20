"use client";

import Image from "next/image";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

type CatalogEmptyStateProps = {
  title?: string;
  description?: string;
  /** The home link's wording (pages in another language pass theirs). */
  backLabel?: string;
};

export function CatalogEmptyState({
  title: titleProp,
  description: descriptionProp,
  backLabel: backLabelProp,
}: CatalogEmptyStateProps) {
  const t = useShopCopy();
  const title = titleProp ?? t("catalog.emptyState.title");
  const description = descriptionProp ?? t("catalog.emptyState.description");
  const backLabel = backLabelProp ?? t("catalog.emptyState.back");
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
      role="status"
    >
      <Image
        src="/assets/catalog/empty-products.svg"
        alt=""
        width={200}
        height={200}
        className="mb-6 opacity-90"
        unoptimized
      />
      <h2 className="font-sans text-[22px] font-medium tracking-[-0.01em] text-sa-primary">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-sa-muted">
        {description}
      </p>
      <LocaleLink
        href="/"
        className="mt-6 inline-flex h-[42px] cursor-pointer items-center justify-center bg-terra px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#a25e48]"
      >
        {backLabel}
      </LocaleLink>
    </div>
  );
}
