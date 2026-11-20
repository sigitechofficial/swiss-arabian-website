"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { pageContainer } from "@/styles/siteChrome";
import { emptyArt, emptyCta, emptyEyebrow, emptyState, emptyText, emptyTitle } from "../../catalogChrome";
import { MediaImage } from "@/components/ui/MediaImage";

export function CatalogCollectionEmpty() {
  const copy = useShopCopy();
  return (
    <div className={pageContainer}>
      <div className={emptyState} role="status">
        <MediaImage className={emptyArt} src="/assets/catalog/empty-products.svg" alt="" width={180} height={180} />
        <p className={emptyEyebrow}>{copy("checkout.pay.comingSoon")}</p>
        <h3 className={emptyTitle}>{copy("empty")}</h3>
        <p className={emptyText}>
          {copy("catalog.collectionEmpty")}
        </p>
        <LocaleLink className={emptyCta} href="/products">
          {copy("browseAll")}
        </LocaleLink>
      </div>
    </div>
  );
}
