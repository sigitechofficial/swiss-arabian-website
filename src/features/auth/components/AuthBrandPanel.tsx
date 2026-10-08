"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useState } from "react";
import {
  AUTH_BRAND_PILLS,
  AUTH_BRAND_SLIDE_MS,
  AUTH_BRAND_SLIDES,
  authAssets,
} from "../constants/authAssets";
import { authCopyVariants, easeOutExpo } from "@/lib/motion/variants";

/** Fixed full-height brand column — synced image + copy with Framer Motion */
export function AuthBrandPanel() {
  const slides = AUTH_BRAND_SLIDES;
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const copy = slides[active] ?? slides[0];

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, AUTH_BRAND_SLIDE_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <aside className="relative hidden w-1/2 shrink-0 lg:block">
      <div className="fixed inset-y-0 left-0 flex h-dvh w-1/2 flex-col justify-between overflow-hidden p-12 xl:p-14">
        <div className="absolute inset-0" aria-hidden>
          {slides.map((slide, index) => {
            const isActive = index === active;
            return (
              <motion.div
                key={slide.image}
                className="absolute inset-0"
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  scale: reduce ? 1 : isActive ? 1.05 : 1,
                }}
                transition={{
                  opacity: { duration: 1.05, ease: "easeInOut" },
                  scale: {
                    duration: isActive ? AUTH_BRAND_SLIDE_MS / 1000 : 1.05,
                    ease: "linear",
                  },
                }}
              >
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  priority={index === 0}
                  quality={95}
                  sizes="50vw"
                  className="object-cover object-center"
                />
              </motion.div>
            );
          })}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/30" />
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.1 }}
        >
          <Link
            href="/"
            className="relative z-1 block h-14 w-44 xl:h-16 xl:w-52"
            aria-label="Swiss Arabian home"
          >
            <Image
              src={authAssets.logo}
              alt=""
              fill
              className="site-logo-on-dark object-contain object-left"
              sizes="(min-width: 1280px) 208px, 176px"
            />
          </Link>
        </motion.div>

        <div className="relative z-1 min-h-[11.5rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="flex max-w-lg flex-col gap-3.5 text-white"
              variants={authCopyVariants}
              initial={reduce ? false : "initial"}
              animate="animate"
              exit={reduce ? undefined : "exit"}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/80">
                {copy.eyebrow}
              </p>
              <h2 className="font-sans text-[clamp(1.875rem,2.6vw,2.25rem)] font-medium leading-[1.07] tracking-[-0.02em]">
                {copy.headline}
              </h2>
              <p className="text-base leading-relaxed text-white/88 xl:text-[17px]">
                {copy.body}
              </p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {AUTH_BRAND_PILLS.map((label) => (
                  <li
                    key={label}
                    className="rounded-full border border-white/28 bg-white/14 px-3 py-2 text-[12px] text-white"
                  >
                    {label}
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
