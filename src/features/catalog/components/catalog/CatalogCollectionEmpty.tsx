"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { pageContainer } from "@/styles/siteChrome";
import { emptyArt, emptyCta, emptyEyebrow, emptyState, emptyText, emptyTitle } from "../../catalogChrome";

export function CatalogCollectionEmpty() {
  const copy = useShopCopy();
  return (
    <div className={pageContainer}>
      <div className={emptyState} role="status">
        <img className={emptyArt} src="/assets/catalog/empty-products.svg" alt="" width={180} height={180} />
        <p className={emptyEyebrow}>Coming soon</p>
        <h3 className={emptyTitle}>{copy("empty")}</h3>
        <p className={emptyText}>
          We’re still filling this collection. Explore the rest of the house in the meantime.
        </p>
        <LocaleLink className={emptyCta} href="/products">
          {copy("browseAll")}
        </LocaleLink>
      </div>
    </div>
  );
}
