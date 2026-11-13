"use client";

import type { ReactNode } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { EYEBROW, Serif } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx, type SapilLinkComponent } from "../../ui/shared";

export type PriceTier = { max: number; label: string; href: string; current: boolean; count?: number };

/** v9 `.tier-tabs`: Under AED 50 / 99 / 199 links above the price-edit banner. */
export function TierTabs({
  tiers,
  label,
  LinkComponent,
}: {
  tiers: PriceTier[];
  label: string;
  LinkComponent: SapilLinkComponent;
}) {
  if (tiers.length < 2) return null;
  return (
    <nav aria-label={label} className="flex gap-[8px] flex-wrap mt-[18px]">
      {tiers.map((tier) => (
        <LinkComponent
          key={tier.max}
          href={tier.href}
          aria-current={tier.current ? "page" : undefined}
          className={cx(
            "inline-flex items-center gap-[8px] h-[42px] px-[18px] rounded-full border font-[600] text-[15px] [transition:border-color_.18s,background_.18s]",
            tier.current
              ? "bg-sapil-accent border-sapil-accent text-sapil-white"
              : "bg-sapil-card border-sapil-line-2 hover:border-sapil-ink",
          )}
        >
          {tier.label}
          {tier.count != null ? (
            <small className={cx("text-[12px] font-[500]", tier.current ? "text-sapil-on-dark" : "text-sapil-muted")}>
              {tier.count}
            </small>
          ) : null}
        </LinkComponent>
      ))}
    </nav>
  );
}

export type ShelfBottle = { name: string; href: string; image: string; price: number; label: string };

/**
 * v9 `.u99s.u99-hero`: the price-edit banner. Kicker, "Under AED 99.", a line
 * with the count, price chips, CTA with the free-delivery note, the sticker,
 * and five bottles on a shelf with swinging price tags.
 */
export function PriceEditHero({
  kicker,
  titleLead,
  titleAccent,
  ghost,
  lead,
  chips,
  onChip,
  chipsLabel,
  ctaLabel,
  ctaHref,
  note,
  sticker,
  shelf,
  currencyLabel,
  LinkComponent,
}: {
  kicker: ReactNode;
  titleLead: ReactNode;
  titleAccent: ReactNode;
  /** big pale number behind the shelf ("99") */
  ghost: ReactNode;
  lead?: ReactNode;
  chips: { value: string; label: string; count?: number }[];
  onChip: (value: string) => void;
  chipsLabel: string;
  ctaLabel: ReactNode;
  ctaHref: string;
  /** "Delivery is free over AED 100" (market setting; hidden when none) */
  note?: ReactNode;
  /** sticker ("100+ ships free"; market free-delivery threshold) */
  sticker?: { top: ReactNode; bottom: ReactNode } | null;
  shelf: ShelfBottle[];
  /** small text on the price tags ("AED") */
  currencyLabel: string;
  LinkComponent: SapilLinkComponent;
}) {
  return (
    <header className="relative grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-[40px] items-center rounded-[32px] pt-[56px] px-[56px] pb-[48px] mt-[16px] mb-[28px] overflow-hidden bg-[linear-gradient(120deg,var(--sapil-p-pink)_0%,var(--sapil-p-peach)_55%,var(--sapil-p-butter)_100%)] max-900:grid-cols-1 max-900:pt-[32px] max-900:px-[20px] max-900:pb-[24px] max-900:gap-[8px] max-900:rounded-[24px]">
      {sticker ? (
        <span
          aria-hidden="true"
          className="absolute top-[28px] end-[28px] z-[3] w-[96px] h-[96px] rounded-full bg-sapil-p-butter text-sapil-ink grid place-content-center text-center font-[700] text-[12px] leading-[1.15] [transform:rotate(12deg)] shadow-[0_10px_24px_-12px_rgba(120,90,20,.3)] max-900:hidden"
        >
          <span>
            <b className="block font-sapil-display font-[400] text-[28px] leading-[1]">{sticker.top}</b>
            {sticker.bottom}
          </span>
        </span>
      ) : null}
      <div>
        <p className={cx(EYEBROW, "!text-sapil-rose")}>{kicker}</p>
        <h1 className="font-sapil-display font-[400] text-[clamp(52px,5.6vw,88px)] leading-[.95] mt-[16px] mb-[18px] tracking-[-.01em] max-900:text-[46px]">
          {titleLead} <Serif className="font-sapil-serif">{titleAccent}</Serif>
        </h1>
        {lead ? <p className="text-[17px] text-sapil-ink-2 max-w-[34ch] mb-[26px]">{lead}</p> : null}
        {chips.length ? (
          <div role="group" aria-label={chipsLabel} className="flex flex-wrap gap-[10px] mb-[26px]">
            {chips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => onChip(chip.value)}
                className="group/chip inline-flex items-center gap-[8px] h-[44px] px-[18px] rounded-full bg-sapil-white font-[600] text-[15px] shadow-[0_6px_16px_-10px_rgba(150,60,90,.35)] [transition:background_.2s,color_.2s,transform_.2s_var(--sapil-ease)] hover:bg-sapil-ink hover:text-sapil-white hover:[transform:translateY(-2px)]"
              >
                {chip.label}
                {chip.count != null ? (
                  <small className="text-[12px] font-[500] text-sapil-muted group-hover/chip:text-sapil-on-dark">{chip.count}</small>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-[18px] flex-wrap">
          <LinkComponent href={ctaHref} className={cx(buttonClass("dark"), "group/cta [&_svg]:w-[18px] [&_svg]:h-[18px]")}>
            {ctaLabel}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
              className="[transition:transform_.25s_var(--sapil-ease)] group-hover/cta:[transform:translateX(4px)] rtl:-scale-x-100"
            >
              <path d="M5 12h14m-5-5 5 5-5 5" />
            </svg>
          </LinkComponent>
          {note ? <span className="text-[14px] text-sapil-ink-2 [&_b]:text-sapil-ink">{note}</span> : null}
        </div>
      </div>
      <div className="relative h-[460px] flex items-end justify-center px-[4%] pb-[40px] after:content-[''] after:absolute after:inset-x-0 after:bottom-[8px] after:h-[44px] after:rounded-full after:bg-[rgba(255,255,255,.7)] after:shadow-[0_18px_30px_-18px_rgba(150,80,60,.35)] max-900:h-[280px] max-900:pb-[26px]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[-6px] [transform:translateX(-50%)] font-sapil-display text-[clamp(220px,24vw,360px)] leading-[.8] text-[rgba(255,255,255,.75)] pointer-events-none select-none max-900:text-[200px]"
        >
          {ghost}
        </span>
        {shelf.slice(0, 5).map((b, i) => (
          <LinkComponent
            key={b.href}
            href={b.href}
            aria-label={b.label}
            className={cx(
              "group/sb relative block flex-[1_1_0] min-w-0",
              i === 2 ? "h-[80%] z-[3]" : i === 1 || i === 3 ? "h-[70%] z-[2]" : "h-[62%] z-[1]",
              (i === 0 || i === 4) && "max-900:hidden",
            )}
          >
            <MediaImage
              src={b.image}
              alt=""
              width={400}
              height={600}
              sizes="(max-width: 900px) 30vw, 180px"
              loading={i === 2 ? "eager" : "lazy"}
              className="absolute bottom-[-10%] left-1/2 h-full w-auto max-w-none object-contain origin-bottom [transform:translateX(-50%)_scale(1.06)] [filter:drop-shadow(0_16px_16px_rgba(80,40,30,.2))] [transition:transform_.5s_var(--sapil-ease)] group-hover/sb:[transform:translateX(-50%)_scale(1.06)_translateY(-8px)]"
            />
            <span
              aria-hidden="true"
              className="absolute right-[2%] bottom-[24%] z-[2] grid place-items-center min-w-[64px] pt-[8px] pr-[10px] pb-[8px] pl-[20px] bg-sapil-white text-sapil-ink [clip-path:polygon(12px_0,100%_0,100%_100%,12px_100%,0_50%)] [transform:rotate(-10deg)] origin-[0_50%] shadow-[0_8px_18px_-10px_rgba(0,0,0,.3)] text-center leading-[1] before:content-[''] before:absolute before:left-[8px] before:top-1/2 before:w-[6px] before:h-[6px] before:-mt-[3px] before:rounded-full before:bg-sapil-p-pink group-hover/sb:animate-sapil-swing max-900:min-w-[52px] max-900:pt-[6px] max-900:pr-[8px] max-900:pb-[6px] max-900:pl-[16px]"
            >
              <small className="text-[9px] font-[700] tracking-[.14em]">{currencyLabel}</small>
              <b className="font-sapil-display font-[400] text-[24px] mt-[2px] max-900:text-[19px]">{b.price}</b>
            </span>
          </LinkComponent>
        ))}
      </div>
    </header>
  );
}
