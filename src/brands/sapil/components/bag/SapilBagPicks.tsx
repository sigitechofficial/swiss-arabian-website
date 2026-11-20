"use client";

import type { Ref } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { railHeading, useEmptyBagRecovery } from "@/features/promotions/hooks/useEmptyBagRecovery";
import { usePromotionQuickAdd } from "@/features/promotions/hooks/usePromotionQuickAdd";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { cx } from "../../ui";
import { SapilLink } from "../commerce/shared";

type Pick = { sku: string; title: string; image: string | null; price: string | null; slug: string | null };

/** A row of small v9 tiles with a round "+" that adds one to the bag. */
function PicksRail({
  heading,
  picks,
  addLabel,
  busy,
  onAdd,
  onOpen,
  rootRef,
  className,
}: {
  heading: string;
  picks: Pick[];
  addLabel: string;
  busy: string | null;
  onAdd: (pick: Pick) => void;
  onOpen?: () => void;
  rootRef?: Ref<HTMLDivElement>;
  className?: string;
}) {
  const t = useSapilCopy();
  return (
    <div ref={rootRef} className={cx("mt-[18px]", className)} data-sapil="bag-picks">
      <p className="text-[12px] font-[700] tracking-[.14em] uppercase text-sapil-muted mb-[10px]">{heading}</p>
      <ul className="list-none p-0 m-0 flex gap-[10px] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-[2px]">
        {picks.map((pick) => (
          <li key={pick.sku} className="snap-start shrink-0 w-[min(260px,82%)] flex items-center gap-[12px] bg-sapil-white rounded-[16px] p-[10px] pe-[12px]">
            <span className="relative shrink-0 w-[56px] h-[56px] rounded-[12px] bg-sapil-tile overflow-hidden">
              {pick.image ? <MediaImage src={pick.image} alt={t("product.imageAlt", { name: pick.title })} fill sizes="56px" className="object-contain p-[4px]" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              {pick.slug ? (
                <SapilLink href={`/products/${pick.slug}`} onClick={onOpen} className="block text-[14px] leading-[1.25] font-[500] line-clamp-2 hover:text-sapil-accent">
                  {pick.title}
                </SapilLink>
              ) : (
                <span className="block text-[14px] leading-[1.25] font-[500] line-clamp-2">{pick.title}</span>
              )}
              {pick.price ? <span className="block text-[13px] font-[600] text-sapil-accent tabular-nums">{pick.price}</span> : null}
            </span>
            <button
              type="button"
              disabled={busy === pick.sku}
              aria-label={`${addLabel || t("bag.add")} ${pick.title}`}
              onClick={() => onAdd(pick)}
              className="shrink-0 w-[34px] h-[34px] rounded-full grid place-items-center border border-sapil-ink text-sapil-ink hover:bg-sapil-ink hover:text-sapil-white disabled:opacity-50 disabled:cursor-wait [transition:background_.2s,color_.2s]"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Add this to unlock the next reward": the server's picks for the offer in
 * progress (shared `usePromotionQuickAdd`, as on Swiss Arabian), in v9 tiles.
 */
export function SapilQuickAdd({ surface, holdPosition = false, className }: { surface: string; holdPosition?: boolean; className?: string }) {
  const q = usePromotionQuickAdd({ surface, holdPosition });
  if (!q.show) return null;
  return (
    <PicksRail
      heading={q.heading}
      picks={q.products}
      addLabel={q.addLabel}
      busy={q.busy}
      onAdd={(pick) => q.add(pick as (typeof q.products)[number])}
      onOpen={q.trackClick}
      rootRef={q.rootRef}
      className={className}
    />
  );
}

/** Suggestions in an empty bag (shared `useEmptyBagRecovery`, as on Swiss Arabian). */
export function SapilEmptyBagPicks({ surface }: { surface: string }) {
  const e = useEmptyBagRecovery(surface);
  if (!e.groups.length) return null;
  return (
    <>
      {e.groups.map((group) => (
        <PicksRail
          key={group.id || group.heading}
          heading={railHeading(group.heading)}
          picks={group.products}
          addLabel={e.addLabel}
          busy={e.busy}
          onAdd={(pick) => e.add(group, pick as (typeof group.products)[number])}
          onOpen={() => e.trackClick(group)}
        />
      ))}
    </>
  );
}
