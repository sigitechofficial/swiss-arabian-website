import type { GiftCatalogHit } from "../hooks/useGiftCatalog";
import type { PromotionGiftLine } from "../types/promotions";
import {
  cline,
  clineBody,
  clineMedia,
  clineMeta,
  clinePrice,
  clineRow,
  drawerLineName,
  drawerLinePrice,
  drawerLineTag,
  drawerLineTop,
  giftDrawerBody,
  giftDrawerLine,
  giftDrawerMedia,
  giftDrawerMeta,
} from "@/styles/cartChrome";
import {
  coline,
  colineBody,
  colineMedia,
  colineName,
  colinePrice,
  colineTop,
} from "@/styles/checkoutChrome";

function isSourceSku(value: string): boolean {
  return value.includes(":") || value.length > 48;
}

export function giftCardTitle(
  line: PromotionGiftLine,
  product: GiftCatalogHit | null | undefined,
): string {
  if (product?.title) return product.title;
  const name = line.name?.trim();
  if (name && !isSourceSku(name)) return name;
  return "Free gift";
}

export function giftCardSku(
  line: PromotionGiftLine,
  product: GiftCatalogHit | null | undefined,
): string | null {
  const catalogSku = product?.sku?.trim();
  if (catalogSku && !isSourceSku(catalogSku)) return catalogSku;
  if (!isSourceSku(line.sku)) return line.sku;
  return null;
}

/** Display-only gift. Same layout as a product line; price reads Free. */
export function GiftCartItem({
  line,
  product,
  variant = "checkout",
}: {
  line: PromotionGiftLine;
  product?: GiftCatalogHit | null;
  currency?: string;
  /** Checkout summary uses the bag-drawer row; cart page uses full `cline`; the bag drawer a compact row. */
  variant?: "checkout" | "cart" | "drawer";
}) {
  const title = giftCardTitle(line, product);
  const imageUrl = product?.imageUrl || line.imageUrl;

  if (variant === "drawer") {
    return (
      <article className={giftDrawerLine} aria-label={`Free gift: ${title}`}>
        <div className={giftDrawerMedia}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" />
          ) : null}
        </div>
        <div className={giftDrawerBody}>
          <div className={drawerLineTop}>
            <p className={drawerLineName}>{title}</p>
            <span className={drawerLinePrice} dir="ltr">
              Free
            </span>
          </div>
          <div className={giftDrawerMeta}>
            <span className={drawerLineTag}>Free gift</span>
            <span>Qty {line.quantity}</span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "checkout") {
    return (
      <article className={coline} aria-label={`Free gift: ${title}`}>
        <div className={colineMedia}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          ) : null}
          <b>{line.quantity}</b>
        </div>
        <div className={colineBody}>
          <div className={colineTop}>
            <h3 className={colineName}>{title}</h3>
            <p className={colinePrice} dir="ltr">
              Free
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cline} aria-label={`Free gift: ${title}`}>
      <div className={clineMedia}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} />
        ) : null}
      </div>
      <div className={clineBody}>
        <div className={clineRow}>
          <h3>{title}</h3>
          <span className={clinePrice} dir="ltr">
            Free
          </span>
        </div>
        <p className={clineMeta}>Qty {line.quantity}</p>
      </div>
    </article>
  );
}
