import { permanentRedirect } from "next/navigation";
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
  const { locale, product } = await loadCatalogDocument("product", slug);
  const handle = product?.slug || slug;
  const path = canonicalCatalogPath(`/products/${handle}`, locale);
  const title = product?.seoTitle || product?.title || slug;
  const description = product?.seoDescription || product?.description;
  return catalogMetadata({ locale, path, title, description });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, product } = await loadCatalogDocument("product", slug);
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
        })}
      />
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          { name: shopCopy(locale, "home"), url: withLocalePrefix("/", locale) },
          { name, url: path },
        ])}
      />
      <ProductDetailPageView product={product} />
    </>
  );
}
