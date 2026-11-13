"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { useAddToCart } from "@/features/cart";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, EYEBROW, cx, tintValue } from "../../ui";
import { PlusIcon } from "../shared/icons";
import { SapilLink } from "../shared/SapilLink";
import { useSapilPrice } from "../shared/useSapilPrice";
import type { HeroGallery as HeroGalleryData } from "./cmsSections";
import { PartsText } from "./HomeParts";

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

/* .d-intro start padding: the page gutter, aligned with the 1440px wrap on wide screens */
const INTRO_START = "min(clamp(28px,3.4vw,56px),max(var(--sapil-gut),calc((100vw - var(--sapil-wrap))/2 + var(--sapil-gut))))";
const RISE = "animate-sapil-rise";

/**
 * Hero layout 1, the gallery "doors" (v9 `.entrance`): intro on the start side,
 * one door per room (a collection and its piece on show). One door is open at a
 * time; they advance on their own until reduced motion or hover/focus pauses them.
 */
export function HeroGallery({ hero }: { hero: HeroGalleryData }) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const reduce = useReducedMotion();
  const { addToCart } = useAddToCart();
  const baseId = useId();
  const [open, setOpen] = useState(hero.initialRoom);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    if (!added) return;
    const id = window.setTimeout(() => setAdded(null), 1400);
    return () => window.clearTimeout(id);
  }, [added]);

  const openOnHover = (i: number) => {
    if (window.matchMedia("(hover: hover)").matches) setOpen(i);
  };

  return (
    <section
      aria-label={t("home.heroGalleryLabel")}
      className="bg-sapil-paper overflow-hidden border-b border-sapil-line"
    >
      <div className="grid grid-cols-[minmax(320px,31%)_minmax(0,1fr)] min-h-[clamp(620px,calc(100svh-112px),880px)] max-1100:grid-cols-[minmax(300px,36%)_minmax(0,1fr)] max-900:grid-cols-1 max-900:min-h-0">
        <div
          style={{ "--intro-ps": INTRO_START } as CSSProperties}
          className="flex flex-col justify-center py-[48px] pe-[clamp(28px,3.4vw,56px)] ps-[var(--intro-ps)] max-900:pt-[40px] max-900:pb-[34px] max-900:px-sapil-gut"
        >
          {hero.eyebrow ? <p className={cx(EYEBROW, RISE)}>{hero.eyebrow}</p> : null}
          {/* Not a heading: the page's one H1 is the SEO title (see app/[locale]/(shop)/page.tsx). */}
          <p
            className={cx(
              "font-sapil-serif [text-wrap:balance] !font-[300] text-[clamp(56px,6.4vw,104px)] !leading-[.92] !tracking-[-.03em] mt-[20px] mb-[22px] max-900:text-[clamp(54px,15vw,84px)]",
              RISE,
            )}
            style={{ animationDelay: ".08s" }}
          >
            <PartsText parts={hero.heading} serifClassName="!font-[300]" />
          </p>
          {hero.lead ? (
            <p className={cx("text-[16px] text-sapil-ink-2 max-w-[380px]", RISE)} style={{ animationDelay: ".16s" }}>
              {hero.lead}
            </p>
          ) : null}
          {hero.primary || hero.secondary ? (
            <div className={cx("flex gap-[10px] flex-wrap mt-[28px]", RISE)} style={{ animationDelay: ".24s" }}>
              {hero.primary ? (
                <Button href={hero.primary.href} LinkComponent={SapilLink}>
                  {hero.primary.label}
                </Button>
              ) : null}
              {hero.secondary ? (
                <Button href={hero.secondary.href} variant="line" LinkComponent={SapilLink}>
                  {hero.secondary.label}
                </Button>
              ) : null}
            </div>
          ) : null}
          <div
            className={cx("flex gap-[28px] mt-[40px] pt-[18px] border-t border-sapil-line max-480:gap-[20px]", RISE)}
            style={{ animationDelay: ".32s" }}
          >
            <div className="text-[12px] text-sapil-muted">
              <b className="block font-sapil-serif font-[400] text-[24px] text-sapil-ink tabular-nums">{hero.rooms.length}</b>
              {t("home.heroRooms", { count: hero.rooms.length })}
            </div>
          </div>
        </div>
        <div
          className="group/doors flex min-w-0 max-900:flex-col"
          aria-label={t("home.heroRoomsLabel")}
          role="group"
        >
          {hero.rooms.map((room, i) => {
            const on = i === open;
            const bodyId = `${baseId}-door-${i}`;
            const p = room.piece.product;
            const roomHref = room.collection.slug ? `/collections/${room.collection.slug}` : "/collections";
            const productHref = `/products/${p.slug}`;
            return (
              <article
                key={room.id}
                style={{ "--wc": tintValue(room.wall) } as CSSProperties}
                className={cx(
                  "relative min-w-0 overflow-hidden bg-[var(--wc)] border-s border-[rgba(30,27,24,.1)] [transition:flex-grow_.9s_var(--sapil-ease)] [flex:1_1_0]",
                  on && "!grow-[5.6]",
                  "max-900:!flex-none max-900:h-[62px] max-900:border-s-0 max-900:border-t max-900:[transition:height_.8s_var(--sapil-ease)]",
                  on && "max-900:h-[clamp(470px,128vw,560px)]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute left-1/2 top-[44%] w-[520px] h-[520px] [transform:translate(-50%,-50%)] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,.6),rgba(255,255,255,0))] [transition:opacity_.9s]",
                    on ? "opacity-100" : "opacity-0",
                  )}
                />
                {p.imageUrl ? (
                  <span
                    aria-hidden="true"
                    className={cx(
                      "absolute left-1/2 top-[14%] w-[420px] h-[62%] [transition:transform_1s_var(--sapil-ease),opacity_.4s] [filter:drop-shadow(0_26px_24px_rgba(30,27,24,.22))] max-900:w-[min(340px,86vw)] max-900:top-[15%] max-900:h-[52%]",
                      on ? "[transform:translateX(-50%)]" : "[transform:translateX(-50%)_scale(1.06)] max-900:opacity-0",
                    )}
                  >
                    <MediaImage
                      src={p.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 86vw, 420px"
                      preload={i === hero.initialRoom}
                      loading={i === hero.initialRoom ? "eager" : "lazy"}
                      className="!object-contain"
                    />
                  </span>
                ) : null}
                <button
                  type="button"
                  aria-expanded={on}
                  aria-controls={bodyId}
                  onClick={() => setOpen(i)}
                  onMouseOver={() => openOnHover(i)}
                  className={cx(
                    "absolute inset-0 z-[2] flex flex-col items-center justify-between py-[26px] text-center [transition:opacity_.4s] max-900:flex-row max-900:justify-start max-900:gap-[16px] max-900:px-sapil-gut max-900:py-0",
                    on ? "opacity-0 pointer-events-none" : "hover:bg-[rgba(255,255,255,.25)]",
                  )}
                >
                  <span className="font-sapil-serif italic text-[26px] leading-[1] max-900:text-[22px] max-900:w-[28px]">{room.number}</span>
                  <span className="[writing-mode:vertical-rl] [transform:rotate(180deg)] text-[11px] font-[600] tracking-[.2em] uppercase whitespace-nowrap bg-[var(--wc)] py-[14px] px-[4px] max-900:[writing-mode:horizontal-tb] max-900:[transform:none] max-900:p-0 max-900:bg-transparent">
                    {room.collection.name}
                  </span>
                </button>
                <SapilLink
                  href={productHref}
                  tabIndex={-1}
                  aria-label={t("home.viewProduct", { name: p.title })}
                  className={cx(
                    "absolute left-[18%] right-[18%] top-[14%] h-[62%] z-[2] max-900:top-[15%] max-900:h-[52%]",
                    !on && "pointer-events-none",
                  )}
                />
                <div
                  id={bodyId}
                  className={cx(
                    "absolute inset-0 z-[3] flex flex-col justify-between pt-[28px] px-[clamp(22px,2.4vw,36px)] pb-[26px] pointer-events-none [&>*]:pointer-events-auto max-900:py-[22px] max-900:px-sapil-gut",
                    on
                      ? "opacity-100 visible [transition:opacity_.6s_.35s,visibility_0s]"
                      : "opacity-0 invisible [transition:opacity_.5s,visibility_0s_.5s]",
                  )}
                >
                  <div>
                    <p className={cx(EYEBROW, "!text-[11px]")}>{t("home.heroRoom", { number: room.number, name: room.collection.name })}</p>
                    <h2 className="!font-[300] text-[clamp(34px,3vw,46px)] !leading-[1] mt-[10px] whitespace-nowrap max-1100:text-[32px] max-900:text-[34px] max-900:whitespace-normal">
                      <PartsText parts={room.title} serifClassName="!font-[300]" />
                    </h2>
                  </div>
                  <div className="bg-[rgba(255,253,250,.92)] rounded-sapil pt-[16px] pe-[16px] pb-[16px] ps-[18px] shadow-sapil">
                    <div className="flex items-center gap-[14px]">
                      <div className="min-w-0 me-auto">
                        <small className="block text-[10px] font-[600] tracking-[.2em] uppercase text-sapil-muted">{t("home.heroNowShowing")}</small>
                        <b className="block font-sapil-serif font-[400] text-[24px] leading-[1.1] mt-[4px] whitespace-nowrap overflow-hidden text-ellipsis">{p.title}</b>
                      </div>
                      {p.price != null ? (
                        <span className="tabular-nums font-[600] text-[17px] whitespace-nowrap">{price(p.price, p.currency)}</span>
                      ) : null}
                      {p.isSellable !== false && p.price != null ? (
                        <button
                          type="button"
                          tabIndex={on ? 0 : -1}
                          aria-label={t("home.addToBag", { name: p.title })}
                          onClick={() => {
                            setAdded(room.id);
                            void addToCart({
                              sku: p.sku,
                              variantId: p.variantId,
                              slug: p.slug,
                              title: p.title,
                              imageUrl: p.imageUrl,
                              price: p.price,
                              currency: p.currency,
                            });
                          }}
                          className={cx(
                            "w-[48px] h-[48px] rounded-full border border-sapil-white grid place-items-center flex-none shadow-[inset_0_0_0_1px_var(--sapil-line-2)] [transition:background_.2s,color_.2s] [&_svg]:w-[20px] [&_svg]:h-[20px]",
                            added === room.id ? "bg-sapil-ok text-sapil-white" : "bg-sapil-white text-sapil-accent hover:bg-sapil-ink hover:text-sapil-white",
                          )}
                        >
                          <PlusIcon />
                        </button>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-[12px] mt-[14px] pt-[12px] border-t border-sapil-line">
                      <Button href={roomHref} LinkComponent={SapilLink} tabIndex={on ? 0 : -1} className="!h-[40px] !px-[18px] !text-[14px]">
                        {room.ctaLabel ?? t("home.heroEnterRoom", { number: room.number })}
                      </Button>
                      <Button href={productHref} variant="link" LinkComponent={SapilLink} tabIndex={on ? 0 : -1} className="!text-[14px] max-480:hidden">
                        {t("home.heroViewPiece")}
                      </Button>
                    </div>
                  </div>
                </div>
                <span aria-hidden="true" className="absolute left-0 right-0 bottom-0 h-[2px] z-[4] overflow-hidden">
                  {on ? (
                    <b
                      key={open}
                      onAnimationEnd={() => {
                        if (!reduce && hero.autoAdvance) setOpen((k) => (k + 1) % hero.rooms.length);
                      }}
                      className={cx(
                        "block h-full bg-sapil-ink [transform:scaleX(0)] origin-left rtl:origin-right",
                        hero.autoAdvance && !reduce && "animate-sapil-dprog [@media(hover:hover)]:group-hover/doors:[animation-play-state:paused] group-focus-within/doors:[animation-play-state:paused]",
                      )}
                    />
                  ) : null}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
