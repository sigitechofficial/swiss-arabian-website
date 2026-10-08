import Image from "next/image";

import { storyHero } from "../data/storyContent";

/** Figma hero-split — East/West overlays + centered plate (944:7468) */
export function StoryHero() {
  return (
    <section
      className="relative h-[400px] w-full overflow-hidden sm:h-[500px] lg:h-[620px]"
      aria-label="Our story"
    >
      <Image
        src={storyHero.image}
        alt=""
        fill
        priority
        quality={90}
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* East half */}
      <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-[rgba(26,19,12,0.72)]">
        <div className="pointer-events-none absolute left-[calc(50%-10px)] top-[19%] hidden size-[min(380px,52vw)] -translate-x-1/2 lg:block">
          <Image
            src={storyHero.ellipseOuter}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="pointer-events-none absolute left-[calc(50%-10px)] top-[29%] hidden size-[min(260px,36vw)] -translate-x-1/2 lg:block">
          <Image
            src={storyHero.ellipseInner}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <p className="absolute bottom-5 left-4 text-[8px] font-bold uppercase tracking-[0.26em] text-cream/45 sm:bottom-6 sm:left-6 sm:text-[9px] lg:left-[120px]">
          {storyHero.eastLabel}
        </p>
      </div>

      {/* West half */}
      <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden bg-[rgba(245,239,229,0.55)]">
        <p className="absolute bottom-5 left-3 text-[8px] font-bold uppercase tracking-[0.26em] text-ink/25 sm:bottom-6 sm:left-5 sm:text-[9px] lg:left-7">
          {storyHero.westLabel}
        </p>
      </div>

      {/* Center plate */}
      <div className="absolute left-1/2 top-1/2 z-[1] w-[min(560px,90vw)] -translate-x-1/2 -translate-y-1/2 border border-[rgba(181,136,62,0.22)] bg-[rgba(28,22,15,0.86)] px-6 py-8 text-center sm:px-10 sm:py-10 lg:px-[52px] lg:py-11">
        <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-gold">
          {storyHero.eyebrow}
        </p>
        <h1 className="mt-3 font-sans text-[clamp(1.75rem,4.2vw,3.25rem)] font-bold uppercase leading-[1.1] tracking-[0.02em] text-white">
          <span className="block">{storyHero.titleLine1}</span>
          <span className="block">{storyHero.titleLine2}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[28rem] text-[12px] leading-[1.85] text-cream/70 sm:text-[13px]">
          {storyHero.subtitle}
        </p>
      </div>
    </section>
  );
}
