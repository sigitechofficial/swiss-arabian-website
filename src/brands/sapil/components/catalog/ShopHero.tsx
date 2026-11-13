import type { ReactNode } from "react";
import { EYEBROW } from "../../ui";
import { cx, tintStyle, type SapilTint } from "../../ui/shared";
import { BottleTrio } from "./BottleTrio";

/**
 * v9 `.shop-hero`: pastel banner with kicker, Gloock title, line, bottle count
 * and three bottles. The colour follows what is shown (a collection, all bottles …).
 */
export function ShopHero({
  kind,
  title,
  sub,
  meta,
  color,
  images,
  className,
}: {
  kind: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  /** "48 bottles · from AED 45" */
  meta?: ReactNode;
  color: SapilTint;
  images: string[];
  className?: string;
}) {
  return (
    <header
      style={tintStyle("--hc", color)}
      className={cx(
        "relative grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-[32px] bg-[var(--hc)] rounded-[32px] py-[48px] px-[56px] mt-[24px] mb-[28px] min-h-[300px] overflow-hidden max-900:grid-cols-1 max-900:py-[28px] max-900:px-[22px] max-900:rounded-[24px] max-900:gap-[8px]",
        className,
      )}
    >
      <div>
        <p className={EYEBROW}>{kind}</p>
        <h1 className="font-sapil-display font-[400] text-[clamp(48px,6vw,84px)] !leading-[1] mt-[12px] mb-[14px]">{title}</h1>
        {sub ? <p className="text-[17px] text-sapil-ink-2 max-w-[40ch]">{sub}</p> : null}
        {meta ? <p className="mt-[18px] font-[600] text-[14px]">{meta}</p> : null}
      </div>
      <BottleTrio images={images} eager sizes="(max-width: 900px) 40vw, 240px" className="relative h-[260px] max-900:h-[180px]" />
    </header>
  );
}
