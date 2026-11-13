import { intlLocale, type ShopLocale } from "@/lib/i18n/locales";
import type { ProductSummary } from "@/features/catalog/types/product";
import { formatAED, SAPIL_PASTELS, type SapilPastel } from "../../ui/shared";
import type { SapilTranslator } from "../../i18n/SapilCopy";

/** Tile when the API has no colour for a product (v9's neutral "beige" tile). */
export const DEFAULT_TILE: SapilPastel = "sand";

/**
 * "AED 63" / "AED 19.75" in English (v9's format); `Intl` currency format in
 * every other language (Arabic digits and order).
 */
export function formatSapilPrice(amount: number, currency: string, locale: ShopLocale): string {
  if (locale === "en") return formatAED(amount, currency);
  try {
    const whole = Math.round(amount * 100) % 100 === 0;
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return formatAED(amount, currency);
  }
}

/** The product's pastel: the API's `tileColor` when it is one of the nine, else the neutral tile. */
export function productTile(product: Pick<ProductSummary, "tileColor">): SapilPastel {
  const key = product.tileColor?.trim().toLowerCase();
  return key && (SAPIL_PASTELS as readonly string[]).includes(key) ? (key as SapilPastel) : DEFAULT_TILE;
}

/** Whole-number markdown for the "−30%" badge; 0 without a real was-price. */
export function discountPercent(product: Pick<ProductSummary, "price" | "compareAtPrice">): number {
  const { price, compareAtPrice: was } = product;
  if (price == null || was == null || was <= price || was <= 0) return 0;
  return Math.round((1 - price / was) * 100);
}

export type ProductGender = "her" | "him" | "unisex";

const GENDER_TAGS: Record<string, ProductGender> = {
  her: "her",
  "for her": "her",
  women: "her",
  woman: "her",
  female: "her",
  him: "him",
  "for him": "him",
  men: "him",
  man: "him",
  male: "him",
  unisex: "unisex",
};

/**
 * Who the scent is for, from the product's catalog tags ("Women", "For Him",
 * "Unisex" …). Null when untagged. A gender facet on the listing API will
 * replace this (see docs/sapil/pages/catalog.md).
 */
export function productGender(product: Pick<ProductSummary, "tags">): ProductGender | null {
  for (const tag of product.tags ?? []) {
    const key = tag.trim().toLowerCase().replace(/^gender[:_ ]/, "");
    if (GENDER_TAGS[key]) return GENDER_TAGS[key];
  }
  return null;
}

/** Gift sets show the whole box (no zoom), like v9's `.card.gift`. */
export function productShape(product: Pick<ProductSummary, "tags" | "title">): "bottle" | "gift" {
  const text = [...(product.tags ?? []), product.title].join(" ").toLowerCase();
  return /gift ?set|giftset/.test(text) ? "gift" : "bottle";
}

/** Sold but not buyable right now (price known). */
export function isOutOfStock(product: Pick<ProductSummary, "price" | "isSellable" | "inStock">): boolean {
  return product.price != null && (product.isSellable === false || product.inStock === false);
}

/** The two pill tags: kind (EDP / Extrait) and who it is for, when known. */
export function productTags(
  product: Pick<ProductSummary, "concentration" | "tags">,
  t: SapilTranslator,
): string[] {
  const tags: string[] = [];
  if (product.concentration === "edp") tags.push(t("product.kindEdp"));
  else if (product.concentration === "extrait") tags.push(t("product.kindExtrait"));
  const gender = productGender(product);
  if (gender) {
    tags.push(gender === "her" ? t("product.tagHer") : gender === "him" ? t("product.tagHim") : t("product.tagUnisex"));
  }
  return tags;
}

export type SapilCardModel = {
  name: string;
  href: string;
  image: string | null;
  tile: SapilPastel;
  price: string;
  was?: string;
  discountPercent: number;
  tags: string[];
  shape: "bottle" | "gift";
  outOfStock: boolean;
  /** No price: the product can't be bought or added. */
  unavailable: boolean;
};

/** Shared product summary → the design-system `ProductCard`'s values. */
export function toSapilCardModel(product: ProductSummary, t: SapilTranslator, locale: ShopLocale): SapilCardModel {
  const currency = product.currency || "AED";
  const off = discountPercent(product);
  return {
    name: product.title,
    href: `/products/${product.slug}`,
    image: product.imageUrl ?? product.imageUrls?.[0] ?? null,
    tile: productTile(product),
    price: product.price == null ? t("product.unavailable") : formatSapilPrice(product.price, currency, locale),
    was: off && product.compareAtPrice != null ? formatSapilPrice(product.compareAtPrice, currency, locale) : undefined,
    discountPercent: off,
    tags: productTags(product, t),
    shape: productShape(product),
    outOfStock: isOutOfStock(product),
    unavailable: product.price == null,
  };
}
