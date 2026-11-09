import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetailPageView } from "@/features/catalog";
import {
  breadcrumbJsonLd,
  CatalogJsonLd,
  productJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { shopCopy } from "@/lib/i18n/shopCopy";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { canonicalCatalogPath, catalogMetadata, loadCatalogDocument } from "@/lib/seo/catalogPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, product, missing } = await loadCatalogDocument("product", slug);
  if (missing) notFound();
  const handle = product?.slug || slug;
  const path = canonicalCatalogPath(`/products/${handle}`, locale);
  const title = product?.seoTitle || product?.title || slug;
  const description = product?.seoDescription || product?.description;
  return catalogMetadata({ locale, path, title, description, image: product?.imageUrl });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, product, missing } = await loadCatalogDocument("product", slug);
  if (missing) notFound();
  if (product?.slug && product.slug !== slug) {
    permanentRedirect(withLocalePrefix(`/products/${product.slug}`, locale));
  }
  const handle = product?.slug || slug;
  const path = canonicalCatalogPath(`/products/${handle}`, locale);
  const name = product?.title || slug;
  return (
    <>
      <CatalogJsonLd
        data={productJsonLd({
          name,
          description: product?.seoDescription || product?.description,
          sku: product?.sku,
          url: path,
          image: product?.imageUrl,
          images: product?.imageUrls,
          brand: product?.brandName,
          price: product?.price,
          currency: product?.currency,
          inStock: product ? product.inStock !== false && product.isSellable !== false : null,
          rating: product?.reviews?.summary
            ? {
                average: product.reviews.summary.averageRating,
                count: product.reviews.summary.reviewCount,
              }
            : null,
        })}
      />
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          { name: shopCopy(locale, "home"), url: withLocalePrefix("/", locale) },
          { name, url: path },
        ])}
      />
      <ProductDetailPageView product={product} slug={slug} />
    </>
  );
}
