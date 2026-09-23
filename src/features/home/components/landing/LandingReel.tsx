"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { useShopableVideo } from "@/features/merchandising";
import type { ShopableVideoSlide } from "@/features/merchandising/types/merch";
import { parseShopablePrice } from "@/features/merchandising/utils/playableShopableSlides";
import { formatMoney } from "../../utils/formatMoney";

function slideKey(slide: ShopableVideoSlide, index: number): string {
  return `${slide.productId}-${slide.sku ?? slide.slug ?? "slide"}-${index}`;
}

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
    <section id="scent-reel" className="reel-section" aria-label={sectionTitle}>
      <div className="container cs-container">
        <h2 className="cs-heading">{sectionTitle}</h2>
        <div className="cs-svg-wrap" aria-hidden="true">
          <svg className="cs-heading-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 445 190.1" fill="none">
            <path
              className="cs-heading-path"
              d="M60.8,92.3c0,0,160-21.3,323.2-3.6c0.3,0,0.3,0.5,0,0.5c-34-0.3-240.7-1.2-286.2,12.4c-0.5,0.1-0.3,0.8,0.2,0.8 c21.6-1.8,142.1-11,190.6,5.9"
            />
          </svg>
        </div>

        <div className="cs-slider-wrap">
          {slides.length > 1 ? (
            <button className="cs-arrow cs-arrow-prev" type="button" onClick={() => step(-1)} aria-label="Previous video">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 18L9 12L15 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}

          <div className="cs-slider" ref={sliderRef} aria-label={sectionTitle}>
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
                  <span className="cs-product-img">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" width={66} height={66} />
                    ) : null}
                  </span>
                  <span className="cs-product-info">
                    <span className="cs-product-title">{slide.name}</span>
                    <span className="cs-product-price">{formatMoney(price, currency)}</span>
                  </span>
                </>
              );

              return (
                <article
                  key={slideKey(slide, index)}
                  className={isActive ? "cs-card is-active" : "cs-card"}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                >
                  <div className="cs-media">
                    <video
                      className="cs-video"
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
                    <div className="cs-controls">
                      <button
                        className={isPlaying ? "cs-control cs-play-pause is-playing" : "cs-control cs-play-pause"}
                        type="button"
                        aria-label={isPlaying ? "Pause video" : "Play video"}
                        onClick={() => void togglePlay(index)}
                      >
                        <svg className="cs-icon cs-icon-play" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M8 5.5v13l11-6.5L8 5.5Z" fill="currentColor" />
                        </svg>
                        <svg className="cs-icon cs-icon-pause" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M7 5h3.4v14H7V5Zm6.6 0H17v14h-3.4V5Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        className={isMuted ? "cs-control cs-mute is-muted" : "cs-control cs-mute"}
                        type="button"
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                        onClick={() => toggleMute(index)}
                      >
                        <svg className="cs-icon cs-icon-sound-on" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4.5 9.5v5h3.2l4.4 3.6c.6.5 1.4.1 1.4-.7V6.6c0-.8-.9-1.2-1.4-.7L7.7 9.5H4.5Z" fill="currentColor" />
                          <path d="M16.5 8.2c1.1 1 1.7 2.3 1.7 3.8s-.6 2.8-1.7 3.8M18.8 5.8c1.7 1.6 2.7 3.8 2.7 6.2s-1 4.6-2.7 6.2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                        </svg>
                        <svg className="cs-icon cs-icon-sound-off" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4.5 9.5v5h3.2l4.4 3.6c.6.5 1.4.1 1.4-.7V6.6c0-.8-.9-1.2-1.4-.7L7.7 9.5H4.5Z" fill="currentColor" />
                          <path d="M17 9l4 4m0-4l-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {href ? (
                    <Link className="cs-product" href={href}>
                      {productInner}
                    </Link>
                  ) : (
                    <div className="cs-product">{productInner}</div>
                  )}
                </article>
              );
            })}
          </div>

          {slides.length > 1 ? (
            <button className="cs-arrow cs-arrow-next" type="button" onClick={() => step(1)} aria-label="Next video">
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
