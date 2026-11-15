"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useAddToCart } from "@/features/cart";
import {
  catalogKeys,
  fetchCategoryBySlug,
  fetchCollectionBySlug,
  type CatalogCategory,
  type CatalogCollection,
  type ProductListResult,
} from "@/features/catalog/api/catalog.service";
import { useMarketDocument } from "@/features/catalog/hooks/useMarketDocument";
import { useUrlListingQuery } from "@/features/catalog/hooks/useUrlListingQuery";
import type { CatalogListingQuery } from "@/features/catalog/types/catalogFacets";
import type { ProductSummary } from "@/features/catalog/types/product";
import { stripHtml } from "@/features/catalog/utils/catalogHtml";
import { metafieldMediaUrl } from "@/features/catalog/utils/collectionMetafields";
import { useMarketMerchSettings } from "@/features/markets/hooks/useMarketMerchSettings";
import { useCollectionSummaries } from "@/features/merchandising/hooks/useCollectionSummaries";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { rememberBrowsedCollection } from "@/features/merchandising/utils/browsedCollection";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { Breadcrumbs, Button, Wrap, type Crumb } from "../../ui";
import type { SapilPastel } from "../../ui/shared";
import { CatalogRoot } from "../../components/catalog/CatalogRoot";
import { CollectionHero, CollectionNotes } from "../../components/catalog/CollectionHero";
import { InfiniteMore } from "../../components/catalog/InfiniteMore";
import { KeepExploring, type CollectionCardItem, type PromoTileItem } from "../../components/catalog/KeepExploring";
import { ListingToolbar } from "../../components/catalog/ListingToolbar";
import { pastelFor } from "../../components/catalog/listingModel";
import { PriceEditHero, TierTabs } from "../../components/catalog/PriceEditHero";
import { GridMessage, ProductGrid } from "../../components/catalog/ProductGrid";
import { ShopHero } from "../../components/catalog/ShopHero";
import { useSapilListing } from "../../components/catalog/useSapilListing";
import { formatSapilPrice, productTile } from "../../components/product/productCardModel";
import { SapilLocaleLink } from "../../components/product/SapilLocaleLink";

type ListingProps = {
  listingQuery: CatalogListingQuery;
  initialListing?: ProductListResult | null;
  initialZoneCode?: string | null;
};

/** Pastels of the "Signature notes" pills (v9 order). */
const NOTE_COLORS: SapilPastel[] = ["peach", "mint", "sky", "lilac", "butter", "pink", "sage", "lime"];

function imagesOf(products: ProductSummary[] | undefined, n = 3): string[] {
  return (products ?? [])
    .map((p) => p.imageUrl ?? p.imageUrls?.[0])
    .filter((src): src is string => Boolean(src))
    .slice(0, n);
}

function firstSentence(html: string | null | undefined, max = 60): string {
  const text = stripHtml(html).trim();
  if (!text) return "";
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

/** Grid empty state: filters that match nothing, or a listing with no products at all. */
function EmptyState({ hasFilters, t, collection }: { hasFilters: boolean; t: SapilTranslator; collection?: boolean }) {
  if (hasFilters) {
    return (
      <GridMessage title={t("catalog.emptyTitle")}>
        {collection ? (
          t("catalog.emptyCollection")
        ) : (
          <>
            {t("catalog.emptyBody")}{" "}
            <Button variant="link" href="/products" LinkComponent={SapilLocaleLink}>
              {t("catalog.emptyBrowse")}
            </Button>
            .
          </>
        )}
      </GridMessage>
    );
  }
  return (
    <GridMessage
      title={t("catalog.emptyNoProducts")}
      action={
        collection ? (
          <Button href="/products" LinkComponent={SapilLocaleLink}>
            {t("catalog.browseAll")}
          </Button>
        ) : null
      }
    >
      {t("catalog.emptyNoProductsBody")}
    </GridMessage>
  );
}

/** Toolbar, grid (all states) and infinite scroll of one listing. */
function ListingBody({
  listing,
  collection,
}: {
  listing: ReturnType<typeof useSapilListing>;
  collection?: boolean;
}) {
  const t = useSapilCopy();
  return (
    <>
      <ListingToolbar {...listing.toolbar} />
      <section aria-label={t("catalog.productsLabel")} id="products" className="pb-[104px] scroll-mt-[150px]">
        <ProductGrid
          products={listing.products}
          loading={listing.loading}
          loadFailed={listing.loadFailed}
          onRetry={listing.retry}
          empty={<EmptyState hasFilters={listing.hasFilters} t={t} collection={collection} />}
        />
        <InfiniteMore
          hasNext={listing.hasNextPage}
          loading={listing.isFetchingNextPage}
          nextHref={listing.nextHref}
          onLoadMore={listing.fetchNextPage}
        />
      </section>
    </>
  );
}

/** "Keep exploring": the market's collections, then promo tiles into other listings. */
function useKeepExploring({
  products,
  excludeSlug,
  promos,
}: {
  products: ProductSummary[] | undefined;
  excludeSlug?: string;
  promos: boolean;
}): { collections: CollectionCardItem[]; promos: PromoTileItem[] } {
  const t = useSapilCopy();
  const locale = useShopLocale();
  const { collections } = useCollectionSummaries();
  const { priceEditTiers } = useMarketMerchSettings();
  return useMemo(() => {
    const cards: CollectionCardItem[] = (collections ?? [])
      .filter((c) => c.slug !== excludeSlug && c.productCount > 0)
      .slice(0, 12)
      .map((c) => {
        const from = c.summary?.minPrice != null ? Number(c.summary.minPrice) : NaN;
        return {
          key: c.slug,
          href: `/collections/${c.slug}`,
          name: c.name,
          line: firstSentence(c.description) || undefined,
          countLabel: t("catalog.collectionCount", { count: c.productCount }),
          fromLabel: Number.isFinite(from)
            ? t("catalog.fromPrice", { price: formatSapilPrice(from, c.summary?.currencyCode || "AED", locale) })
            : undefined,
          color: pastelFor(c.slug),
          images: (c.summary?.images ?? []).map((img) => img.url),
        };
      });
    const imgs = imagesOf(products, 6);
    const tier = priceEditTiers[1] ?? priceEditTiers[0];
    const tiles: PromoTileItem[] = promos
      ? [
          ...(tier
            ? [{ key: "under", href: `/products?under=${tier}`, title: t("catalog.promoUnder", { price: formatSapilPrice(tier, products?.[0]?.currency || "AED", locale) }), sub: t("catalog.promoUnderSub"), color: "butter", image: imgs[0] }]
            : []),
          { key: "new", href: "/products?sort=newest", title: t("catalog.promoNew"), sub: t("catalog.promoNewSub"), color: "lilac", image: imgs[1] },
          { key: "all", href: "/products", title: t("catalog.promoAll"), sub: t("catalog.promoAllSub"), color: "mint", image: imgs[2] },
        ]
      : [];
    return { collections: cards, promos: tiles };
  }, [collections, excludeSlug, locale, priceEditTiers, products, promos, t]);
}

/* ------------------------------------------------------------------ shop */

/**
 * `/products` (v9 shop) and, with `?under=<tier>`, the price edit (v9 under-99):
 * hero, toolbar, grid, infinite scroll, "Keep exploring".
 */
export function SapilShopView({
  listingQuery,
  initialListing,
  initialZoneCode,
  priceEdit,
}: ListingProps & {
  /** `?under=99`: a price edit capped at this tier. */
  priceEdit?: number;
}) {
  const t = useSapilCopy();
  const { priceEditTiers } = useMarketMerchSettings();
  const ceiling = priceEdit != null && priceEditTiers.includes(priceEdit) ? priceEdit : undefined;
  const listing = useSapilListing({
    source: { kind: "products" },
    listingQuery,
    initialListing,
    initialZoneCode,
    ceiling,
    include: ceiling != null ? ["price", "collection", "family", "notes"] : undefined,
  });
  const explore = useKeepExploring({ products: listing.products, promos: true });

  if (ceiling != null) return <PriceEditView listing={listing} ceiling={ceiling} tiers={priceEditTiers} />;

  // The hero follows the filters: one collection → that collection; otherwise every bottle.
  const collectionFacet = listing.toolbar.facets.find((f) => f.key === "houseCollection");
  const oneCollection =
    collectionFacet?.selected.length === 1
      ? (collectionFacet.options.find((o) => o.value === collectionFacet.selected[0])?.label ?? collectionFacet.selected[0])
      : null;
  const crumbs: Crumb[] = [
    { label: t("catalog.home"), href: "/" },
    ...(oneCollection ? [{ label: t("catalog.shop"), href: "/products" }, { label: oneCollection }] : [{ label: t("catalog.shop") }]),
  ];
  const meta = listing.products
    ? listing.fromPrice != null && listing.total
      ? t("catalog.metaLine", {
          bottles: t("catalog.bottles", { count: listing.total }),
          from: t("catalog.fromPrice", { price: listing.money(listing.fromPrice) }),
        })
      : t("catalog.bottles", { count: listing.total })
    : undefined;

  return (
    <CatalogRoot>
      <Wrap>
        <Breadcrumbs label={t("content.breadcrumb")} items={crumbs} LinkComponent={SapilLocaleLink} />
        <ShopHero
          kind={oneCollection ? t("catalog.filterCollection") : t("catalog.shopKind")}
          title={oneCollection ?? t("catalog.shopTitle")}
          sub={oneCollection ? undefined : t("catalog.shopSub")}
          meta={meta}
          color={oneCollection ? pastelFor(collectionFacet?.selected[0] ?? "") : "butter"}
          images={imagesOf(listing.products)}
        />
        <ListingBody listing={listing} />
      </Wrap>
      <KeepExploring
        label={t("catalog.keepExploring")}
        eyebrow={t("catalog.keepExploring")}
        title={t("catalog.theCollections")}
        accent={t("catalog.theCollectionsAccent")}
        collections={explore.collections}
        promos={explore.promos}
        previousLabel={t("catalog.previousCollections")}
        nextLabel={t("catalog.nextCollections")}
        LinkComponent={SapilLocaleLink}
      />
    </CatalogRoot>
  );
}

/** v9 under-99: tier tabs, the price-edit banner with its shelf, toolbar and grid. */
function PriceEditView({
  listing,
  ceiling,
  tiers,
}: {
  listing: ReturnType<typeof useSapilListing>;
  ceiling: number;
  tiers: number[];
}) {
  const t = useSapilCopy();
  const { delivery } = useMarketMerchSettings();
  const currency = listing.products?.find((p) => p.currency)?.currency ?? "AED";
  const ceilingLabel = listing.money(ceiling);
  const freeOver = delivery?.freeDeliveryThreshold ? Number(delivery.freeDeliveryThreshold) : NaN;
  const priceFacet = listing.toolbar.facets.find((f) => f.key === "price");
  const shelf = (listing.products ?? [])
    .filter((p) => p.price != null && (p.imageUrl || p.imageUrls?.[0]))
    .slice(0, 5)
    .map((p) => ({
      name: p.title,
      href: `/products/${p.slug}`,
      image: (p.imageUrl ?? p.imageUrls?.[0]) as string,
      price: Math.round(p.price as number),
      label: t("catalog.tierShelfItem", { name: p.title, price: listing.money(p.price as number) }),
    }));
  // Tallest bottle in the middle of the shelf (v9 order).
  const ordered = shelf.length === 5 ? [shelf[1], shelf[3], shelf[0], shelf[4], shelf[2]] : shelf;

  return (
    <CatalogRoot>
      <Wrap>
        <Breadcrumbs label={t("content.breadcrumb")}
          items={[{ label: t("catalog.home"), href: "/" }, { label: t("catalog.tierTab", { price: ceilingLabel }) }]}
          LinkComponent={SapilLocaleLink}
        />
        <TierTabs
          label={t("catalog.tiersLabel")}
          LinkComponent={SapilLocaleLink}
          tiers={tiers
            .map((max) => ({
              max,
              label: t("catalog.tierTab", { price: listing.money(max) }),
              href: `/products?under=${max}`,
              current: max === ceiling,
              // Counts per tier from the listing's facets (older APIs: only the open tier's total).
              count:
                listing.facets?.priceTiers?.find((tier) => tier.maxPrice === max)?.count ??
                (max === ceiling && listing.products ? listing.total : undefined),
            }))
            // v9: a tier with no products is left out until it has some.
            .filter((tier) => tier.current || tier.count !== 0)}
        />
        <PriceEditHero
          kicker={t("catalog.tierKicker", { price: ceilingLabel })}
          titleLead={t("catalog.tierTitle")}
          titleAccent={`${ceilingLabel}.`}
          ghost={ceiling}
          lead={
            listing.products && listing.fromPrice != null
              ? t("catalog.tierCount", { count: listing.total, price: listing.money(listing.fromPrice) })
              : undefined
          }
          chips={(priceFacet?.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
          chipsLabel={t("catalog.tiersLabel")}
          onChip={(value) => {
            listing.toolbar.onToggle("price", value);
            document.querySelector("[data-sapil-toolbar]")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          }}
          ctaLabel={t("catalog.tierShopAll", { count: listing.total })}
          ctaHref="#products"
          note={
            Number.isFinite(freeOver) && freeOver > 0
              ? t("catalog.tierDeliveryNote", { price: listing.money(freeOver) })
              : undefined
          }
          sticker={
            Number.isFinite(freeOver) && freeOver > 0
              ? { top: t("catalog.tierStickerTop", { price: String(Math.round(freeOver)) }), bottom: t("catalog.tierStickerBottom") }
              : null
          }
          shelf={ordered}
          currencyLabel={currency}
          LinkComponent={SapilLocaleLink}
        />
        <ListingBody listing={listing} />
      </Wrap>
    </CatalogRoot>
  );
}

/** Shop / price edit reading filters (and `?under=`) from the address. */
export function SapilShopViewFromUrl({
  serverPage,
  initialListing,
  ...props
}: Omit<ListingProps, "listingQuery"> & { serverPage: number }) {
  const { listingQuery, useServerListing } = useUrlListingQuery(serverPage);
  const under = Number(useSearchParams()?.get("under") ?? "");
  const priceEdit = Number.isFinite(under) && under > 0 ? under : undefined;
  return (
    <SapilShopView
      {...props}
      listingQuery={listingQuery}
      priceEdit={priceEdit}
      // The server rendered the plain listing: never reuse it for a price edit.
      initialListing={useServerListing && priceEdit == null ? initialListing : null}
    />
  );
}

/* ------------------------------------------------------------ collection */

type HeroSource = {
  name: string;
  tagline?: string | null;
  description?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  slug: string;
};

function CollectionLikeView({
  kind,
  source,
  hero,
  listingQuery,
  initialListing,
  initialZoneCode,
  slug,
  crumbs,
}: ListingProps & {
  kind: "collection" | "category";
  source: { kind: "collection"; slug: string } | { kind: "category"; slug: string };
  hero: HeroSource;
  slug: string;
  crumbs: Crumb[];
}) {
  const t = useSapilCopy();
  const { addToCart } = useAddToCart();
  const listing = useSapilListing({ source, listingQuery, initialListing, initialZoneCode });
  const explore = useKeepExploring({ products: listing.products, excludeSlug: kind === "collection" ? slug : undefined, promos: false });
  const color = pastelFor(slug);
  const products = listing.products;
  const first = products?.find((p) => p.price != null && p.isSellable !== false && p.inStock !== false);
  const firstImage = first?.imageUrl ?? first?.imageUrls?.[0];
  const notes = [...(listing.facets?.featuredNote ?? [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((n, i) => ({ label: n.label, href: `/products?featuredNote=${encodeURIComponent(n.code)}`, color: NOTE_COLORS[i % NOTE_COLORS.length] }));
  const story = stripHtml(hero.description).trim();
  const meta: ReactNode[] = products
    ? [
        <>
          <b>{listing.total}</b> {t("catalog.fragrancesWord", { count: listing.total })}
        </>,
        ...(listing.fromPrice != null
          ? [
              <>
                {t("catalog.fromWord")} <b>{listing.money(listing.fromPrice)}</b>
              </>,
            ]
          : []),
      ]
    : [];

  return (
    <CatalogRoot>
      <Wrap>
        <Breadcrumbs label={t("content.breadcrumb")} items={crumbs} LinkComponent={SapilLocaleLink} />
        <CollectionHero
          eyebrow={t("catalog.collectionEyebrow", { name: hero.name })}
          title={hero.name}
          tagline={hero.tagline}
          story={story || undefined}
          meta={meta}
          color={color}
          photo={hero.image}
          photoAlt={hero.imageAlt || t("catalog.collectionCampaignAlt", { name: hero.name })}
          heroBottle={firstImage && first ? { image: firstImage, tile: productTile(first) } : null}
          trio={imagesOf(products)}
          ctas={
            products?.length ? (
              <>
                <Button href="#products">{t("catalog.shopAll", { count: listing.total })}</Button>
                {first && (products.length > 1) ? (
                  <Button
                    variant="line"
                    onClick={() =>
                      void addToCart({
                        sku: first.sku,
                        variantId: first.variantId,
                        slug: first.slug,
                        title: first.title,
                        imageUrl: first.imageUrl,
                        price: first.price,
                        currency: first.currency,
                        quantity: 1,
                      })
                    }
                  >
                    {t("catalog.addHero", { name: first.title, price: listing.money(first.price as number) })}
                  </Button>
                ) : null}
              </>
            ) : null
          }
        />
        <CollectionNotes label={t("catalog.signatureNotes")} notes={notes} LinkComponent={SapilLocaleLink} />
        <ListingBody listing={listing} collection />
      </Wrap>
      <KeepExploring
        label={t("catalog.keepExploring")}
        eyebrow={t("catalog.keepExploring")}
        title={t("catalog.otherCollections")}
        accent={t("catalog.otherCollectionsAccent")}
        collections={explore.collections}
        previousLabel={t("catalog.previousCollections")}
        nextLabel={t("catalog.nextCollections")}
        LinkComponent={SapilLocaleLink}
      />
    </CatalogRoot>
  );
}

/** `/collections/[handle]` (v9 collection). Props match the shared collection view. */
export function SapilCollectionView({
  slug,
  collection: serverCollection,
  ...props
}: ListingProps & { slug: string; collection: CatalogCollection | null }) {
  const t = useSapilCopy();
  // Prerendered for the default market: another market shows its own collection text.
  const { data: collection } = useMarketDocument({
    server: serverCollection,
    serverZoneCode: props.initialZoneCode,
    queryKey: (zone) => catalogKeys.collection(slug, zone),
    fetch: (market) => fetchCollectionBySlug(slug, market.zoneCode, market),
    fetchWhenMissing: false,
  });
  useEffect(() => {
    if (collection?.slug && collection.name) {
      rememberBrowsedCollection({ slug: collection.slug, name: collection.name });
    }
  }, [collection?.slug, collection?.name]);
  const name = collection?.name || slug;
  const heading = collection?.heading?.trim();
  const photo =
    (collection?.image?.trim() ? collection.image : null) ??
    metafieldMediaUrl(collection?.customMetafields?.collection_banner);
  return (
    <CollectionLikeView
      {...props}
      kind="collection"
      slug={slug}
      source={{ kind: "collection", slug }}
      hero={{ name, tagline: heading && heading !== name ? heading : null, description: collection?.description, image: photo, imageAlt: collection?.imageAlt, slug }}
      crumbs={[
        { label: t("catalog.home"), href: "/" },
        { label: t("catalog.collections"), href: "/collections" },
        { label: name },
      ]}
    />
  );
}

export function SapilCollectionViewFromUrl({
  serverPage,
  initialListing,
  ...props
}: Omit<ListingProps, "listingQuery"> & { serverPage: number; slug: string; collection: CatalogCollection | null }) {
  const { listingQuery, useServerListing } = useUrlListingQuery(serverPage);
  return <SapilCollectionView {...props} listingQuery={listingQuery} initialListing={useServerListing ? initialListing : null} />;
}

/* -------------------------------------------------------------- category */

/** `/categories/[handle]`: the collection layout with the category's name, text and image. */
export function SapilCategoryView({
  slug,
  category: serverCategory,
  ...props
}: ListingProps & { slug: string; category: CatalogCategory | null }) {
  const t = useSapilCopy();
  const { data: category } = useMarketDocument({
    server: serverCategory,
    serverZoneCode: props.initialZoneCode,
    queryKey: (zone) => catalogKeys.category(slug, zone),
    fetch: (market) => fetchCategoryBySlug(slug, market.zoneCode, market),
    fetchWhenMissing: false,
  });
  const name = category?.name || slug;
  return (
    <CollectionLikeView
      {...props}
      kind="category"
      slug={slug}
      source={{ kind: "category", slug }}
      hero={{ name, description: category?.description, image: category?.image ?? null, imageAlt: category?.imageAlt, slug }}
      crumbs={[{ label: t("catalog.home"), href: "/" }, { label: name }]}
    />
  );
}

export function SapilCategoryViewFromUrl({
  serverPage,
  initialListing,
  ...props
}: Omit<ListingProps, "listingQuery"> & { serverPage: number; slug: string; category: CatalogCategory | null }) {
  const { listingQuery, useServerListing } = useUrlListingQuery(serverPage);
  return <SapilCategoryView {...props} listingQuery={listingQuery} initialListing={useServerListing ? initialListing : null} />;
}
