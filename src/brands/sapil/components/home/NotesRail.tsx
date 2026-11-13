"use client";

import { useId, type CSSProperties } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { useFragranceNotes } from "@/features/merchandising";
import { fragranceNotesPlpHref } from "@/features/merchandising/utils/visibleFragranceNoteTiles";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SectionHead, Wrap, tintValue, type SapilPastel } from "../../ui";
import { ArrowIcon } from "../shared/icons";
import { SapilLink } from "../shared/SapilLink";
import { HomeSection } from "./HomeParts";
import { RailControls, useRail } from "./useRail";

/** v9 note tile colours, in its order. */
const NOTE_TINTS: SapilPastel[] = ["pink", "sky", "lime", "butter", "lilac", "peach", "mint", "pink", "sky", "lime", "butter", "lilac"];

/** v9 "Shop by note": note cards (Fragrance notes merchandising); each opens the shop filtered to it. */
export function NotesRail({ heading }: { heading: string | null }) {
  const t = useSapilCopy();
  const headingId = useId();
  const { tiles, isReady } = useFragranceNotes();
  const { railRef, ...rail } = useRail<HTMLDivElement>(24);
  if (isReady && !tiles.length) return null;
  return (
    <HomeSection id="notes" labelledBy={headingId}>
      <Wrap>
        <SectionHead
          id={headingId}
          eyebrow={t("home.notesEyebrow")}
          title={heading ?? t("home.notesTitle")}
          accent={heading ? undefined : t("home.notesAccent")}
          actions={
            <div className="flex gap-[24px] items-end flex-wrap">
              <p className="text-sapil-ink-2 max-w-[46ch] mt-[12px]">{t("home.notesText")}</p>
              <RailControls atStart={rail.atStart} atEnd={rail.atEnd} prev={rail.prev} next={rail.next} prevLabel={t("home.notesPrev")} nextLabel={t("home.notesNext")} />
            </div>
          }
        />
        <div
          ref={railRef}
          role="group"
          aria-label={t("home.notesLabel")}
          aria-busy={!isReady}
          className="grid grid-flow-col auto-cols-[calc((100%-72px)/4)] gap-[24px] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-[10px] -mt-[10px] pb-[4px] max-1100:auto-cols-[calc((100%-48px)/3)] max-900:auto-cols-[calc(50%-8px)] max-900:gap-[16px]"
        >
          {!isReady
            ? Array.from({ length: 4 }, (_, i) => (
                <span key={i} aria-hidden="true" className="h-[400px] rounded-[32px] bg-sapil-p-sand animate-pulse max-900:h-[300px] max-900:rounded-[22px]" />
              ))
            : tiles.map((tile, i) => {
                const src = resolveCatalogImageUrl(tile.imageUrl);
                return (
                  <SapilLink
                    key={tile.code || tile.fragranceFamily}
                    href={fragranceNotesPlpHref(tile.fragranceFamily)}
                    style={{ "--fc": tintValue(NOTE_TINTS[i % NOTE_TINTS.length]) } as CSSProperties}
                    className="group/n relative snap-start h-[400px] rounded-[32px] bg-[var(--fc)] overflow-hidden p-[24px] flex flex-col justify-end text-start [transition:transform_.45s_var(--sapil-ease)] hover:[transform:translateY(-6px)] max-900:h-[300px] max-900:rounded-[22px] max-900:p-[16px]"
                  >
                    {src ? (
                      <span aria-hidden="true" className="absolute left-[12%] right-[12%] top-[7%] bottom-[30%] [transform:scale(1.25)] [filter:drop-shadow(0_18px_20px_rgba(30,40,70,.18))] [transition:transform_.5s_var(--sapil-ease)] group-hover/n:[transform:scale(1.25)_translateY(-8px)]">
                        <MediaImage src={src} alt="" fill sizes="(max-width: 900px) 50vw, 25vw" className="!object-contain" />
                      </span>
                    ) : null}
                    <span className="relative z-[2] flex items-end justify-between gap-[12px]">
                      <span className="block font-sapil-sans font-[700] text-[32px] leading-[1.05] tracking-[-.03em] text-sapil-ink max-900:text-[22px]">{tile.name}</span>
                      <span
                        aria-hidden="true"
                        className="w-[56px] h-[56px] rounded-full bg-sapil-white grid place-items-center flex-none [transition:transform_.35s_var(--sapil-ease)] group-hover/n:[transform:translateX(4px)] rtl:group-hover/n:[transform:translateX(-4px)] [&_svg]:w-[22px] [&_svg]:h-[22px] rtl:[&_svg]:[transform:scaleX(-1)] max-900:w-[40px] max-900:h-[40px] max-900:[&_svg]:w-[18px] max-900:[&_svg]:h-[18px]"
                      >
                        <ArrowIcon />
                      </span>
                    </span>
                  </SapilLink>
                );
              })}
        </div>
      </Wrap>
    </HomeSection>
  );
}
