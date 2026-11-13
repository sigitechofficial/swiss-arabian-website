import type { ReactNode } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { EYEBROW } from "../../ui";
import { cx, tintStyle, type SapilLinkComponent, type SapilTint } from "../../ui/shared";
import { BottleTrio } from "./BottleTrio";

/**
 * v9 `.coll-hero`: the collection's own banner. Copy on the start side (kicker,
 * Gloock name, italic tagline, story, meta pills, CTAs); a campaign photo with
 * the hero bottle on its tile, or three bottles when there is no photo.
 */
export function CollectionHero({
  eyebrow,
  title,
  tagline,
  story,
  meta,
  ctas,
  color,
  photo,
  photoAlt,
  heroBottle,
  trio,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  tagline?: ReactNode;
  story?: ReactNode;
  /** `.ch-meta` pills ("6 fragrances", "From AED 45") */
  meta: ReactNode[];
  ctas?: ReactNode;
  color: SapilTint;
  photo?: string | null;
  photoAlt?: string;
  /** Hero bottle on its tile over the photo. */
  heroBottle?: { image: string; tile: SapilTint } | null;
  /** Bottles when there's no photo. */
  trio: string[];
}) {
  return (
    <header
      style={tintStyle("--hc", color)}
      className="grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-[48px] items-center bg-[var(--hc)] rounded-[32px] py-[48px] pe-[48px] ps-[56px] mt-[24px] mb-[20px] min-h-[460px] overflow-hidden max-900:grid-cols-1 max-900:pt-[28px] max-900:px-[22px] max-900:pb-[24px] max-900:gap-[24px] max-900:rounded-[24px] max-900:min-h-0"
    >
      <div>
        <p className={EYEBROW}>{eyebrow}</p>
        <h1 className="font-sapil-display font-[400] text-[clamp(56px,7vw,112px)] leading-[.95] tracking-[-.01em] mt-[14px] mb-[10px] max-900:text-[56px]">
          {title}
        </h1>
        {tagline ? (
          <p className="font-sapil-serif italic text-[24px] text-sapil-ink-2 mb-[16px] max-900:text-[20px]">{tagline}</p>
        ) : null}
        {story ? <div className="text-[17px] text-sapil-ink-2 max-w-[48ch]">{story}</div> : null}
        {meta.length ? (
          <ul className="list-none flex flex-wrap gap-[8px] mt-[22px] mb-[26px] p-0 [&_b]:font-[700]">
            {meta.map((m, i) => (
              <li key={i} className="bg-[rgba(255,255,255,.75)] rounded-full py-[7px] px-[14px] text-[14px]">
                {m}
              </li>
            ))}
          </ul>
        ) : null}
        {ctas ? <div className="flex gap-[10px] flex-wrap">{ctas}</div> : null}
      </div>
      {photo ? (
        <div className="relative h-full min-h-[380px] max-900:min-h-[300px]">
          <MediaImage
            src={photo}
            alt={photoAlt ?? ""}
            fill
            sizes="(max-width: 900px) 100vw, 600px"
            loading="eager"
            fetchPriority="high"
            className="object-cover rounded-[24px]"
          />
          {heroBottle ? (
            <span
              style={tintStyle("--sapil-tile", heroBottle.tile)}
              className="absolute -start-[28px] -bottom-[20px] w-[38%] aspect-[1/1.2] rounded-[20px] bg-sapil-tile grid place-items-center border-[8px] border-[var(--hc)] shadow-sapil-lg max-900:start-[12px] max-900:bottom-[12px] max-900:w-[34%] max-900:border-[6px]"
            >
              <MediaImage
                src={heroBottle.image}
                alt=""
                width={300}
                height={360}
                sizes="200px"
                className="h-[84%] w-auto object-contain [filter:drop-shadow(0_12px_12px_rgba(22,20,15,.18))]"
              />
            </span>
          ) : null}
        </div>
      ) : (
        <BottleTrio
          images={trio}
          eager
          bottom="4%"
          height="86%"
          shadow="drop-shadow(0 20px 20px rgba(22,20,15,.2))"
          sizes="(max-width: 900px) 50vw, 300px"
          className={cx("relative h-full min-h-[380px] flex items-end justify-center max-900:min-h-[300px]")}
        />
      )}
    </header>
  );
}

/** v9 `.coll-notes`: "Signature notes" + note pills linking to the shop filtered by that note. */
export function CollectionNotes({
  label,
  notes,
  LinkComponent,
}: {
  label: ReactNode;
  notes: { label: string; href: string; color: SapilTint }[];
  LinkComponent: SapilLinkComponent;
}) {
  if (!notes.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-[8px] mb-[8px] max-900:flex-nowrap max-900:overflow-x-auto max-900:[scrollbar-width:none] max-900:-mx-sapil-gut max-900:px-sapil-gut max-900:mb-[4px]">
      <span className="text-[12px] font-[700] tracking-[.08em] uppercase text-sapil-ink-2 me-[8px] flex-none">{label}</span>
      {notes.map((n) => (
        <LinkComponent
          key={n.href}
          href={n.href}
          style={tintStyle("--nc", n.color)}
          className="h-[38px] px-[18px] rounded-full bg-[var(--nc,#fff)] inline-flex items-center gap-[8px] text-[14px] font-[500] flex-none [transition:transform_.2s_var(--sapil-ease)] hover:[transform:translateY(-2px)]"
        >
          {n.label}
        </LinkComponent>
      ))}
    </div>
  );
}
