"use client";

import { useState } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { cx, tintStyle, type SapilTint } from "../../ui/shared";

/** Bottle shots sit on the tile, zoomed; photographs (3rd image on) fill it (v9 `.g-main img.photo`). */
function isPhoto(index: number, src: string): boolean {
  return index > 1 || /lifestyle|\.jpe?g(\?|$)/i.test(src);
}

/**
 * v9 `.gallery`: the main image on the product's tile (sticky beside the buy
 * box on desktop) and square thumbnails. The first image is the page's LCP.
 */
export function PdpGallery({
  images,
  name,
  tile,
  resetKey,
  onImageError,
}: {
  images: string[];
  name: string;
  tile: SapilTint;
  resetKey: string;
  onImageError: (src: string) => void;
}) {
  const t = useSapilCopy();
  const [index, setIndex] = useState(0);
  useResetOnChange(resetKey, () => setIndex(0));
  const current = Math.min(index, Math.max(0, images.length - 1));
  const main = images[current];
  const photo = main ? isPhoto(current, main) : false;

  return (
    <div
      data-sapil="gallery"
      className="sticky top-[96px] flex flex-col gap-[14px] max-900:static"
      aria-label={t("product.gallery")}
      role="group"
    >
      <div
        style={tintStyle("--sapil-tile", tile)}
        className="relative aspect-[1/1.05] rounded-[32px] bg-sapil-tile overflow-hidden grid place-items-center max-900:rounded-[24px]"
      >
        {main ? (
          <MediaImage
            key={main}
            src={main}
            alt={t("product.imageAlt", { name })}
            fill
            sizes="(max-width: 900px) 100vw, 760px"
            loading="eager"
            fetchPriority={current === 0 ? "high" : undefined}
            onError={() => onImageError(main)}
            className={cx(
              photo
                ? "object-cover"
                : "object-contain [transform:scale(1.15)] [filter:drop-shadow(0_26px_30px_rgba(30,40,70,.18))]",
            )}
          />
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-[10px] flex-wrap">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-pressed={i === current}
              aria-label={t("product.imageN", { n: i + 1 })}
              onClick={() => setIndex(i)}
              style={tintStyle("--sapil-tile", tile)}
              className="relative w-[84px] h-[84px] rounded-[16px] bg-sapil-tile overflow-hidden opacity-[.65] [transition:opacity_.2s,box-shadow_.2s] hover:opacity-100 hover:shadow-[0_0_0_2px_var(--sapil-ink)] aria-pressed:opacity-100 aria-pressed:shadow-[0_0_0_2px_var(--sapil-ink)] max-900:w-[64px] max-900:h-[64px] max-900:rounded-[12px]"
            >
              <MediaImage src={src} alt="" fill sizes="84px" className="object-cover" onError={() => onImageError(src)} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
