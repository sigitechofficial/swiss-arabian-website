"use client";

import { useEffect, useState, type RefObject } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { useProductPurchase } from "@/features/catalog/hooks/useProductPurchase";
import type { ProductSummary } from "@/features/catalog/types/product";
import type { CartLine } from "@/stores/useCartStore";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, Wrap } from "../../ui";
import { cx, tintStyle, type SapilTint } from "../../ui/shared";

/**
 * Add-to-bag bar fixed to the bottom of the screen once the buy box's Add to
 * bag row has scrolled up out of view (v9 product page, version B extras).
 * Hidden bars are inert (not focusable, not read out).
 */
export function StickyBuyBar({
  watchRef,
  name,
  price,
  image,
  tile,
  product,
  cartLine,
}: {
  /** the buy box's Add to bag row */
  watchRef: RefObject<HTMLElement | null>;
  name: string;
  price: string;
  image?: string | null;
  tile: SapilTint;
  product: ProductSummary;
  cartLine: CartLine | undefined;
}) {
  const t = useSapilCopy();
  const [on, setOn] = useState(false);
  // One more of the product (the bag opens), like the buy box's button at quantity 1.
  const purchase = useProductPurchase(product, cartLine);
  const onAdd = () => void purchase.add();

  useEffect(() => {
    const node = watchRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setOn(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [watchRef]);

  return (
    <div
      inert={!on}
      aria-hidden={!on}
      className={cx(
        "fixed inset-x-0 bottom-0 z-[45] bg-sapil-white border-t border-sapil-line [transition:transform_.35s_var(--sapil-ease)]",
        on ? "[transform:none]" : "[transform:translateY(100%)]",
      )}
    >
      <Wrap className="flex items-center gap-[14px] h-[72px] max-900:h-[64px]">
        {image ? (
          <span
            style={tintStyle("--sapil-tile", tile)}
            className="relative w-[48px] h-[48px] rounded-[12px] bg-sapil-tile grid place-items-center overflow-hidden max-900:hidden"
          >
            <MediaImage src={image} alt="" width={48} height={48} sizes="48px" className="h-[88%] w-auto object-contain" />
          </span>
        ) : null}
        <span className="me-auto text-[14px] min-w-0">
          <b className="block font-[600] truncate">{name}</b>
          <span className="tabular-nums">{price}</span>
        </span>
        <Button onClick={onAdd}>{t("product.addToBag")}</Button>
      </Wrap>
    </div>
  );
}
