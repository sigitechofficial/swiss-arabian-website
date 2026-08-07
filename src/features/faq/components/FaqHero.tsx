import Image from "next/image";

import { faqHero } from "../data/faqContent";

/** Figma faq-hero — full-bleed image + left title (1047:198 / 1057:220) */
export function FaqHero() {
  return (
    <section
      className="relative flex h-[280px] w-full items-end overflow-hidden sm:h-[360px] lg:h-[420px]"
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
        className="absolute inset-0 bg-gradient-to-b from-[rgba(26,23,15,0.55)] via-[rgba(31,28,18,0.65)] to-[rgba(18,15,10,0.8)]"
        aria-hidden
      />
      <div className="relative z-[1] w-full px-4 pb-10 sm:px-6 sm:pb-12 lg:px-20 lg:pb-14">
        <p className="text-[11px] font-normal uppercase tracking-[0.18em] text-terra sm:text-[12px]">
          {faqHero.eyebrow}
        </p>
        <h1 className="mt-2 font-sans text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.2] text-[#f5f1e8]">
          <span className="block">{faqHero.titleLine1}</span>
          <span className="block">{faqHero.titleLine2}</span>
        </h1>
      </div>
    </section>
  );
}
