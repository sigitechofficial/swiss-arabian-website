"use client";

import { formatMoney } from "@/lib/format/money";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import {
  checkoutAddon,
  checkoutAddonAdd,
  checkoutAddonMedia,
  checkoutAddonName,
  checkoutAddonPrice,
  checkoutMiss,
  checkoutMissCard,
  checkoutMissHead,
  checkoutMissList,
  checkoutMissTitle,
} from "@/styles/checkoutChrome";

export function CheckoutAddonRow({
  product,
  adding,
  onAdd,
  compact = false,
  disabled = false,
}: {
  product: CatalogProduct;
  adding: boolean;
  onAdd: (product: CatalogProduct) => void;
  compact?: boolean;
  /** Shown but not addable (e.g. static items with no live SKU yet). */
  disabled?: boolean;
}) {
  const t = useShopCopy();
  const unavailableLabel = t("cart.addon.unavailable", { name: product.title });
  return (
    <article
      className={compact ? checkoutMissCard : checkoutAddon}
      data-addon=""
    >
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={checkoutAddonMedia} src={product.imageUrl} alt="" />
      ) : (
        <span
          className={checkoutAddonMedia}
          data-addon-ph=""
          aria-hidden="true"
        />
      )}
      <div>
        <p className={checkoutAddonName}>{product.title}</p>
        <p className={checkoutAddonPrice}>
          {formatMoney(product.price ?? 0, product.currency)}
        </p>
      </div>
      <button
        type="button"
        className={checkoutAddonAdd}
        disabled={adding || disabled}
        onClick={() => onAdd(product)}
        title={disabled ? unavailableLabel : undefined}
        aria-label={
          disabled
            ? unavailableLabel
            : adding
              ? t("cart.addon.adding", { name: product.title })
              : t("cart.addon.add", { name: product.title })
        }
      >
        {compact ? (adding ? "…" : "+") : adding ? t("cart.addon.addingShort") : t("cart.addon.addShort")}
      </button>
    </article>
  );
}

export function MissThisSwiper({
  products,
  addingSlug,
  onAdd,
  canAdd,
}: {
  products: CatalogProduct[];
  addingSlug: string | null;
  onAdd: (product: CatalogProduct) => void;
  /** Omit to allow adding every product (cart page behaviour). */
  canAdd?: (product: CatalogProduct) => boolean;
}) {
  const t = useShopCopy();
  return (
    <div className={checkoutMiss} aria-labelledby="checkout-miss-heading">
      <div className={checkoutMissHead}>
        <h3 className={checkoutMissTitle} id="checkout-miss-heading">
          {t("cart.addon.title")}
        </h3>
      </div>
      <div className={checkoutMissList}>
        {products.map((product) => (
          <CheckoutAddonRow
            key={product.id}
            product={product}
            adding={addingSlug === product.slug}
            onAdd={onAdd}
            disabled={canAdd ? !canAdd(product) : false}
            compact
          />
        ))}
      </div>
    </div>
  );
}
