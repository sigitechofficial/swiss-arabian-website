import { formatMoney } from "@/features/home/utils/formatMoney";
import type { GiftCatalogHit } from "../hooks/useGiftCatalog";
import type { PromotionGiftLine } from "../types/promotions";
import { giftUnitPrice } from "../utils/giftWithPurchase";

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

/** Display-only gift. Not a priced cart line and not removable. */
export function GiftCartItem({
  line,
  product,
  currency,
}: {
  line: PromotionGiftLine;
  product?: GiftCatalogHit | null;
  currency: string;
}) {
  const title = giftCardTitle(line, product);
  const sku = giftCardSku(line, product);
  const imageUrl = product?.imageUrl || line.imageUrl;

  return (
    <article className="cline cline--gift" aria-label="Free gift">
      <div className="cline__media">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} />
        ) : null}
      </div>
      <div className="cline__body">
        <p className="cline__gift-tag">Free gift added</p>
        <div className="cline__row">
          <h3>{title}</h3>
          <span className="cline__price" dir="ltr">
            {formatMoney(giftUnitPrice(), currency)}
          </span>
        </div>
        <p className="cline__meta">Qty {line.quantity}</p>
        {sku ? <p className="cline__meta">{sku}</p> : null}
        <p className="cline__gift-tag">Gift with purchase</p>
      </div>
    </article>
  );
}
