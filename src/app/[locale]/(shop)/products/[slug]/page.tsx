import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetailPageView } from "@/features/catalog";
import {
  productMetaDescription,
  realProductDescription,
} from "@/features/catalog/api/catalog.service";
import {
  breadcrumbJsonLd,
  CatalogJsonLd,
  productJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { getTranslator } from "@/lib/i18n/messages";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import {
  canonicalCatalogPath,
  catalogMetadata,
  loadCatalogDocument,
} from "@/lib/seo/catalogPage";
import { loadBrandIdentityFor } from "@/lib/seo/brandIdentity";
import { applySeoOverrides } from "@/lib/seo/pageSeo";
import { effectiveProductSeo, parseSchemaOverride } from "@/lib/seo/productSeo";
import { absoluteUrl, requestOrigin } from "@/lib/seo/requestOrigin";
import { storefrontLogo } from "@/lib/storefront/brand";

/** Prerendered per language on first visit and revalidated (ISR). */
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, product, missing, market } = await loadCatalogDocument(
    "product",
    slug,
  );
  if (missing) notFound();
  const handle = product?.slug || slug;
  const path = canonicalCatalogPath(`/products/${handle}`, locale);
  // Admin product SEO for this market wins; listing SEO fields, then the product, are the fallback.
  const seo = effectiveProductSeo(product?.seo, market.zoneId);
  const title = seo?.title || product?.seoTitle || product?.title || slug;
  // The page's "no description yet" text is never a meta description.
  const description =
    seo?.description ||
    product?.seoDescription ||
    productMetaDescription(product?.description);
  return applySeoOverrides(
    await catalogMetadata({
      locale,
      path,
      title,
      description,
      image: product?.imageUrl,
      ogType: "product",
    }),
    seo,
  );
}

/**
 * The product's brand as written by the house ("Swiss Arabian", not the catalog's
 * "SWISS ARABIAN" and not the market's site name). Other brands keep their name.
 */
function schemaBrandName(catalogBrand: string | null | undefined): string {
  const house = storefrontLogo().name;
  const name = catalogBrand?.trim();
  // "SWISS ARABIAN" (D365) and "Swiss Arabian UAE" (Shopify vendor) are the house itself.
  return !name || name.toLowerCase().startsWith(house.toLowerCase()) ? house : name;
}

/**
 * Open Graph product tags (Facebook, WhatsApp, Pinterest): type, price, stock,
 * brand and SKU. Next's metadata has no product type, so React puts these
 * <meta> tags in the page head.
 */
function ProductOpenGraphTags({
  price,
  currency,
  inStock,
  brand,
  sku,
}: {
  price: number | null | undefined;
  currency: string | null | undefined;
  inStock: boolean;
  brand: string | null | undefined;
  sku: string | null | undefined;
}) {
  const hasPrice = price != null && Number.isFinite(price) && Boolean(currency);
  const amount = hasPrice ? price!.toFixed(2) : null;
  return (
    <>
      <meta property="og:type" content="product" />
      {amount ? (
        <>
          <meta property="og:price:amount" content={amount} />
          <meta property="og:price:currency" content={currency!} />
          <meta property="product:price:amount" content={amount} />
          <meta property="product:price:currency" content={currency!} />
        </>
      ) : null}
      <meta property="product:availability" content={inStock ? "in stock" : "out of stock"} />
      <meta property="product:condition" content="new" />
      {brand?.trim() ? <meta property="product:brand" content={brand.trim()} /> : null}
      {sku ? <meta property="product:retailer_item_id" content={sku} /> : null}
    </>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, product, missing, market, zoneCode } = await loadCatalogDocument(
    "product",
    slug,
  );
  if (missing) notFound();
  const t = await getTranslator(locale);
  if (product?.slug && product.slug !== slug) {
    permanentRedirect(withLocalePrefix(`/products/${product.slug}`, locale));
  }
  const handle = product?.slug || slug;
  const path = canonicalCatalogPath(`/products/${handle}`, locale);
  const name = product?.title || slug;
  const seo = effectiveProductSeo(product?.seo, market.zoneId);
  const schemaOverride = parseSchemaOverride(seo?.schemaOverride);
  const brand = await loadBrandIdentityFor(locale, market.zoneCode ?? "");
  // Share buttons point at the same canonical address as the page head.
  const origin = await requestOrigin();
  const share = {
    url: absoluteUrl(origin, seo?.canonicalUrl || path),
    image: product?.imageUrl ? absoluteUrl(origin, product.imageUrl) : null,
  };
  const inStock = product
    ? product.inStock !== false && product.isSellable !== false
    : false;
  const productBrand = schemaBrandName(product?.brandName);
  const notes = product?.pdpMetafields;
  const delivery = product?.shippingPromise;
  return (
    <>
      <ProductOpenGraphTags
        price={product?.price}
        currency={product?.currency}
        inStock={inStock}
        brand={productBrand}
        sku={product?.sku}
      />
      {seo?.schemaEnabled === false ? null : schemaOverride ? (
        <CatalogJsonLd data={schemaOverride} />
      ) : (
        <CatalogJsonLd
          data={productJsonLd({
            name,
            // The full product text (the meta description is the short version).
            description:
              realProductDescription(product?.description) ||
              product?.seoDescription,
            sku: product?.sku,
            url: path,
            inLanguage: locale,
            image: product?.imageUrl,
            images: product?.imageUrls,
            brand: productBrand,
            price: product?.price,
            currency: product?.currency,
            inStock: product ? inStock : null,
            seller: brand.name,
            shipping: delivery
              ? {
                  country: "countryCode" in market ? market.countryCode : null,
                  fee: delivery.baseDeliveryFee,
                  freeFrom: delivery.freeDeliveryThreshold,
                  minDays: delivery.estimatedMinDays,
                  maxDays: delivery.estimatedMaxDays,
                }
              : null,
            properties: [
              { name: t("product.topNotes"), value: notes?.top_note },
              { name: t("product.heartNotes"), value: notes?.middle_note },
              { name: t("product.baseNotes"), value: notes?.base_note },
              { name: t("product.fragranceFamily"), value: notes?.fragrance_family_text },
              { name: t("product.size"), value: notes?.size },
            ],
            rating: product?.reviews?.summary
              ? {
                  average: product.reviews.summary.averageRating,
                  count: product.reviews.summary.reviewCount,
                }
              : null,
            reviews: (product?.reviews?.items ?? []).map((r) => ({
              rating: r.rating,
              author: r.displayName,
              title: r.title,
              body: r.body,
              date: r.createdAt,
            })),
          })}
        />
      )}
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          {
            name: t("home"),
            url: withLocalePrefix("/", locale),
          },
          { name, url: path },
        ])}
      />
      <ProductDetailPageView
        product={product}
        serverZoneCode={zoneCode}
        slug={slug}
        share={share}
      />
    </>
  );
}
