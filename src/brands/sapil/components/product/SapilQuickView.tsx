"use client";

import { useState } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import type { ProductSummary } from "@/features/catalog/types/product";
import { stripHtml } from "@/features/catalog/utils/catalogHtml";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, Dialog, Eyebrow, Price } from "../../ui";
import { cx, tintStyle } from "../../ui/shared";
import type { SapilCardModel } from "./productCardModel";
import { SapilLocaleLink } from "./SapilLocaleLink";

/**
 * v9 quick view (`dialog` + `.qv`): the product's images on its tile, kind and
 * name, short description, price and Add to bag, and a link to the full page.
 * Built from the listing summary only (no extra request).
 */
export function SapilQuickView({
  product,
  model,
  open,
  onClose,
  onAdd,
}: {
  product: ProductSummary;
  model: SapilCardModel;
  open: boolean;
  onClose: () => void;
  /** Adds one to the bag (the bag opens); absent when the product can't be bought. */
  onAdd?: () => void;
}) {
  const t = useSapilCopy();
  const images = (product.imageUrls?.length ? product.imageUrls : model.image ? [model.image] : []).slice(0, 4);
  const [index, setIndex] = useState(0);
  const main = images[index] ?? images[0];
  const tagline = stripHtml(product.subtitle).trim();
  return (
    <Dialog open={open} onClose={onClose} label={t("product.quickViewOf", { name: model.name })} closeLabel={t("product.close")}>
      <div className="grid grid-cols-2 max-900:grid-cols-1">
        <div
          style={tintStyle("--sapil-tile", model.tile)}
          className="bg-sapil-tile flex flex-col items-center justify-center p-[32px] gap-[16px] min-h-[520px] max-900:min-h-0 max-900:p-[24px]"
        >
          {main ? (
            <div className="relative h-[400px] w-full max-900:h-[280px] [filter:drop-shadow(0_18px_18px_rgba(0,0,0,.14))]">
              <MediaImage src={main} alt={t("product.imageAlt", { name: model.name })} fill sizes="(max-width: 900px) 90vw, 480px" className="object-contain" />
            </div>
          ) : null}
          {images.length > 1 ? (
            <div className="flex gap-[8px]" role="group" aria-label={t("product.gallery")}>
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-pressed={i === index}
                  aria-label={t("product.imageN", { n: i + 1 })}
                  onClick={() => setIndex(i)}
                  className={cx(
                    "relative w-[56px] h-[56px] rounded-sapil-sm bg-sapil-card overflow-hidden border-2",
                    i === index ? "border-sapil-ink" : "border-transparent",
                  )}
                >
                  <MediaImage src={src} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="py-[44px] px-[40px] overflow-y-auto max-900:py-[28px] max-900:px-[24px]">
          {model.tags.length ? <Eyebrow>{model.tags.join(" · ")}</Eyebrow> : null}
          <h2 className="text-[40px] mt-[10px] mb-[6px] max-900:text-[32px]">{model.name}</h2>
          {tagline ? (
            <p className="font-sapil-serif italic text-[19px] text-sapil-ink-2 mb-[18px]">{tagline}</p>
          ) : null}
          <div className="flex items-center gap-[16px] flex-wrap mt-[18px]">
            <Price value={model.price} was={model.was} className="text-[24px]" />
            {onAdd ? (
              <Button
                onClick={() => {
                  onAdd();
                  onClose();
                }}
              >
                {t("product.addToBag")}
              </Button>
            ) : (
              <span className="text-[14px] font-[600] text-sapil-sale">
                {model.unavailable ? t("product.unavailable") : t("product.outOfStock")}
              </span>
            )}
          </div>
          <p className="mt-[24px]">
            <Button variant="link" href={model.href} LinkComponent={SapilLocaleLink} onClick={onClose}>
              {t("product.viewFullDetails")}
            </Button>
          </p>
        </div>
      </div>
    </Dialog>
  );
}
