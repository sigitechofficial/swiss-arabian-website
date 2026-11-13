"use client";

import type { ReactNode } from "react";
import type { ProductDetail, ProductSummary } from "@/features/catalog/types/product";
import { Wrap } from "../ui";
import { ListingToolbar } from "../components/catalog/ListingToolbar";
import { ProductGrid } from "../components/catalog/ProductGrid";
import { ShopHero } from "../components/catalog/ShopHero";
import { SapilProductPage } from "../pages/catalog/SapilProductPage";

/*
 * Catalog fixture page (/sapil-kit/catalog, dev only): the real Sapil catalog
 * components filled with the v9 reference's mock products (as rendered by
 * sapil-v9-shop.html / sapil-v9-product.html?id=berry-crush), so
 * scripts/sapil-visual-diff.mjs can compare them with the design. Also useful
 * to look at the pages while the local Sapil market has no products.
 */

const CDN = "https://uae.sapil.com/cdn/shop/files/";
const card = (
  id: string,
  title: string,
  file: string,
  price: number,
  tile: string,
  gender: string,
  extra: Partial<ProductSummary> = {},
): ProductSummary => ({
  id,
  slug: id,
  title,
  price,
  currency: "AED",
  imageUrl: file.startsWith("http") ? file : `${CDN}${file}?width=700`,
  concentration: "edp",
  tags: [gender],
  tileColor: tile,
  isSellable: true,
  inStock: true,
  variantId: `${id}-v`,
  ...extra,
});

const BERRY_IMG = "https://sapil.com/cdn/shop/files/Straight-angle_cdd31f2a-19e7-4d6a-9be2-a0f992d7eb74.webp?v=1784100747&width=700";

export const KIT_PRODUCTS: ProductSummary[] = [
  card("very-vanilla", "Very Vanilla", "Straight-angle_af8d5d0b-6821-4de5-9597-9c16d75e8a95.png", 99, "sand", "Women"),
  card("bleu-vetiver", "Bleu Vetiver", "Straight-angle_e006441f-1f02-4b55-a4b7-bd04f994d818.png", 99, "sky", "Men"),
  card("the-amber-effect", "The Amber Effect", "Straight-angle_c2945052-8671-4a69-a59c-c63b1cbbe6e5.png", 99, "sand", "Unisex"),
  card("musk-to-dawn", "Musk to Dawn", "Straight-angle_1.png", 99, "pink", "Women"),
  // v9 tags this "Set of 4" (kind); the API has no such kind, so the card shows the gender only.
  card("scent-society-pack", "The Scent Society Set", "scent-society-bundle-4pcs.webp", 300.96, "sand", "Unisex", {
    compareAtPrice: 396,
    concentration: null,
    tags: ["Unisex", "Gift set"],
  }),
  // v9 shows "EDT"; the API knows EDP / Extrait only.
  card("solid-legacy", "Solid Legacy", "Straight-angle-2.png", 49, "sage", "Men", { concentration: null }),
  card("chichi-fantasy", "Chichi Fantasy", "Straight-angle_d7190cde-b46a-4a04-a5f3-c4570d530206.png", 46, "pink", "Women"),
  card("berry-crush", "Berry Crush", BERRY_IMG, 63, "sky", "Unisex", { compareAtPrice: 90 }),
];

const BERRY_GALLERY = [
  "https://sapil.com/cdn/shop/files/Straight-angle_cdd31f2a-19e7-4d6a-9be2-a0f992d7eb74.webp?v=1784100747&width=1000",
  "https://sapil.com/cdn/shop/files/Straight-angle_box_d150eb9f-ea76-40b1-bf58-d417c8266261.webp?v=1784100760&width=1000",
  "https://sapil.com/cdn/shop/files/SM-01.png?v=1784111181&width=1000",
  "https://sapil.com/cdn/shop/files/SM-02.png?v=1784111182&width=1000",
];

export const KIT_PRODUCT: ProductDetail = {
  ...KIT_PRODUCTS[7],
  imageUrl: BERRY_GALLERY[0],
  imageUrls: BERRY_GALLERY,
  variantId: "berry-crush-v",
  description:
    "A juicy burst of strawberry and pineapple over whipped sugar and soft musk. Bright, sweet and made for layering.",
  pdpMetafields: {
    top_note: "Strawberry, Pineapple, Pink pepper",
    middle_note: "Orange blossom, Violet, Jasmine",
    base_note: "Whipped sugar, Musk, Vanilla",
    size: "100ml EDP",
    fragrance_family_text: "Fruity",
  },
  collections: [{ name: "Fruity Capsules", slug: "fruity-capsules" }],
  reviews: null,
};

const TOOLBAR_FACETS = ["Collection", "Highlights", "Price", "For", "Fragrance family"].map((title) => ({
  key: title,
  title,
  options: [{ value: "x", label: "x" }],
  selected: [],
}));

function Kit({ id, only, children }: { id: string; only?: string; children: ReactNode }) {
  if (only && !only.startsWith(id)) return null;
  return <section data-kit={only ?? id}>{children}</section>;
}

const noop = () => {};

export function CatalogKit({ only }: { only?: string }) {
  return (
    <>
      <Wrap>
        <Kit id="shop-toolbar" only={only}>
          <ListingToolbar
            facets={TOOLBAR_FACETS}
            sorts={[{ value: "", label: "Featured" }]}
            sort=""
            countLabel="85 of 85"
            onToggle={noop}
            onClearFacet={noop}
            onClearAll={noop}
            onSort={noop}
          />
        </Kit>
      </Wrap>
      <Wrap>
        <Kit id="shop-hero" only={only}>
          <ShopHero
            kind="Shop"
            title="All fragrances"
            sub="Every Sapil perfume and gift set in one place. Use the filters to narrow it down."
            meta="85 bottles · from AED 15"
            color="butter"
            images={KIT_PRODUCTS.slice(0, 3).map((p) => (p.imageUrl as string).replace("width=700", "width=400"))}
          />
        </Kit>
        <Kit id="shop-grid" only={only}>
          <ProductGrid products={KIT_PRODUCTS} empty={null} />
        </Kit>
      </Wrap>
      <Kit id="pdp" only={only}>
        <SapilProductPage product={KIT_PRODUCT} serverZoneCode={null} slug="berry-crush" />
      </Kit>
    </>
  );
}
