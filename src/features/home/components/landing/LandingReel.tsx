"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { useShopableVideo } from "@/features/merchandising";
import type { ShopableVideoSlide } from "@/features/merchandising/types/merch";
import { parseShopablePrice } from "@/features/merchandising/utils/playableShopableSlides";
import { formatMoney } from "../../utils/formatMoney";
import { pageContainer } from "@/styles/siteChrome";

function slideKey(slide: ShopableVideoSlide, index: number): string {
  return `${slide.productId}-${slide.sku ?? slide.slug ?? "slide"}-${index}`;
}

const reelSection =
  "overflow-hidden bg-[var(--cream,#faf6ee)] pt-[clamp(2.75rem,6vw,4.5rem)] pb-2 min-[750px]:pb-3";

const reelHeading =
  "m-0 font-display text-[clamp(1.6rem,3vw,2.35rem)] leading-[1.12] font-medium tracking-[0.005em] text-[var(--ink,#241f1b)]";

const reelMark = "mx-auto -mt-1 mb-1 block w-fit max-w-full min-[750px]:mb-2";

const reelMarkSvg = "ms-auto block w-40 max-w-[70%] overflow-visible min-[750px]:w-[220px]";

const reelMarkPath =
  "fill-none stroke-[var(--gold,#b98a4b)] [stroke-width:3] [stroke-linecap:round] [stroke-miterlimit:10] [stroke-dasharray:1000] [stroke-dashoffset:1000] animate-[csDrawLine_1s_ease_0.3s_forwards] min-[750px]:[stroke-width:4] motion-reduce:animate-none";

const reelWrap =
  "relative overflow-visible before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-[4] before:w-[clamp(20px,3vw,36px)] before:bg-[linear-gradient(to_right,var(--cream,#faf6ee)_0%,rgb(250_246_238/0.35)_45%,rgb(250_246_238/0)_100%)] before:content-[''] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-[4] after:w-[clamp(20px,3vw,36px)] after:bg-[linear-gradient(to_left,var(--cream,#faf6ee)_0%,rgb(250_246_238/0.35)_45%,rgb(250_246_238/0)_100%)] after:content-['']";

const reelArrow =
  "absolute top-[42%] z-[5] flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/55 bg-white p-0 text-[#202124] shadow-[0_12px_30px_rgba(0,0,0,0.12)] min-[750px]:size-[54px] [&_svg]:block [&_svg]:size-[48%]";

const reelSlider =
  "flex w-full touch-pan-x items-end gap-[18px] overflow-x-auto overflow-y-hidden overscroll-x-contain px-0 pt-9 pb-7 [scrollbar-width:none] snap-x snap-mandatory scroll-smooth min-[750px]:gap-7 min-[750px]:pt-10 min-[750px]:pb-5 motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden";

const reelCard =
  "group/card w-[74%] shrink-0 snap-center overflow-visible min-[750px]:w-[248px] min-[750px]:max-w-[248px]";

const reelMedia =
  "relative aspect-[1/1.2] w-full origin-bottom scale-100 overflow-hidden rounded-2xl bg-[#f5f2ec] transition-transform duration-[450ms] ease-[ease] group-data-[active=true]/card:scale-110 min-[750px]:rounded-[18px] min-[750px]:group-data-[active=true]/card:scale-[1.14] motion-reduce:transition-none";

const reelVideo = "block size-full object-cover object-[center_18%]";

const reelControls =
  "absolute bottom-3 left-3 z-[4] flex translate-y-2 gap-2 opacity-0 transition-[opacity,transform] duration-[250ms] group-hover/card:translate-y-0 group-hover/card:opacity-100 group-data-[active=true]/card:translate-y-0 group-data-[active=true]/card:opacity-100 min-[750px]:translate-y-0 min-[750px]:opacity-100 motion-reduce:transition-none";

const reelControl =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-white/92 p-0 text-[#202124] shadow-[0_12px_26px_rgba(0,0,0,0.16)] min-[750px]:size-[34px] [&_svg]:size-[46%]";

const reelProduct =
  "mt-2 flex items-center gap-2 rounded-[14px] border border-[#e2e2e2] bg-white px-2.5 py-1.5 text-start text-[var(--ink,#241f1b)] no-underline transition-[transform,border-color] duration-300 hover:-translate-y-[3px] hover:border-copper min-[750px]:mt-2.5 min-[750px]:gap-2.5 min-[750px]:px-3 min-[750px]:py-2 motion-reduce:transition-none";

const reelProductImg =
  "size-10 shrink-0 overflow-hidden rounded-full bg-[#f5f2ec] min-[750px]:size-11 [&_img]:block [&_img]:size-full [&_img]:object-contain";

const reelProductTitle =
  "block truncate text-[0.8125rem] leading-[1.15] font-semibold min-[750px]:text-[0.875rem]";

const reelProductPrice =
  "block text-[0.75rem] leading-[1.15] text-[var(--ink-2,#5b5148)] min-[750px]:text-[0.8125rem]";

export function LandingReel() {
  const { slides, sectionTitle, isReady } = useShopableVideo();
  const sliderRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const jumpingRef = useRef(false);
  const setSize = slides.length;
  const looping = setSize > 1;
  const loopSlides = looping ? [...slides, ...slides, ...slides] : slides;
  const startIndex = looping
    ? setSize + Math.max(0, Math.floor((setSize - 1) / 2))
    : Math.max(0, Math.floor((setSize - 1) / 2));
  const [active, setActive] = useState(startIndex);
  const [playing, setPlaying] = useState<Record<number, boolean>>({});
  const [muted, setMuted] = useState<Record<number, boolean>>({});
  const trackCount = loopSlides.length;

  const nearestIndex = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return 0;
    const mid = slider.getBoundingClientRect().left + slider.clientWidth / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const box = card.getBoundingClientRect();
      const dist = Math.abs(box.left + box.width / 2 - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  }, []);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const slider = sliderRef.current;
    const card = cardRefs.current[index];
    if (!slider || !card) return;
    const left = card.offsetLeft - (slider.clientWidth - card.offsetWidth) / 2;
    slider.scrollTo({ left, behavior });
  }, []);

  const playIndex = useCallback(async (index: number) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    videoRefs.current.forEach((video, i) => {
      if (!video || i === index) return;
      video.pause();
      video.muted = true;
    });
    setPlaying((prev) => {
      const next: Record<number, boolean> = {};
      for (let i = 0; i < trackCount; i += 1) {
        next[i] = i === index ? Boolean(prev[i]) : false;
      }
      return next;
    });
    const video = videoRefs.current[index];
    if (!video || reduce) return;
    video.muted = true;
    setMuted((prev) => ({ ...prev, [index]: true }));
    try {
      await video.play();
      setPlaying((prev) => ({ ...prev, [index]: true }));
    } catch {
      setPlaying((prev) => ({ ...prev, [index]: false }));
    }
  }, [trackCount]);

  useEffect(() => {
    setActive(startIndex);
    setPlaying({});
    setMuted({});
  }, [startIndex, trackCount]);

  useEffect(() => {
    if (!trackCount) return;
    const timer = window.setTimeout(() => {
      scrollToIndex(startIndex, "auto");
      void playIndex(startIndex);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [playIndex, scrollToIndex, startIndex, trackCount]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    let frame = 0;
    const onScroll = () => {
      if (jumpingRef.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (jumpingRef.current) return;
        let next = nearestIndex();
        if (looping) {
          if (next < setSize) {
            jumpingRef.current = true;
            next += setSize;
            scrollToIndex(next, "auto");
            window.setTimeout(() => {
              jumpingRef.current = false;
            }, 50);
          } else if (next >= setSize * 2) {
            jumpingRef.current = true;
            next -= setSize;
            scrollToIndex(next, "auto");
            window.setTimeout(() => {
              jumpingRef.current = false;
            }, 50);
          }
        }
        setActive((current) => {
          if (current === next) return current;
          void playIndex(next);
          return next;
        });
      });
    };
    slider.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      slider.removeEventListener("scroll", onScroll);
    };
  }, [looping, nearestIndex, playIndex, scrollToIndex, setSize, trackCount]);

  if (!isReady || !slides.length) return null;

  const step = (direction: number) => {
    let next = active + direction;
    if (looping) {
      if (next < 0) next = setSize * 2 - 1;
      if (next >= trackCount) next = setSize;
    } else {
      next = Math.min(setSize - 1, Math.max(0, next));
    }
    setActive(next);
    scrollToIndex(next);
    void playIndex(next);
  };

  const togglePlay = async (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;
    if (video.paused) {
      setActive(index);
      scrollToIndex(index);
      video.muted = muted[index] !== false;
      try {
        await video.play();
        setPlaying((prev) => ({ ...prev, [index]: true }));
      } catch {
        setPlaying((prev) => ({ ...prev, [index]: false }));
      }
      return;
    }
    video.pause();
    setPlaying((prev) => ({ ...prev, [index]: false }));
  };

  const toggleMute = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted((prev) => ({ ...prev, [index]: nextMuted }));
  };

  return (
    <section id="scent-reel" className={reelSection} aria-label={sectionTitle}>
      <div className={`${pageContainer} text-center`}>
        <h2 className={reelHeading}>{sectionTitle}</h2>
        <div className={reelMark} aria-hidden="true">
          <svg className={reelMarkSvg} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 445 190.1" fill="none">
            <path
              className={reelMarkPath}
              d="M60.8,92.3c0,0,160-21.3,323.2-3.6c0.3,0,0.3,0.5,0,0.5c-34-0.3-240.7-1.2-286.2,12.4c-0.5,0.1-0.3,0.8,0.2,0.8 c21.6-1.8,142.1-11,190.6,5.9"
            />
          </svg>
        </div>

        <div className={reelWrap}>
          {slides.length > 1 ? (
            <button className={`${reelArrow} left-2 min-[750px]:left-9`} type="button" onClick={() => step(-1)} aria-label="Previous video">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 18L9 12L15 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}

          <div className={reelSlider} ref={sliderRef} aria-label={sectionTitle}>
            {loopSlides.map((slide, index) => {
              const isActive = active === index;
              const isPlaying = Boolean(playing[index]);
              const isMuted = muted[index] !== false;
              const imageUrl = resolveCatalogImageUrl(slide.image);
              const { price, currency } = parseShopablePrice(slide);
              const href = slide.slug?.trim() ? `/products/${slide.slug.trim()}` : null;
              const videoUrl = slide.video?.url?.trim() ?? "";
              const productInner = (
                <>
                  <span className={reelProductImg}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="" width={66} height={66} />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={reelProductTitle}>{slide.name}</span>
                    <span className={reelProductPrice}>{formatMoney(price, currency)}</span>
                  </span>
                </>
              );

              return (
                <article
                  key={slideKey(slide, index)}
                  className={reelCard}
                  data-active={isActive ? "true" : undefined}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                >
                  <div className={reelMedia}>
                    <video
                      className={reelVideo}
                      ref={(node) => {
                        videoRefs.current[index] = node;
                      }}
                      muted
                      loop
                      playsInline
                      preload={index === startIndex ? "metadata" : "none"}
                      poster={imageUrl ?? undefined}
                      src={videoUrl}
                      onPlay={() => setPlaying((prev) => ({ ...prev, [index]: true }))}
                      onPause={() => setPlaying((prev) => ({ ...prev, [index]: false }))}
                    />
                    <div className={reelControls}>
                      <button
                        className={reelControl}
                        type="button"
                        aria-label={isPlaying ? "Pause video" : "Play video"}
                        onClick={() => void togglePlay(index)}
                      >
                        <svg className={isPlaying ? "hidden" : "block"} viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor" />
                        </svg>
                        <svg className={isPlaying ? "block" : "hidden"} viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M7 5h3.4v14H7V5Zm6.6 0H17v14h-3.4V5Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        className={reelControl}
                        type="button"
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                        onClick={() => toggleMute(index)}
                      >
                        <svg className={isMuted ? "hidden" : "block"} viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4.5 9.5v5h3.2l4.4 3.6c.6.5 1.4.1 1.4-.7V6.6c0-.8-.9-1.2-1.4-.7L7.7 9.5H4.5Z" fill="currentColor" />
                          <path d="M16.5 8.2c1.1 1 1.7 2.3 1.7 3.8s-.6 2.8-1.7 3.8M18.8 5.8c1.7 1.6 2.7 3.8 2.7 6.2s-1 4.6-2.7 6.2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                        </svg>
                        <svg className={isMuted ? "block" : "hidden"} viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4.5 9.5v5h3.2l4.4 3.6c.6.5 1.4.1 1.4-.7V6.6c0-.8-.9-1.2-1.4-.7L7.7 9.5H4.5Z" fill="currentColor" />
                          <path d="M17 9l4 4m0-4l-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {href ? (
                    <LocaleLink className={reelProduct} href={href}>
                      {productInner}
                    </LocaleLink>
                  ) : (
                    <div className={reelProduct}>{productInner}</div>
                  )}
                </article>
              );
            })}
          </div>

          {slides.length > 1 ? (
            <button className={`${reelArrow} right-2 min-[750px]:right-9`} type="button" onClick={() => step(1)} aria-label="Next video">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6L15 12L9 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
