"use client";

import { useMemo, useRef } from "react";
import { useProductDetailPage } from "@/features/catalog/hooks/useProductDetailPage";
import type { ProductDetail } from "@/features/catalog/types/product";
import { useMarketMerchSettings } from "@/features/markets/hooks/useMarketMerchSettings";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Breadcrumbs, Button, Wrap } from "../../ui";
import { CatalogRoot } from "../../components/catalog/CatalogRoot";
import { GridMessage } from "../../components/catalog/ProductGrid";
import { formatSapilPrice, productTile } from "../../components/product/productCardModel";
import { SapilLocaleLink } from "../../components/product/SapilLocaleLink";
import { noteRows } from "../../components/product-page/notes";
import { NotesJourney } from "../../components/product-page/NotesJourney";
import { PdpBuyBox } from "../../components/product-page/PdpBuyBox";
import { PdpGallery } from "../../components/product-page/PdpGallery";
import { PdpRelatedRail } from "../../components/product-page/PdpRelatedRail";
import { PdpReviews } from "../../components/product-page/PdpReviews";
import { StickyBuyBar } from "../../components/product-page/StickyBuyBar";

/**
 * `/products/[handle]` (v9 product): gallery and buy box, notes journey,
 * reviews, "More to fall for" and the sticky add-to-bag bar. Everything but
 * the look comes from the shared `useProductDetailPage`; the route keeps the
 * product JSON-LD, Open Graph tags and metadata.
 */
export function SapilProductPage({
  product: serverDetail,
  serverZoneCode = null,
  slug: routeSlug,
}: {
  product: ProductDetail | null;
  serverZoneCode?: string | null;
  slug: string;
  /** Share links (canonical URL); Sapil's v9 page has no share row. */
  share?: { url: string; image?: string | null } | null;
}) {
  const t = useSapilCopy();
  const locale = useShopLocale();
  const { delivery } = useMarketMerchSettings();
  const page = useProductDetailPage({ product: serverDetail, serverZoneCode, slug: routeSlug });
  const { product, detail } = page;
  const addRowRef = useRef<HTMLDivElement>(null);
  const currency = product?.currency || "AED";
  const money = useMemo(() => (n: number) => formatSapilPrice(n, currency, locale), [currency, locale]);

  const rail = useMemo(() => {
    const seen = new Set<string>();
    return [...page.youMayAlsoLike, ...page.related].filter((p) => !seen.has(p.id) && Boolean(seen.add(p.id))).slice(0, 8);
  }, [page.related, page.youMayAlsoLike]);

  if (!product) {
    return (
      <CatalogRoot>
        <Wrap className="py-[clamp(56px,8vw,112px)]">
          {page.clientStillLoading ? (
            <div aria-busy="true" role="status" aria-label={t("common.loading")} className="min-h-[50vh]" />
          ) : page.loadFailed ? (
            <GridMessage
              role="alert"
              title={t("product.loadFailed")}
              action={
                <Button variant="line" onClick={page.retry}>
                  {t("common.tryAgain")}
                </Button>
              }
            />
          ) : (
            <GridMessage
              title={t("product.missingTitle")}
              action={
                <Button href="/products" LinkComponent={SapilLocaleLink}>
                  {t("product.backToShop")}
                </Button>
              }
            >
              {t("product.missingBody")}
            </GridMessage>
          )}
        </Wrap>
      </CatalogRoot>
    );
  }

  const tile = productTile(product);
  const rows = noteRows(page.metafields);
  const collection = page.moreFromCollection;
  const buyable = product.price != null && product.isSellable !== false && product.inStock !== false;

  return (
    <CatalogRoot>
      <Wrap>
        <Breadcrumbs label={t("content.breadcrumb")}
          LinkComponent={SapilLocaleLink}
          items={[
            { label: t("catalog.home"), href: "/" },
            ...(collection ? [{ label: collection.name, href: `/collections/${collection.slug}` }] : []),
            { label: product.title },
          ]}
        />
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-[56px] items-start pt-[16px] pb-[56px] max-900:grid-cols-1 max-900:gap-[28px] max-900:pb-[64px]">
          <PdpGallery
            images={page.galleryImages}
            name={product.title}
            tile={tile}
            resetKey={page.slug}
            onImageError={page.markImageFailed}
          />
          <PdpBuyBox
            product={product}
            description={page.description}
            metafields={page.metafields}
            collection={collection}
            reviewSummary={page.reviewSummary}
            showReviewRating={page.showReviewRating}
            shippingPromise={page.shippingPromise}
            marketDelivery={delivery}
            cartLine={page.cartLine}
            money={money}
            addRowRef={addRowRef}
            concentration={detail?.concentration}
          />
        </div>
      </Wrap>
      <NotesJourney rows={rows} photos={page.galleryImages.slice(2)} t={t} />
      <PdpReviews key={detail?.id ?? product.id} productId={detail?.id ?? product.id} reviews={page.pdpReviews} />
      <PdpRelatedRail products={rail} />
      {buyable ? (
        <StickyBuyBar
          watchRef={addRowRef}
          name={product.title}
          price={money(product.price as number)}
          image={page.galleryImages[0]}
          tile={tile}
          product={product}
          cartLine={page.cartLine}
        />
      ) : null}
    </CatalogRoot>
  );
}
