"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Mirrors the reference auth pages (`/login`, `/register`, `/forgot-password`)
 *  on the production storefront — a slow, auto-rotating brand slideshow with
 *  crossfading kicker/heading/body captions, tied loosely to 4 hero shots. */
const SLIDES = [
  {
    image: "/assets/auth/brand-slide-1.png",
    kicker: "The house",
    heading: "Scents that travel with you.",
    body: "From first spray to last echo — keep your favourites close and discover what comes next.",
  },
  {
    image: "/assets/auth/brand-slide-6.png",
    kicker: "Crafted",
    heading: "Oud, amber, and beyond.",
    body: "Step into Swiss Arabian — heritage notes, modern wear, and collections made for every journey.",
  },
  {
    image: "/assets/auth/brand-slide-5.png",
    kicker: "Members",
    heading: "Your signature, saved.",
    body: "Sign in to check out faster, follow every order, and keep your favourite oud, amber and florals in one place.",
  },
  {
    image: "/assets/auth/brand-slide-4.png",
    kicker: "Welcome",
    heading: "One account. Every scent.",
    body: "Track orders, revisit what you love, and pick up where you left off — anywhere you shop.",
  },
] as const;

const BADGES = ["Crafted in Dubai since 1974", "Genuine & sealed", "Complimentary samples"];

const SLIDE_INTERVAL_MS = 6000;

export function AuthVisualPanel() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const slide = SLIDES[index];

  return (
    <aside className="relative hidden w-1/2 shrink-0 lg:block">
      <div className="fixed inset-y-0 left-0 flex h-dvh w-1/2 flex-col justify-between overflow-hidden p-12 xl:p-14">
        <div className="absolute inset-0" aria-hidden="true">
          <AnimatePresence>
            <motion.img
              key={slide.image}
              src={slide.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              initial={{ opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/30" />
        </div>

        <Link
          className="relative z-1 block h-14 w-44 xl:h-16 xl:w-52"
          aria-label="Swiss Arabian home"
          href="/"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/sa-logo-clear.png"
            alt=""
            className="h-full w-full object-contain object-left [filter:brightness(0)_invert(0.93)_sepia(0.12)]"
          />
        </Link>

        <div className="relative z-1 min-h-[11.5rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.kicker}
              className="flex max-w-lg flex-col gap-3.5 text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">
                {slide.kicker}
              </p>
              <h2 className="font-sans text-[clamp(1.875rem,2.6vw,2.25rem)] font-medium leading-[1.07] tracking-[-0.02em]">
                {slide.heading}
              </h2>
              <p className="text-base leading-relaxed text-white/88 xl:text-[17px]">{slide.body}</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {BADGES.map((badge) => (
                  <li
                    key={badge}
                    className="rounded-full border border-white/28 bg-white/14 px-3 py-2 text-[12px] text-white"
                  >
                    {badge}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
