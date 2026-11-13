"use client";

import { useId, type CSSProperties } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SectionHead, Wrap, cx, tintValue } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import { useSapilPrice } from "../shared/useSapilPrice";
import type { CollectionCard } from "./cmsSections";
import { HomeSection } from "./HomeParts";
import { RailControls, useRail } from "./useRail";

const IMG = [
  "z-[2] [transform:translateX(-50%)]",
  "[transform:translateX(-100%)_scale(.72)] origin-bottom-right group-hover/cc:[transform:translateX(-104%)_scale(.74)_rotate(-5deg)]",
  "[transform:translateX(0)_scale(.72)] origin-bottom-left group-hover/cc:[transform:translateX(4%)_scale(.74)_rotate(5deg)]",
];

/** v9 collection "scroll story" cards: count, from-price, three bottles, name and line. */
export function CollectionsStory({ heading, text, cards }: { heading: string | null; text: string | null; cards: CollectionCard[] }) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const headingId = useId();
  const { railRef, ...rail } = useRail<HTMLDivElement>(22);
  return (
    <HomeSection id="collections" labelledBy={headingId}>
      <Wrap>
        <SectionHead
          id={headingId}
          eyebrow={t("home.collectionsEyebrow")}
          title={heading ?? t("home.collectionsTitle")}
          accent={heading ? undefined : t("home.collectionsAccent")}
          actions={
            <div className="flex gap-[24px] items-end flex-wrap">
              <p className="text-sapil-ink-2 max-w-[46ch] mt-[12px]">{text ?? t("home.collectionsText")}</p>
              <RailControls
                atStart={rail.atStart}
                atEnd={rail.atEnd}
                prev={rail.prev}
                next={rail.next}
                prevLabel={t("home.collectionsPrev")}
                nextLabel={t("home.collectionsNext")}
              />
            </div>
          }
        />
      </Wrap>
      <div
        ref={railRef}
        className="flex gap-[22px] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-[12px] pb-[8px] px-[max(var(--sapil-gut),calc((100vw-var(--sapil-wrap))/2+var(--sapil-gut)))] scroll-px-[max(var(--sapil-gut),calc((100vw-var(--sapil-wrap))/2+var(--sapil-gut)))] max-900:gap-[14px]"
      >
        {cards.map((c) => {
          const label = [
            c.title,
            c.count != null ? t("home.collectionCount", { count: c.count }) : null,
            c.fromPrice != null && c.currency ? t("home.fromPrice", { price: price(c.fromPrice, c.currency) }) : null,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <SapilLink
              key={c.id}
              href={c.href}
              aria-label={label}
              style={{ "--c": tintValue(c.color) } as CSSProperties}
              className="group/cc flex-[0_0_clamp(270px,28vw,400px)] h-[clamp(380px,60vh,540px)] rounded-[32px] bg-[var(--c)] relative overflow-hidden p-[26px] flex flex-col justify-between text-start snap-start [transition:transform_.5s_var(--sapil-ease)] hover:[transform:translateY(-8px)] max-900:flex-[0_0_80vw] max-900:h-[440px] max-900:rounded-[24px] max-900:p-[22px]"
            >
              <span className="flex justify-between text-[13px] text-sapil-muted">
                <span>{c.count != null ? t("home.collectionCount", { count: c.count }) : null}</span>
                <span>{c.fromPrice != null && c.currency ? t("home.fromPrice", { price: price(c.fromPrice, c.currency) }) : null}</span>
              </span>
              <span aria-hidden="true" className="absolute left-[12%] right-[12%] top-[16%] bottom-[30%]">
                {c.images.map((im, i) => {
                  const src = resolveCatalogImageUrl(im.url);
                  return src ? (
                    <span
                      key={`${im.url}-${i}`}
                      className={cx(
                        "absolute bottom-0 left-1/2 h-[92%] aspect-[1/2] [filter:drop-shadow(0_20px_20px_rgba(22,20,15,.18))] [transition:transform_.6s_var(--sapil-ease)]",
                        IMG[i],
                      )}
                    >
                      <MediaImage src={src} alt="" fill sizes="200px" className="!object-contain" />
                    </span>
                  ) : null;
                })}
              </span>
              <span className="relative z-[2]">
                <span className="block font-sapil-display text-[clamp(34px,3vw,46px)] leading-[1] tracking-[-.01em]">{c.title}</span>
                {c.text ? <span className="block text-sapil-muted text-[15px] mt-[8px] pe-[56px]">{c.text}</span> : null}
              </span>
              <span
                aria-hidden="true"
                className="absolute end-[22px] bottom-[22px] w-[48px] h-[48px] rounded-full bg-sapil-white grid place-items-center text-[18px] z-[2] [transition:transform_.4s_var(--sapil-ease)] group-hover/cc:[transform:rotate(-45deg)] rtl:[transform:scaleX(-1)] rtl:group-hover/cc:[transform:scaleX(-1)_rotate(-45deg)]"
              >
                →
              </span>
            </SapilLink>
          );
        })}
      </div>
    </HomeSection>
  );
}
