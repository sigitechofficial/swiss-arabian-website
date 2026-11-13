"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getBrand } from "@/lib/brand";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { useShopableVideo } from "@/features/merchandising";
import type { ShopableVideoSlide } from "@/features/merchandising/types/merch";
import { parseShopablePrice } from "@/features/merchandising/utils/playableShopableSlides";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, EYEBROW, SectionHead, Wrap, cx } from "../../ui";
import { ArrowIcon, ChatIcon, HeartIcon, InstagramIcon, MutedIcon, PlayIcon, SendIcon, SoundIcon } from "../shared/icons";
import { SapilLink } from "../shared/SapilLink";
import { useSapilPrice } from "../shared/useSapilPrice";
import { RailControls } from "./useRail";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True while `ref` is at least `threshold` visible. */
function useInView<T extends Element>(threshold: number) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const SHOP_PILL =
  "absolute left-[12px] right-[12px] bottom-[14px] z-[4] flex items-center justify-between gap-[8px] bg-[rgba(255,255,255,.95)] rounded-full py-[8px] pe-[8px] ps-[16px] text-[13px] font-[600] shadow-[0_8px_20px_-10px_rgba(0,0,0,.35)] [transition:background_.2s] hover:bg-sapil-white";
const SHOP_PILL_GO =
  "w-[32px] h-[32px] rounded-full bg-sapil-accent text-sapil-white grid place-items-center flex-none [&_svg]:w-[16px] [&_svg]:h-[16px] rtl:[&_svg]:[transform:scaleX(-1)]";

function videoOf(slide: ShopableVideoSlide) {
  return slide.video?.url ?? null;
}

/**
 * Hero layout 2, video (v9 `.hv`): copy on the start side, three films playing
 * on the end side. Films play muted only while the hero is in view and motion is allowed.
 */
export function HeroVideo({ heading }: { heading: string | null }) {
  const t = useSapilCopy();
  const price = useSapilPrice();
  const { slides, isReady } = useShopableVideo();
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const films = slides.filter((s) => videoOf(s)).slice(0, 3);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const play = inView && !prefersReducedMotion();
    box.querySelectorAll("video").forEach((v) => {
      if (play) void v.play().catch(() => {});
      else v.pause();
    });
  }, [inView, films.length, ref]);

  if (isReady && !films.length) return null;

  return (
    <section aria-label={t("home.heroVideoLabel")} className="pt-[24px] pb-[16px] max-900:pt-[16px] max-900:pb-[8px]">
      <Wrap>
        <div
          ref={ref}
          className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-[48px] items-center bg-[linear-gradient(135deg,var(--sapil-p-lilac)_0%,var(--sapil-p-pink)_60%,var(--sapil-p-peach)_100%)] rounded-[32px] py-[48px] pe-[48px] ps-[56px] min-h-[min(680px,calc(100svh-190px))] overflow-hidden max-900:grid-cols-1 max-900:pt-[28px] max-900:px-[20px] max-900:pb-[24px] max-900:gap-[24px] max-900:rounded-[24px] max-900:min-h-0"
        >
          <div>
            <p className={EYEBROW}>{t("home.heroVideoEyebrow")}</p>
            <p className="font-sapil-display text-[clamp(48px,5.6vw,92px)] leading-[.98] tracking-[-.01em] mt-[16px] mb-[18px] [text-wrap:balance] max-900:text-[46px]">
              {heading ?? (
                <>
                  {t("home.heroVideoTitle")} <span className="font-sapil-serif italic">{t("home.heroVideoAccent")}</span>
                </>
              )}
            </p>
            <p className="text-[17px] text-sapil-ink-2 max-w-[40ch] mb-[28px]">{t("home.heroVideoText")}</p>
            <div className="flex gap-[10px] flex-wrap">
              <Button href="/products" LinkComponent={SapilLink}>
                {t("home.heroVideoCta")}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-[18px] items-center max-900:grid-cols-none max-900:grid-flow-col max-900:auto-cols-[62%] max-900:overflow-x-auto max-900:snap-x max-900:snap-mandatory max-900:[scrollbar-width:none] max-900:-mx-[20px] max-900:pt-[12px] max-900:px-[20px] max-900:pb-[4px]">
            {(films.length ? films : Array.from({ length: 3 }, () => null)).map((slide, i) => (
              <div
                key={slide?.productId ?? i}
                className={cx(
                  "relative aspect-[9/16] rounded-[26px] overflow-hidden bg-sapil-sand shadow-[0_30px_60px_-30px_rgba(120,70,110,.45)] max-900:snap-start",
                  i === 1 && "[transform:translateY(-18px)_scale(1.06)] z-[1] max-900:[transform:none]",
                  !slide && "animate-pulse",
                )}
              >
                {slide ? (
                  <>
                    <video
                      muted
                      loop
                      playsInline
                      preload="none"
                      poster={resolveCatalogImageUrl(slide.image) ?? undefined}
                      src={videoOf(slide) ?? undefined}
                      aria-label={t("home.filmLabel", { name: slide.name })}
                      className="w-full h-full object-cover block"
                    />
                    {slide.slug ? (
                      <SapilLink href={`/products/${slide.slug}`} className={cx(SHOP_PILL, "!left-[10px] !right-[10px] !bottom-[10px] !text-[12px]")}>
                        <span>
                          {slide.name}
                          {(() => {
                            const p = parseShopablePrice(slide);
                            return p.price != null ? ` · ${price(p.price, p.currency)}` : "";
                          })()}
                        </span>
                        <span aria-hidden="true" className={SHOP_PILL_GO}>
                          <ArrowIcon strokeWidth={2} />
                        </span>
                      </SapilLink>
                    ) : null}
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}

/**
 * Instagram reels (v9 `.social`): phone-style reels; the focused one plays (muted,
 * only while the row is in view and motion is allowed), then hands over to the next.
 */
export function HomeReels({ heading }: { heading: string | null }) {
  const t = useSapilCopy();
  const headingId = useId();
  const { slides, isReady } = useShopableVideo();
  const reels = slides.filter((s) => videoOf(s));
  const { ref, inView } = useInView<HTMLDivElement>(0.35);
  const [k, setK] = useState(0);
  const [sound, setSound] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [userPlay, setUserPlay] = useState(false);
  const videos = useRef<Array<HTMLVideoElement | null>>([]);
  const settle = useRef<number | null>(null);
  const brand = getBrand();
  const instagram = brand.social?.instagram ?? null;

  const scrollToReel = (n: number) => {
    const row = ref.current;
    const el = row?.children[n] as HTMLElement | undefined;
    if (!row || !el) return;
    const pad = parseFloat(getComputedStyle(row).paddingInlineStart) || 0;
    const rtl = getComputedStyle(row).direction === "rtl";
    const left = rtl ? -(row.scrollWidth - el.offsetLeft - el.offsetWidth - pad) : el.offsetLeft - pad;
    row.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const focus = (n: number, scroll = true) => {
    const next = ((n % reels.length) + reels.length) % reels.length;
    videos.current[k]?.pause();
    const v = videos.current[next];
    if (v) v.currentTime = 0;
    setK(next);
    if (scroll) scrollToReel(next);
  };

  useEffect(() => {
    const v = videos.current[k];
    videos.current.forEach((other, i) => {
      if (i !== k) other?.pause();
    });
    if (!v) return;
    v.muted = !sound;
    if ((inView && !prefersReducedMotion()) || userPlay) {
      v.preload = "auto";
      void v.play().catch(() => {});
    } else v.pause();
  }, [k, inView, sound, userPlay]);

  useEffect(
    () => () => {
      if (settle.current) window.clearTimeout(settle.current);
    },
    [],
  );

  if (!isReady || !reels.length) return null;

  const onScroll = () => {
    if (settle.current) window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const row = ref.current;
      if (!row) return;
      const start = row.getBoundingClientRect();
      const rtl = getComputedStyle(row).direction === "rtl";
      const pad = parseFloat(getComputedStyle(row).paddingInlineStart) || 0;
      let best = k;
      let gap = Infinity;
      Array.from(row.children).forEach((child, i) => {
        const r = (child as HTMLElement).getBoundingClientRect();
        const d = rtl ? Math.abs(start.right - pad - r.right) : Math.abs(r.left - start.left - pad);
        if (d < gap) {
          gap = d;
          best = i;
        }
      });
      if (best !== k) focus(best, false);
    }, 140);
  };

  return (
    <section
      id="social"
      aria-labelledby={headingId}
      className="py-[64px] max-900:py-[48px] overflow-hidden bg-[linear-gradient(135deg,var(--sapil-p-lilac)_0%,var(--sapil-p-pink)_50%,var(--sapil-p-butter)_100%)]"
    >
      <Wrap>
        <SectionHead
          id={headingId}
          eyebrow={heading ?? t("home.reelsEyebrow")}
          title={t("home.reelsTitle")}
          accent={t("home.reelsAccent")}
          actions={
            <div className="flex gap-[16px] items-center flex-wrap">
              {instagram ? (
                <Button href={instagram} LinkComponent={SapilLink} className="[&_svg]:w-[18px] [&_svg]:h-[18px]">
                  <InstagramIcon />
                  {t("home.reelsFollow")}
                </Button>
              ) : null}
              <RailControls
                atStart={false}
                atEnd={false}
                prev={() => focus(k - 1)}
                next={() => focus(k + 1)}
                prevLabel={t("home.reelPrev")}
                nextLabel={t("home.reelNext")}
              />
            </div>
          }
        />
      </Wrap>
      <div
        ref={ref}
        onScroll={onScroll}
        role="region"
        aria-roledescription={t("home.carousel")}
        aria-label={t("home.reelsLabel")}
        className="relative flex items-center gap-[28px] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-[28px] pb-[36px] px-[max(var(--sapil-gut),calc((100vw-var(--sapil-wrap))/2+var(--sapil-gut)))] scroll-px-[max(var(--sapil-gut),calc((100vw-var(--sapil-wrap))/2+var(--sapil-gut)))] max-900:gap-[16px] max-900:pt-[20px] max-900:pb-[32px] max-900:px-sapil-gut max-900:scroll-px-sapil-gut"
      >
        {reels.map((slide, i) => {
          const on = i === k;
          return (
            <article
              key={slide.productId}
              aria-label={t("home.reelOf", { n: i + 1, total: reels.length, name: slide.name })}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a,button")) return;
                if (!on) focus(i);
              }}
              className={cx(
                "relative flex-[0_0_270px] h-[560px] bg-sapil-white rounded-[44px] p-[10px] text-start snap-start origin-left rtl:origin-right [transition:transform_.55s_var(--sapil-ease),opacity_.4s,box-shadow_.4s] max-900:flex-[0_0_230px] max-900:h-[470px] max-900:rounded-[38px]",
                "before:content-[''] before:absolute before:top-[20px] before:left-1/2 before:w-[76px] before:h-[20px] before:-ml-[38px] before:rounded-full before:bg-sapil-sand before:z-[5]",
                on
                  ? "[transform:scale(1.04)] opacity-100 shadow-[0_2px_4px_rgba(90,60,90,.06),0_40px_80px_-30px_rgba(120,70,110,.5)]"
                  : "[transform:scale(.9)] opacity-[.85] hover:opacity-100 cursor-pointer shadow-[0_2px_4px_rgba(90,60,90,.05),0_24px_50px_-30px_rgba(120,70,110,.4)]",
              )}
            >
              <div className="relative h-full rounded-[34px] overflow-hidden bg-sapil-sand max-900:rounded-[29px]">
                <video
                  ref={(el) => {
                    videos.current[i] = el;
                  }}
                  muted
                  playsInline
                  preload={i === 0 ? "metadata" : "none"}
                  poster={resolveCatalogImageUrl(slide.image) ?? undefined}
                  src={videoOf(slide) ?? undefined}
                  aria-label={t("home.reelVideoLabel", { name: slide.name })}
                  onPlay={() => on && setPlaying(true)}
                  onPause={() => on && setPlaying(false)}
                  onEnded={() => on && focus(k + 1)}
                  className="w-full h-full object-cover block bg-sapil-sand"
                />
                <div className="absolute top-[60px] left-[14px] right-[14px] flex items-center gap-[8px] z-[4] text-sapil-white text-[13px] font-[600] [text-shadow:0_1px_6px_rgba(0,0,0,.35)]">
                  <span className="w-[30px] h-[30px] rounded-full bg-sapil-white grid place-items-center shadow-[0_0_0_2px_var(--sapil-rose-2)] flex-none">
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny brand mark */}
                    <img src={brand.logo.src} alt="" className="w-[22px] h-auto" />
                  </span>
                  {t("home.reelsBrand")}
                  <small className="ms-auto text-[11px] font-[600] tracking-[.06em] bg-[rgba(255,255,255,.25)] backdrop-blur-[6px] rounded-full py-[3px] px-[9px]">
                    {t("home.reelTag")}
                  </small>
                </div>
                <button
                  type="button"
                  tabIndex={on ? 0 : -1}
                  aria-label={sound ? t("home.reelMute") : t("home.reelSound")}
                  onClick={() => setSound((s) => !s)}
                  className={cx(
                    "absolute top-[96px] end-[12px] z-[4] w-[34px] h-[34px] rounded-full bg-[rgba(255,255,255,.28)] backdrop-blur-[6px] text-sapil-white grid place-items-center [transition:opacity_.3s,background_.2s] hover:bg-[rgba(255,255,255,.45)] [&_svg]:w-[18px] [&_svg]:h-[18px]",
                    on ? "opacity-100" : "opacity-0 pointer-events-none",
                  )}
                >
                  {sound ? <SoundIcon /> : <MutedIcon />}
                </button>
                <button
                  type="button"
                  tabIndex={on ? 0 : -1}
                  aria-label={on && playing ? t("home.reelPause") : t("home.reelPlay")}
                  onClick={() => {
                    if (!on) {
                      focus(i);
                      return;
                    }
                    const v = videos.current[i];
                    if (!v) return;
                    if (v.paused) {
                      setUserPlay(true);
                      void v.play().catch(() => {});
                    } else v.pause();
                  }}
                  className={cx(
                    "absolute left-1/2 top-[44%] w-[60px] h-[60px] -mt-[30px] -ml-[30px] rounded-full bg-[rgba(255,255,255,.9)] grid place-items-center z-[4] shadow-[0_10px_24px_-10px_rgba(0,0,0,.4)] [transition:opacity_.3s,transform_.3s_var(--sapil-ease)] [&_svg]:w-[22px] [&_svg]:h-[22px] [&_svg]:ml-[3px]",
                    on && playing && "opacity-0 [transform:scale(.6)] focus-visible:opacity-100",
                  )}
                >
                  <PlayIcon />
                </button>
                <div
                  aria-hidden="true"
                  className={cx(
                    "absolute end-[12px] bottom-[118px] z-[4] flex flex-col gap-[16px] text-sapil-white [filter:drop-shadow(0_1px_4px_rgba(0,0,0,.4))] [transition:opacity_.3s] [&_svg]:w-[24px] [&_svg]:h-[24px]",
                    on ? "opacity-100" : "opacity-0",
                  )}
                >
                  <HeartIcon />
                  <ChatIcon />
                  <SendIcon />
                </div>
                {slide.slug ? (
                  <SapilLink href={`/products/${slide.slug}`} tabIndex={on ? 0 : -1} className={SHOP_PILL}>
                    <span>{t("home.reelShop", { name: slide.name })}</span>
                    <span aria-hidden="true" className={SHOP_PILL_GO}>
                      <ArrowIcon strokeWidth={2} />
                    </span>
                  </SapilLink>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
