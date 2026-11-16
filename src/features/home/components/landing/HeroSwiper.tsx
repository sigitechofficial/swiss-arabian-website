"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HERO_SLIDES, type HeroSlide } from "../../constants/heroSlides";
import {
  heroArrow,
  heroArrowNext,
  heroArrowPrev,
  heroImg,
  heroSlide,
  heroSwiper,
} from "@/styles/landingChrome";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { getImageProps } from "next/image";
import { MediaImage } from "@/components/ui/MediaImage";
import { isOptimizableImageSrc } from "@/lib/images/remoteImagePatterns";

const DEFAULT_AUTOPLAY_MS = 5500;
/** The hero spans the full viewport width. */
const HERO_SIZES = "100vw";

export type HeroSwiperProps = {
  slides?: HeroSlide[];
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  showNavigation?: boolean;
};

export function HeroSwiper({
  slides = HERO_SLIDES,
  autoplay = true,
  autoplayIntervalMs = DEFAULT_AUTOPLAY_MS,
  showNavigation = true,
}: HeroSwiperProps = {}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideList = slides.length ? slides : HERO_SLIDES;
  const slideCount = slideList.length;
  const interval = Math.min(30000, Math.max(2000, autoplayIntervalMs));

  // Warm the cache for the other slides once the page is idle, through the
  // optimiser at the same responsive size the slide renders at — so they
  // don't compete with the first slide (the page's LCP image) on load.
  useEffect(() => {
    const rest = slideList.slice(1);
    if (rest.length === 0) return;
    const preload = () => {
      for (const slide of rest) {
        if (!isOptimizableImageSrc(slide.image)) continue;
        const { props } = getImageProps({ src: slide.image, alt: "", fill: true, sizes: HERO_SIZES });
        const img = new Image();
        img.sizes = HERO_SIZES;
        if (props.srcSet) img.srcset = props.srcSet;
        img.src = props.src;
      }
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(preload);
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(preload, 2000);
    return () => window.clearTimeout(id);
  }, [slideList]);
  useResetOnChange(slideCount, () => setIndex(0));

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!autoplay || paused || prefersReducedMotion || slideCount <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % slideCount);
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoplay, paused, prefersReducedMotion, slideCount, interval]);

  const current = slideList[index] ?? slideList[0];
  if (!current) return null;

  return (
    <div
      className={heroSwiper}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={current.id}
          className={heroSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.01 : 1.8,
            ease: "easeInOut",
          }}
        >
          <MediaImage
            src={current.image}
            alt={current.alt}
            className={heroImg}
            style={{ objectPosition: current.objectPosition }}
            draggable={false}
            fill
            sizes={HERO_SIZES}
            loading="eager"
            // Slide 1 is the page's LCP image; the others are warm in the cache.
            fetchPriority={index === 0 ? "high" : undefined}
          />
        </motion.div>
      </AnimatePresence>

      {showNavigation && slideCount > 1 ? (
        <>
          <button
            type="button"
            className={`${heroArrow} ${heroArrowPrev}`}
            aria-label="Previous slide"
            onClick={goPrev}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className={`${heroArrow} ${heroArrowNext}`}
            aria-label="Next slide"
            onClick={goNext}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      ) : null}
    </div>
  );
}
