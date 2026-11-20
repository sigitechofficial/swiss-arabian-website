"use client";

import { useState } from "react";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { cx } from "../../ui";

const BTN =
  "absolute grid place-items-center w-[32px] h-[32px] rounded-full bg-[rgba(22,20,15,.45)] text-sapil-white [&_svg]:w-[16px] [&_svg]:h-[16px] hover:bg-[rgba(22,20,15,.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapil-white";

/**
 * The product's PR video (admin product media), as on Swiss Arabian: a small
 * muted, looping player in the corner that can be enlarged or closed. Sits
 * above Sapil's sticky add-to-bag bar.
 */
export function PdpPrVideo({
  video,
  poster,
  title,
  resetKey,
  onError,
}: {
  video: { url: string; name: string | null };
  poster?: string;
  title: string;
  resetKey: string;
  onError: (url: string) => void;
}) {
  const t = useShopCopy();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useResetOnChange(resetKey, () => {
    setOpen(true);
    setExpanded(false);
  });

  if (!open) return null;

  return (
    <div
      data-sapil="pr-video"
      className={cx(
        "fixed end-[20px] bottom-[96px] z-[50] aspect-[3/4.15] overflow-hidden rounded-[20px] bg-sapil-ink shadow-sapil-lg border-[3px] border-sapil-white [transition:width_.45s_var(--sapil-ease)] max-900:end-[12px] max-900:bottom-[calc(80px+env(safe-area-inset-bottom,0px))] max-900:rounded-[16px]",
        expanded ? "w-[min(320px,calc(100vw-32px))] max-900:w-[min(220px,calc(100vw-24px))]" : "w-[190px] max-900:w-[124px]",
      )}
    >
      <video
        className="block w-full h-full object-cover"
        src={video.url}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        // The stored name is the file name ("flower.mp4"): shoppers hear the product instead.
        aria-label={t("pdpVideo.label", { title })}
        onError={() => onError(video.url)}
      />
      <button type="button" className={cx(BTN, "top-[6px] end-[6px]")} aria-label={t("pdpVideo.close")} onClick={() => setOpen(false)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        className={cx(BTN, "bottom-[6px] start-[6px]")}
        aria-label={expanded ? t("pdpVideo.shrink") : t("pdpVideo.expand")}
        aria-pressed={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
