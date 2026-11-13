"use client";

import { useRef, type ReactNode } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { SectionHead, Wrap } from "../../ui";
import { tintStyle, type SapilLinkComponent, type SapilTint } from "../../ui/shared";
import { BottleTrio } from "./BottleTrio";
import { RailButtons } from "./RailButtons";

export type CollectionCardItem = {
  key: string;
  href: string;
  name: string;
  line?: ReactNode;
  /** "6 fragrances" */
  countLabel?: ReactNode;
  /** "from AED 45" */
  fromLabel?: ReactNode;
  color: SapilTint;
  images: string[];
};

export type PromoTileItem = {
  key: string;
  href: string;
  title: ReactNode;
  sub: ReactNode;
  color: SapilTint;
  image?: string | null;
};

/** v9 `.ccard`: tall pastel collection card; bottles spread on hover. */
function CollectionCard({ item, LinkComponent }: { item: CollectionCardItem; LinkComponent: SapilLinkComponent }) {
  return (
    <LinkComponent
      href={item.href}
      aria-label={item.name}
      style={tintStyle("--c", item.color)}
      className="group flex-[0_0_clamp(270px,28vw,400px)] h-[clamp(380px,60vh,540px)] rounded-[32px] bg-[var(--c)] relative overflow-hidden p-[26px] flex flex-col justify-between text-start snap-start [transition:transform_.5s_var(--sapil-ease)] hover:[transform:translateY(-8px)] max-900:basis-[80vw] max-900:h-[440px] max-900:rounded-[24px] max-900:p-[22px]"
    >
      <span className="flex justify-between text-[13px] text-sapil-muted">
        <span>{item.countLabel}</span>
        <span>{item.fromLabel}</span>
      </span>
      {item.images.length ? (
        <BottleTrio
          images={item.images}
          spread
          height="92%"
          shadow="drop-shadow(0 20px 20px rgba(22,20,15,.18))"
          sizes="200px"
          className="!absolute left-[12%] right-[12%] top-[16%] bottom-[30%]"
        />
      ) : null}
      <span>
        <span className="block font-sapil-display font-[400] text-[clamp(34px,3vw,46px)] leading-[1] tracking-[-.01em] relative z-[2]">
          {item.name}
        </span>
        {item.line ? (
          <span className="block text-sapil-muted text-[15px] mt-[8px] relative z-[2] pe-[56px]">{item.line}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className="absolute end-[22px] bottom-[22px] w-[48px] h-[48px] rounded-full bg-sapil-white grid place-items-center text-[18px] z-[2] [transition:transform_.4s_var(--sapil-ease)] group-hover:[transform:rotate(-45deg)] rtl:-scale-x-100"
      >
        →
      </span>
    </LinkComponent>
  );
}

/** v9 `.promo-tile`: pastel tile with a title, a line and a bottle. */
function PromoTile({ item, LinkComponent }: { item: PromoTileItem; LinkComponent: SapilLinkComponent }) {
  return (
    <LinkComponent
      href={item.href}
      style={tintStyle("--pc", item.color)}
      className="group relative flex items-center justify-between gap-[16px] min-h-[200px] bg-[var(--pc)] rounded-[28px] pt-[28px] px-[28px] pb-[84px] overflow-hidden [transition:transform_.4s_var(--sapil-ease)] hover:[transform:translateY(-4px)] max-900:min-h-[160px] max-900:rounded-[22px] max-900:pt-[22px] max-900:px-[22px] max-900:pb-[76px]"
    >
      <span>
        <b className="block font-sapil-display font-[400] text-[34px] leading-[1]">{item.title}</b>
        <small className="block text-[15px] text-sapil-ink-2 mt-[8px]">{item.sub}</small>
      </span>
      {item.image ? (
        <MediaImage
          src={item.image}
          alt=""
          width={200}
          height={300}
          sizes="120px"
          className="h-[150px] w-auto object-contain [filter:drop-shadow(0_14px_14px_rgba(22,20,15,.18))] [transition:transform_.5s_var(--sapil-ease)] group-hover:[transform:translateY(-6px)_rotate(-3deg)] max-900:h-[120px]"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="absolute start-[28px] bottom-[24px] w-[44px] h-[44px] rounded-full bg-sapil-white grid place-items-center max-900:start-[22px] max-900:bottom-[18px] rtl:-scale-x-100"
      >
        →
      </span>
    </LinkComponent>
  );
}

/**
 * v9 `.shop-more` ("Keep exploring"): the collections rail with arrows, then
 * three promo tiles. Hidden when there's nothing to show.
 */
export function KeepExploring({
  eyebrow,
  title,
  accent,
  collections,
  promos = [],
  previousLabel,
  nextLabel,
  label,
  LinkComponent,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  accent: ReactNode;
  collections: CollectionCardItem[];
  promos?: PromoTileItem[];
  previousLabel: string;
  nextLabel: string;
  /** section name for assistive tech ("Explore more") */
  label: string;
  LinkComponent: SapilLinkComponent;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  if (!collections.length && !promos.length) return null;
  return (
    <section aria-label={label} className="bg-sapil-white pt-[96px] pb-[104px] max-900:pt-[64px] max-900:pb-[72px]">
      {collections.length ? (
        <>
          <Wrap>
            <SectionHead
              eyebrow={eyebrow}
              title={title}
              accent={accent}
              actions={
                <RailButtons railRef={railRef} gap={22} previousLabel={previousLabel} nextLabel={nextLabel} disableAtEnds={false} />
              }
            />
          </Wrap>
          <div
            ref={railRef}
            className="flex gap-[22px] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-[12px] pb-[8px] px-[max(var(--sapil-gut),calc((100vw-var(--sapil-wrap))/2+var(--sapil-gut)))] scroll-px-[max(var(--sapil-gut),calc((100vw-var(--sapil-wrap))/2+var(--sapil-gut)))] max-900:gap-[14px]"
          >
            {collections.map((item) => (
              <CollectionCard key={item.key} item={item} LinkComponent={LinkComponent} />
            ))}
          </div>
        </>
      ) : null}
      {promos.length ? (
        <Wrap>
          <div className="grid grid-cols-3 gap-[24px] mt-[48px] max-900:grid-cols-1 max-900:gap-[14px] max-900:mt-[32px]">
            {promos.map((item) => (
              <PromoTile key={item.key} item={item} LinkComponent={LinkComponent} />
            ))}
          </div>
        </Wrap>
      ) : null}
    </section>
  );
}
