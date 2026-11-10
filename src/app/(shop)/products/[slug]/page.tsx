import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetailPageView } from "@/features/catalog";
import {
  breadcrumbJsonLd,
  CatalogJsonLd,
  productJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { shopCopy } from "@/lib/i18n/shopCopy";
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
  const description =
    seo?.description || product?.seoDescription || product?.description;
  return applySeoOverrides(
    await catalogMetadata({
      locale,
      path,
      title,
      description,
      image: product?.imageUrl,
    }),
    seo,
  );
}

export default async function ProductDetailPage({
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
  return (
    <>
      {seo?.schemaEnabled === false ? null : schemaOverride ? (
        <CatalogJsonLd data={schemaOverride} />
      ) : (
        <CatalogJsonLd
          data={productJsonLd({
            name,
            description: product?.seoDescription || product?.description,
            sku: product?.sku,
            url: path,
            image: product?.imageUrl,
            images: product?.imageUrls,
            brand: product?.brandName || brand.name,
            price: product?.price,
            currency: product?.currency,
            inStock: product
              ? product.inStock !== false && product.isSellable !== false
              : null,
            rating: product?.reviews?.summary
              ? {
                  average: product.reviews.summary.averageRating,
                  count: product.reviews.summary.reviewCount,
                }
              : null,
          })}
        />
      )}
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          {
            name: shopCopy(locale, "home"),
            url: withLocalePrefix("/", locale),
          },
          { name, url: path },
        ])}
      />
      <ProductDetailPageView product={product} slug={slug} share={share} />
    </>
  );
}
