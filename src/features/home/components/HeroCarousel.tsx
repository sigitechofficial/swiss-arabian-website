"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import {
  HERO_SLIDE_MS,
  HERO_SLIDES,
  HERO_SLIDES_MOBILE,
} from "@/features/home/constants/homeAssets";
import { useIsMobile } from "@/hooks/useIsMobile";
import { easeOutExpo } from "@/lib/motion/variants";

/** Desktop landscape creatives — slightly taller than source 3840×1000 */
const ASPECT_DESKTOP = "3840 / 1280";
/** Mobile portrait creatives (≈535×690) */
const ASPECT_MOBILE = "535 / 690";
/** Match Tailwind `md` */
const MOBILE_BREAKPOINT = 767;
const FADE_MS = 1.15;

type HeroSlide = {
  id: string;
  src: string;
  alt: string;
  href: string;
};

/**
 * Home hero — portrait banners below `md`, landscape from `md` up.
 * Both frames mount so aspect ratio is correct before JS hydration.
 */
export function HeroCarousel() {
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  return (
    <>
      <div className="md:hidden">
        <HeroCarouselFrame
          slides={HERO_SLIDES_MOBILE}
          aspect={ASPECT_MOBILE}
          sizes="(max-width: 767px) calc(100vw - 32px), 535px"
          active={isMobile}
        />
      </div>
      <div className="hidden md:block">
        <HeroCarouselFrame
          slides={HERO_SLIDES}
          aspect={ASPECT_DESKTOP}
          sizes="(max-width: 1280px) calc(100vw - 48px), 1200px"
          active={!isMobile}
        />
      </div>
    </>
  );
}

function HeroCarouselFrame({
  slides,
  aspect,
  sizes,
  active: frameActive,
}: {
  slides: readonly HeroSlide[];
  aspect: string;
  sizes: string;
  active: boolean;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const regionRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % slides.length) + slides.length) % slides.length;
      setActive(next);
      setProgressKey((key) => key + 1);
    },
    [slides.length],
  );

  const goNext = useEffectEvent(() => {
    goTo(active + 1);
  });

  const goPrev = useEffectEvent(() => {
    goTo(active - 1);
  });

  useEffect(() => {
    if (!frameActive || paused || reduce || slides.length < 2) return;
    const id = window.setInterval(() => goNext(), HERO_SLIDE_MS);
    return () => window.clearInterval(id);
  }, [frameActive, paused, reduce, slides.length, active]);

  useEffect(() => {
    const node = regionRef.current;
    if (!node) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    }

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, []);

  const slide = slides[active] ?? slides[0];

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      tabIndex={frameActive ? 0 : -1}
      aria-hidden={!frameActive}
      className="group/hero relative outline-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className="relative w-full overflow-hidden bg-cream dark:bg-section-soft"
        style={{ aspectRatio: aspect }}
      >
        {slides.map((item, index) => {
          const isActive = index === active;
          return (
            <motion.div
              key={item.id}
              className="absolute inset-0 will-change-[opacity,transform]"
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                scale: reduce ? 1 : isActive ? 1 : 1.025,
              }}
              transition={{
                opacity: {
                  duration: reduce ? 0 : FADE_MS,
                  ease: "easeInOut",
                },
                scale: {
                  duration: reduce ? 0 : FADE_MS,
                  ease: easeOutExpo,
                },
              }}
              style={{
                zIndex: isActive ? 2 : 1,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <Link
                href={item.href}
                className="relative block h-full w-full"
                tabIndex={frameActive && isActive ? 0 : -1}
                aria-hidden={!isActive}
                aria-label={item.alt}
              >
                <Image
                  src={item.src}
                  alt={isActive ? item.alt : ""}
                  fill
                  priority={index < 2}
                  quality={90}
                  sizes={sizes}
                  className="object-cover object-center"
                />
              </Link>
            </motion.div>
          );
        })}

        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-1.5 sm:px-3">
          <CarouselArrow
            label="Previous offer"
            direction="prev"
            onClick={goPrev}
            reduce={!!reduce}
          />
          <CarouselArrow
            label="Next offer"
            direction="next"
            onClick={goNext}
            reduce={!!reduce}
          />
        </div>

        <div
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4"
          role="tablist"
          aria-label="Offer slides"
        >
          {slides.map((item, index) => {
            const isActive = index === active;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Offer ${index + 1} of ${slides.length}`}
                tabIndex={frameActive ? undefined : -1}
                onClick={() => goTo(index)}
                className={`relative h-1 overflow-hidden transition-[width,background-color] duration-300 ease-out ${
                  isActive
                    ? "w-8 bg-white/35"
                    : "w-1.5 bg-white/45 hover:bg-white/70"
                }`}
              >
                {isActive ? (
                  reduce ? (
                    <span className="absolute inset-0 bg-white" />
                  ) : (
                    <motion.span
                      key={progressKey}
                      className="absolute inset-y-0 left-0 bg-white"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: HERO_SLIDE_MS / 1000,
                        ease: "linear",
                      }}
                    />
                  )
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {active + 1} of {slides.length}: {slide.alt}
      </p>
    </div>
  );
}

function CarouselArrow({
  label,
  direction,
  onClick,
  reduce,
}: {
  label: string;
  direction: "prev" | "next";
  onClick: () => void;
  reduce: boolean;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={reduce ? undefined : { x: direction === "next" ? 2 : -2 }}
      whileTap={reduce ? undefined : { scale: 0.94 }}
      transition={{ duration: 0.22, ease: easeOutExpo }}
      className="pointer-events-auto flex size-14 items-center justify-center text-white/85 transition-colors duration-200 hover:text-white focus-visible:text-white focus-visible:outline-none sm:size-16"
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        aria-hidden
        className={`drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] ${
          direction === "prev" ? "rotate-180" : ""
        }`}
      >
        <path
          d="M11 6 20 15 11 24"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}
