import Image from "next/image";

import { faqHero } from "../data/faqContent";

/** Full-bleed image + left-aligned title. */
export function FaqHero() {
  return (
    <section
      className="relative flex h-[260px] w-full items-end overflow-hidden sm:h-[340px] lg:h-[400px]"
      aria-label="Frequently Asked Questions"
    >
      <Image
        src={faqHero.image}
        alt=""
        fill
        priority
        quality={90}
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[rgba(26,23,15,0.5)] via-[rgba(31,28,18,0.6)] to-[rgba(18,15,10,0.8)]"
        aria-hidden
      />
      <div className="relative z-[1] mx-auto w-full max-w-[var(--chrome-content-max)] px-[var(--chrome-edge)] pb-10 sm:pb-12 lg:pb-14 [@media(min-width:1200px)]:px-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#e2b8a6] sm:text-[12px]">
          {faqHero.eyebrow}
        </p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.15] text-[#f5f1e8]">
          <span className="block">{faqHero.titleLine1}</span>
          <span className="block">{faqHero.titleLine2}</span>
        </h1>
      </div>
    </section>
  );
}
