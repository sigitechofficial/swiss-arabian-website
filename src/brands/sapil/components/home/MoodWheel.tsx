"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, Chip, EYEBROW, Wrap, cx, tintValue } from "../../ui";
import { useSapilPrice } from "../shared/useSapilPrice";
import type { Mood } from "./cmsSections";
import { HomeProductTile } from "./HomeProductTile";
import { useAddBundle } from "./HomeBundles";

const C = 200;
const R = 200;
const pt = (a: number, r: number) => [C + r * Math.sin((a * Math.PI) / 180), C - r * Math.cos((a * Math.PI) / 180)];

/** Rotation that brings mood `i` under the pointer from `rot`, after `turns` full turns. */
export function spinTarget(rot: number, i: number, count: number, turns: number): number {
  const seg = 360 / count;
  const target = -(i * seg + seg / 2);
  const delta = (((target - rot) % 360) + 360) % 360;
  return rot + turns * 360 + delta;
}

/** A random mood other than the current one (v9 "Spin"). */
function randomOther(current: number, count: number): number {
  if (count < 2) return current;
  const step = 1 + Math.floor(Math.random() * (count - 1));
  return (current + step) % count;
}

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * v9 "Shop by mood": a wheel of CMS moods (MOOD_PICKER). Spin for a random mood or
 * pick one from the wheel / legend; the result shows its products and "add all".
 */
export function MoodWheel({ eyebrow, heading, spinLabel, moods }: { eyebrow: string | null; heading: string | null; spinLabel: string | null; moods: Mood[] }) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const seg = 360 / moods.length;
  const [rot, setRot] = useState(-(seg / 2));
  const [current, setCurrent] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [duration, setDuration] = useState(0);
  const [tick, setTick] = useState(0);
  const timer = useRef<number | null>(null);
  const { added, add } = useAddBundle();
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const spinTo = (i: number, turns: number, dur: number) => {
    if (spinning) return;
    const reduce = reduced();
    setSpinning(true);
    setDuration(reduce ? 0.01 : dur);
    setRot((r) => spinTarget(r, i, moods.length, turns));
    timer.current = window.setTimeout(
      () => {
        setSpinning(false);
        setTick((n) => n + 1);
        setCurrent(i);
      },
      reduce ? 30 : dur * 1000 + 60,
    );
  };
  const pick = (i: number) => {
    if (i !== current) spinTo(i, 1, 1.2);
  };
  const spin = () => spinTo(randomOther(current, moods.length), 5, 3.4);

  const mood = moods[current];
  const sellable = mood.products.filter(({ product: p }) => p.isSellable !== false && p.price != null);
  const total = sellable.reduce((s, { product: p }) => s + (p.price ?? 0), 0);
  const currency = sellable[0]?.product.currency;

  return (
    <section
      id="mood"
      aria-label={heading ?? t("home.moodLabel")}
      style={{ "--sapil-mood": tintValue(mood.color) } as CSSProperties}
      className="py-[64px] max-900:py-[48px] bg-sapil-mood [transition:background_.7s_var(--sapil-ease)] overflow-hidden scroll-mt-[88px]"
    >
      <Wrap>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-[72px] items-center max-900:grid-cols-1 max-900:gap-[40px]">
          <div className="relative w-[min(480px,100%)] aspect-square justify-self-center">
            <svg
              key={tick}
              aria-hidden="true"
              viewBox="0 0 30 40"
              className={cx(
                "absolute left-1/2 top-[-14px] w-[30px] h-[40px] [transform:translateX(-50%)] z-[3] [filter:drop-shadow(0_4px_6px_rgba(30,20,10,.25))] origin-[50%_25%]",
                tick > 0 && "animate-sapil-tick",
              )}
            >
              <path d="M15 38 2.5 14a12.5 12.5 0 1 1 25 0Z" fill="var(--sapil-accent)" />
              <circle cx="15" cy="13" r="4.5" fill="var(--sapil-card)" />
            </svg>
            <div
              className="w-full h-full rounded-full shadow-sapil-lg bg-sapil-card"
              style={{
                transform: `rotate(${rot}deg)`,
                transition: `transform ${duration}s cubic-bezier(.12,.72,.12,1)`,
              }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full block rounded-full" role="group" aria-label={t("home.moodWheel")}>
                {moods.map((m, i) => {
                  const a0 = i * seg;
                  const a1 = a0 + seg;
                  const mid = a0 + seg / 2;
                  const [x0, y0] = pt(a0, R);
                  const [x1, y1] = pt(a1, R);
                  const [tx, ty] = pt(mid, 150);
                  const [ix, iy] = pt(mid, 104);
                  const flip = mid > 90 && mid < 270 ? mid + 180 : mid;
                  const img = resolveCatalogImageUrl(m.products[0]?.product.imageUrl);
                  return (
                    <g key={m.id} className="cursor-pointer group/seg" onClick={() => pick(i)} aria-hidden="true">
                      <path
                        d={`M${C},${C} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z`}
                        style={{ fill: tintValue(m.color) }}
                        stroke="var(--sapil-card)"
                        strokeWidth="3"
                        className="[transition:filter_.2s] group-hover/seg:brightness-[.97]"
                      />
                      {img ? <image href={img} x={ix - 24} y={iy - 24} width="48" height="48" transform={`rotate(${mid} ${ix} ${iy})`} /> : null}
                      <text
                        x={tx}
                        y={ty}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${flip} ${tx} ${ty})`}
                        className="font-sapil-sans text-[12px] font-[600] tracking-[.06em] uppercase fill-sapil-ink pointer-events-none"
                      >
                        {m.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              aria-label={spinLabel ?? `${t("home.moodSpinSmall")} ${t("home.moodSpinBig")}`}
              className="absolute left-1/2 top-1/2 w-[30%] aspect-square [transform:translate(-50%,-50%)] rounded-full bg-sapil-white text-sapil-accent z-[2] grid place-content-center gap-[2px] shadow-[0_0_0_8px_var(--sapil-card),var(--sapil-sh-lg)] [transition:transform_.2s_var(--sapil-ease)] hover:[transform:translate(-50%,-50%)_scale(1.05)] active:[transform:translate(-50%,-50%)_scale(.96)] disabled:cursor-wait"
            >
              <small className="text-[11px] tracking-[.14em] uppercase text-sapil-muted">{t("home.moodSpinSmall")}</small>
              <b className="font-sapil-serif font-[400] text-[clamp(20px,2.2vw,28px)] leading-[1]">{t("home.moodSpinBig")}</b>
            </button>
          </div>
          <div key={current} aria-live="polite" className="max-900:text-center">
            <p className={cx(EYEBROW, "animate-[sapil-rise_.55s_var(--sapil-ease)_both]")}>{eyebrow ?? t("home.moodEyebrow")}</p>
            <h2 className="text-[clamp(48px,6vw,88px)] mt-[12px] mb-[8px] !tracking-[-.03em] animate-[sapil-rise_.55s_var(--sapil-ease)_both]">{mood.name}</h2>
            <p className="font-sapil-serif italic text-[22px] text-sapil-ink-2 mb-[28px] animate-[sapil-rise_.55s_var(--sapil-ease)_both]">
              {mood.line}
              {mood.notes.length ? ` ${t("home.moodNotes", { notes: mood.notes.join(", ").toLowerCase() })}` : null}
            </p>
            <div className="grid grid-cols-3 gap-[16px] mb-[28px] text-start max-900:grid-cols-none max-900:grid-flow-col max-900:auto-cols-[58%] max-900:overflow-x-auto max-900:snap-x max-900:snap-mandatory max-900:scroll-px-sapil-gut max-900:[scrollbar-width:none] max-900:-mx-sapil-gut max-900:mb-[24px] max-900:px-sapil-gut">
              {mood.products.slice(0, 3).map(({ product, tileColor, wasPrice }) => (
                <div key={product.id} className="max-900:snap-start [&_h3]:!text-[15px] [&_.tabular-nums]:!text-[15px]">
                  <HomeProductTile product={product} tileColor={tileColor} wasPrice={wasPrice} tileOverride="var(--sapil-card)" sizes="(max-width: 900px) 58vw, 16vw" />
                </div>
              ))}
            </div>
            {sellable.length > 1 && currency ? (
              <Button onClick={() => add(mood.id, sellable)} className={cx(added === mood.id && "!bg-sapil-ok")}>
                {t("home.moodAddAll", { count: sellable.length, price: price(total, currency) })}
              </Button>
            ) : null}
          </div>
        </div>
        <div role="group" aria-label={t("home.moodChoose")} className="flex flex-wrap gap-[8px] mt-[40px] justify-center">
          {moods.map((m, i) => (
            <Chip
              key={m.id}
              dot={m.color}
              pressed={i === current}
              onClick={() => pick(i)}
              className={i === current ? undefined : "!bg-[rgba(255,253,250,.7)] !border-transparent"}
            >
              {m.name}
            </Chip>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
