"use client";

import { useApplicablePromotions } from "@/features/promotions/hooks/useApplicablePromotions";
import { usePromotionProgressTracking } from "@/features/promotions/hooks/usePromotionProgressTracking";
import type { ProgressMark } from "@/features/promotions/types/promotions";
import { compactProgressView, rewardFill } from "@/features/promotions/utils/progressView";
import { cx } from "../../ui";

/**
 * The bag's promotion progress in v9 (bag drawer, bag page, checkout summary):
 * the same decision as Swiss Arabian (`compactProgressView`): a "you saved"
 * banner, reward steps (gift, %, delivery), plain steps ("1 · 2 · 3") or a
 * meter, plus one unlocked-offer note. The server writes every sentence.
 */
export function SapilPromoProgress({ surface, className }: { surface: "drawer" | "cart" | "checkout"; className?: string }) {
  const { data } = useApplicablePromotions();
  const progress = data?.progress;
  usePromotionProgressTracking(progress, data?.promotions.context.zoneCode ?? null, surface);
  const view = compactProgressView(progress);
  if (view.kind === "none") return null;

  if (view.kind === "saved") {
    return (
      <div aria-live="polite" data-sapil="promo-progress" className={className}>
        <p className="flex items-center gap-[10px] rounded-full bg-sapil-ok text-sapil-white py-[8px] ps-[8px] pe-[14px] text-[14px] leading-[1.3]">
          <span aria-hidden="true" className="w-[26px] h-[26px] shrink-0 rounded-full bg-sapil-white text-sapil-ok grid place-items-center">
            <Tick />
          </span>
          <span>
            {view.headline.split(/(\d+\s*%)/).map((part, index) =>
              /^\d+\s*%$/.test(part) ? (
                <b key={index} className="font-[700] text-[16px]">
                  {part}
                </b>
              ) : (
                <span key={index}>{part}</span>
              ),
            )}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div aria-live="polite" data-sapil="promo-progress" className={cx("rounded-[14px] bg-[linear-gradient(120deg,var(--sapil-p-pink),var(--sapil-p-peach))] px-[14px] pt-[12px] pb-[14px]", className)}>
      {view.headline ? <p className="text-[14px] font-[600] leading-[1.35] text-sapil-ink">{view.headline}</p> : null}
      {view.marks.length ? (
        <Steps marks={view.marks} rewards={view.rewardMarks} />
      ) : view.meter != null ? (
        <span
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(view.meter)}
          aria-valuetext={view.headline ?? undefined}
          className="block relative h-[6px] mt-[10px] rounded-[3px] bg-[rgba(255,255,255,.75)] overflow-hidden"
        >
          <span
            style={{ width: `${Math.round(view.meter)}%` }}
            className="absolute inset-y-0 start-0 rounded-[inherit] bg-[linear-gradient(90deg,var(--sapil-accent),var(--sapil-accent-2))] [transition:width_.6s_var(--sapil-ease)]"
          />
        </span>
      ) : null}
      {view.note ? <p className="text-[12px] text-sapil-ink-2 mt-[8px]">{view.note}</p> : null}
    </div>
  );
}

/** "1 · 2 · 3" tier steps; with rewards, the line fills towards the next one. */
function Steps({ marks, rewards }: { marks: ProgressMark[]; rewards: boolean }) {
  const fill = rewards ? Math.max(0, Math.min(100, rewardFill(marks))) : null;
  const doneUpTo = marks.reduce((last, mark, index) => (mark.state === "complete" || mark.state === "current" ? index : last), -1);
  const plainFill = marks.length > 1 ? (Math.max(0, doneUpTo) / (marks.length - 1)) * 100 : 0;
  return (
    <div className="relative mt-[12px]">
      <span aria-hidden="true" className="absolute top-[13px] inset-x-[12%] h-[2px] rounded-full bg-[rgba(255,255,255,.8)]" />
      <span
        aria-hidden="true"
        style={{ width: `${(fill ?? plainFill) * 0.76}%` }}
        className="absolute top-[13px] start-[12%] h-[2px] rounded-full bg-sapil-accent [transition:width_.5s_var(--sapil-ease)]"
      />
      <ol className="relative flex list-none p-0 m-0">
        {marks.map((mark, index) => {
          const done = mark.state === "complete";
          const current = mark.state === "current";
          return (
            <li key={`${mark.tierId ?? mark.label}-${mark.detail}-${index}`} className="min-w-0 flex-1 text-center" aria-label={`${mark.label} ${mark.detail}`.trim()}>
              <span
                className={cx(
                  "relative z-[1] mx-auto w-[26px] h-[26px] rounded-full grid place-items-center text-[12px] font-[700]",
                  done ? "bg-sapil-accent text-sapil-white" : current ? "bg-sapil-white text-sapil-accent ring-2 ring-sapil-accent" : "bg-sapil-white text-sapil-muted",
                )}
              >
                {done ? <Tick /> : <RewardGlyph type={mark.rewardType} fallback={String(index + 1)} />}
              </span>
              <b className={cx("block mt-[6px] text-[12px] leading-[1.2] truncate", done || current ? "text-sapil-ink" : "text-sapil-muted")}>{mark.label}</b>
              {mark.detail ? <small className="block text-[11px] text-sapil-ink-2 truncate">{mark.detail}</small> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** The reward on a step (gift, %, delivery, amount off), else its number. */
function RewardGlyph({ type, fallback }: { type?: string; fallback: string }) {
  const svg = (d: string) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  if (type === "FREE_GIFT") return svg("M4 10h16v10H4zM2.5 6.5h19V10h-19zM12 6.5V20M12 6.5C10 3 7 3.5 7.5 5.5c.3 1 2.5 1 4.5 1M12 6.5c2-3.5 5-3 4.5-1-.3 1-2.5 1-4.5 1");
  if (type === "FREE_SHIPPING") return svg("M2 15V6h11v9M13 9h4l3 3v3H2M6 18.5a1.5 1.5 0 1 0 0-.01M17 18.5a1.5 1.5 0 1 0 0-.01");
  if (type === "PERCENTAGE") return <span aria-hidden="true">%</span>;
  if (type === "FIXED_AMOUNT") return svg("M3 12 12 3h8v8l-9 9zM16 8h.01");
  return <span aria-hidden="true">{fallback}</span>;
}
