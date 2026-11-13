import type { ReactNode } from "react";
import { EYEBROW, Serif, Wrap, cx } from "../../ui";

export type SapilStatePanelProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  lead?: ReactNode;
  /** sticker text (e.g. "404"), drawn like the price-edit sticker */
  sticker?: ReactNode;
  stickerNote?: ReactNode;
  actions?: ReactNode;
  /** heading level: pages with their own H1 elsewhere pass "h2" */
  as?: "h1" | "h2";
  className?: string;
};

/**
 * Error / empty / unavailable states in the v9 price-edit banner style
 * (pastel gradient, Gloock title with a serif accent, butter sticker).
 */
export function SapilStatePanel({ eyebrow, title, accent, lead, sticker, stickerNote, actions, as: H = "h1", className }: SapilStatePanelProps) {
  return (
    <Wrap as="section" className={cx("w-full py-[48px] max-900:py-[24px]", className)}>
      <div className="relative overflow-hidden rounded-[32px] pt-[56px] px-[56px] pb-[48px] bg-[linear-gradient(120deg,var(--sapil-p-pink)_0%,var(--sapil-p-peach)_55%,var(--sapil-p-butter)_100%)] max-900:rounded-[24px] max-900:pt-[32px] max-900:px-[20px] max-900:pb-[28px]">
        {sticker ? (
          <span
            aria-hidden="true"
            className="absolute top-[28px] end-[28px] z-[3] w-[96px] h-[96px] rounded-full bg-sapil-p-butter text-sapil-ink grid place-content-center text-center font-[700] text-[12px] leading-[1.15] [transform:rotate(12deg)] shadow-[0_10px_24px_-12px_rgba(120,90,20,.3)] max-900:w-[76px] max-900:h-[76px] max-900:top-[18px] max-900:end-[18px] max-900:text-[10px]"
          >
            <b className="block font-sapil-display font-[400] text-[28px] leading-[1] max-900:text-[22px]">{sticker}</b>
            {stickerNote}
          </span>
        ) : null}
        <div className="relative max-w-[640px] pe-[96px] max-900:pe-[64px]">
          {eyebrow ? <p className={cx(EYEBROW, "!text-sapil-rose")}>{eyebrow}</p> : null}
          <H className="font-sapil-display !font-[400] text-[clamp(44px,5vw,80px)] !leading-[.95] !tracking-[-.01em] mt-[16px] mb-[18px] max-900:text-[46px]">
            {title}
            {accent ? (
              <>
                {" "}
                <Serif>{accent}</Serif>
              </>
            ) : null}
          </H>
          {lead ? <p className="text-[17px] text-sapil-ink-2 max-w-[44ch] mb-[26px]">{lead}</p> : null}
          {actions ? <div className="flex flex-wrap items-center gap-[12px]">{actions}</div> : null}
        </div>
      </div>
    </Wrap>
  );
}
