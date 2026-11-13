"use client";

import { useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import type { ProductSummary } from "@/features/catalog/types/product";
import { useAddToCart } from "@/features/cart";
import { useWishlistToggle } from "@/features/wishlist/hooks/useWishlistToggle";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { ProductCard, cx, tintValue, SAPIL_PASTELS } from "../../ui";
import { HeartIcon } from "../shared/icons";
import { SapilLink } from "../shared/SapilLink";
import { useSapilPrice } from "../shared/useSapilPrice";

/** Neutral tile until the API sends the product's own `tileColor`. */
export const DEFAULT_TILE = "sand";

/** A pastel key from the API (`tileColor`), else the neutral default. */
export function tileFor(tileColor: string | null | undefined): string {
  return tileColor && (SAPIL_PASTELS as readonly string[]).includes(tileColor) ? tileColor : DEFAULT_TILE;
}

function WishlistHeart({ productId, name }: { productId: string; name: string }) {
  const t = useSapilCopy();
  const wishlist = useWishlistToggle(productId);
  if (!wishlist.supported) return null;
  return (
    <button
      type="button"
      onClick={wishlist.toggle}
      disabled={wishlist.disabled}
      aria-pressed={wishlist.inWishlist}
      aria-label={
        !wishlist.isAuthenticated
          ? t("home.wishlistSignIn", { name })
          : wishlist.inWishlist
            ? t("home.wishlistRemove", { name })
            : t("home.wishlistAdd", { name })
      }
      className={cx(
        "absolute top-[12px] end-[12px] z-[5] w-[36px] h-[36px] rounded-full grid place-items-center bg-sapil-white [transition:color_.2s,background_.2s] disabled:cursor-wait [&_svg]:w-[18px] [&_svg]:h-[18px]",
        wishlist.inWishlist ? "text-sapil-rose" : "text-sapil-ink hover:text-sapil-rose",
      )}
    >
      <HeartIcon filled={wishlist.inWishlist} />
    </button>
  );
}

export type HomeProductTileProps = {
  product: ProductSummary;
  /** pastel key from the API (`tileColor`) */
  tileColor?: string | null;
  /** white tiles (mood picks sit on a coloured band) */
  tileOverride?: string;
  /** the first visible product image of the page loads eagerly */
  priority?: boolean;
  sizes?: string;
  showWishlist?: boolean;
  className?: string;
};

/**
 * Home rails' product card: the design-system ProductCard from a shared product
 * summary, with add-to-bag (shared cart hook) and wishlist (shared hook).
 * TODO(integration): unify with the catalog area's card container.
 */
export function HomeProductTile({
  product,
  tileColor,
  tileOverride,
  priority,
  sizes = "(max-width: 900px) 50vw, (max-width: 1100px) 33vw, 25vw",
  showWishlist = true,
  className,
}: HomeProductTileProps) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const { addToCart } = useAddToCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const sellable = product.isSellable !== false && product.price != null;
  const image = product.imageUrl;

  return (
    <div className={cx("relative", className)}>
      <ProductCard
        name={product.title}
        href={`/products/${product.slug}`}
        LinkComponent={SapilLink}
        tile={tileOverride ?? tintValue(tileFor(tileColor))}
        quickLabel={t("home.shopNow")}
        viewLabel={t("home.viewProduct", { name: product.title })}
        addLabel={t("home.addToBag", { name: product.title })}
        image={
          image ? (
            <MediaImage
              src={image}
              alt={t("home.bottleAlt", { name: product.title })}
              fill
              sizes={sizes}
              preload={priority}
              loading={priority ? "eager" : "lazy"}
              className="!object-contain [transform:scale(1.62)] group-hover:[transform:scale(1.72)] [transition:transform_.45s]"
            />
          ) : (
            <span aria-hidden="true" />
          )
        }
        price={product.price != null ? price(product.price, product.currency) : t("home.priceUnavailable")}
        tags={sellable ? undefined : [t("home.soldOut")]}
        tagsHighlighted={!sellable}
        onAdd={
          sellable
            ? () => {
                setAdded(true);
                if (timer.current) window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => setAdded(false), 1400);
                void addToCart({
                  sku: product.sku,
                  variantId: product.variantId,
                  slug: product.slug,
                  title: product.title,
                  imageUrl: product.imageUrl,
                  price: product.price,
                  currency: product.currency,
                  quantity: 1,
                });
              }
            : undefined
        }
        added={added}
      />
      {showWishlist ? <WishlistHeart productId={product.id} name={product.title} /> : null}
    </div>
  );
}
