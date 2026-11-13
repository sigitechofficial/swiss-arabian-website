"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useStorefrontLogo } from "@/lib/storefront/StorefrontHostProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

/** Mirrors the reference auth pages (`/login`, `/register`, `/forgot-password`)
 *  on the production storefront — a slow, auto-rotating brand slideshow with
 *  crossfading kicker/heading/body captions, tied loosely to 4 hero shots. */
// Wording: `auth.slide<n>.*` and `auth.badge.*` in `src/messages`.
const SLIDES = [
  { image: "/assets/auth/brand-slide-1.png", copy: "auth.slide1" },
  { image: "/assets/auth/brand-slide-6.png", copy: "auth.slide2" },
  { image: "/assets/auth/brand-slide-5.png", copy: "auth.slide3" },
  { image: "/assets/auth/brand-slide-4.png", copy: "auth.slide4" },
] as const;

const BADGES: readonly MessageKey[] = ["auth.badge.since", "auth.badge.genuine", "auth.badge.samples"];

const SLIDE_INTERVAL_MS = 6000;

export function AuthVisualPanel() {
  const logo = useStorefrontLogo();
  const t = useShopCopy();
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
      <div className="fixed inset-y-0 start-0 flex h-dvh w-1/2 flex-col justify-between overflow-hidden p-12 xl:p-14">
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

        <LocaleLink
          className="relative z-1 block h-14 w-44 xl:h-16 xl:w-52"
          aria-label={t("auth.homeAria", { brand: logo.name })}
          href="/"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt=""
            className="h-full w-full object-contain object-left rtl:object-right [filter:brightness(0)_invert(0.93)_sepia(0.12)]"
          />
        </LocaleLink>

        <div className="relative z-1 min-h-[11.5rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.copy}
              className="flex max-w-lg flex-col gap-3.5 text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">
                {t(`${slide.copy}.kicker` as MessageKey)}
              </p>
              <h2 className="font-sans text-[clamp(1.875rem,2.6vw,2.25rem)] font-medium leading-[1.07] tracking-[-0.02em]">
                {t(`${slide.copy}.heading` as MessageKey)}
              </h2>
              <p className="text-base leading-relaxed text-white/88 xl:text-[17px]">{t(`${slide.copy}.body` as MessageKey)}</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {BADGES.map((badge) => (
                  <li
                    key={badge}
                    className="rounded-full border border-white/28 bg-white/14 px-3 py-2 text-[12px] text-white"
                  >
                    {t(badge)}
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
