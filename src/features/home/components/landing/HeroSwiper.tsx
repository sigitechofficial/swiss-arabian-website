"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HERO_SLIDES } from "../../constants/heroSlides";

const AUTOPLAY_MS = 5500;

export function HeroSwiper() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideCount = HERO_SLIDES.length;

  // Preload every slide up front so autoplay never advances to an
  // image that hasn't finished downloading yet (which showed as a
  // blank/dark frame during the crossfade).
  useEffect(() => {
    HERO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || prefersReducedMotion) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % slideCount);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, prefersReducedMotion, slideCount]);

  return (
    <div
      className="hero-swiper"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={HERO_SLIDES[index].id}
          className="hero-swiper__slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 1.8, ease: "easeInOut" }}
        >
          <img
            src={HERO_SLIDES[index].image}
            alt={HERO_SLIDES[index].alt}
            className="hero-swiper__img"
            style={{ objectPosition: HERO_SLIDES[index].objectPosition }}
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        className="hero-swiper__arrow hero-swiper__arrow--prev"
        aria-label="Previous slide"
        onClick={goPrev}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        className="hero-swiper__arrow hero-swiper__arrow--next"
        aria-label="Next slide"
        onClick={goNext}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
