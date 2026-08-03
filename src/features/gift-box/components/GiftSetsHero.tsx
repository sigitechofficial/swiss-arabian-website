import Image from "next/image";

import { giftBoxAssets } from "@/features/gift-box/constants/giftBoxAssets";

/** Figma · Page Hero — Gift Sets */
export function GiftSetsHero() {
  return (
    <section
      className="relative flex h-[320px] w-full flex-col items-center justify-center gap-4 overflow-hidden sm:h-[380px] lg:h-[420px]"
      aria-label="Gift Sets"
    >
      <Image
        src={giftBoxAssets.hero}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-[rgba(44,36,29,0.55)]"
        aria-hidden
      />
      <p className="relative z-[1] text-[12px] font-semibold uppercase tracking-[0.42em] text-gold-light">
        Swiss Arabian
      </p>
      <h1 className="relative z-[1] font-sans text-[clamp(2rem,5vw,3.5rem)] font-normal uppercase tracking-[0.24em] text-white">
        Gift Sets
      </h1>
      <p className="relative z-[1] text-[13px] font-semibold uppercase tracking-[0.28em] text-white/75">
        The Art of Gifting
      </p>
    </section>
  );
}
