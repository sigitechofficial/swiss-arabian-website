import Image from "next/image";

import { blogHero } from "../data/blogContent";

/** Figma Blog hero — overlay + centered copy (796:6680) */
export function BlogHero() {
  return (
    <section
      className="relative flex h-[300px] w-full flex-col items-center justify-center overflow-hidden sm:h-[360px] lg:h-[420px]"
      aria-label={blogHero.title}
    >
      <Image
        src={blogHero.image}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-[rgba(44,36,29,0.62)]"
        aria-hidden
      />
      <div className="relative z-[1] mx-auto flex max-w-[760px] flex-col items-center gap-3 px-6 text-center sm:gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold sm:text-[12px] sm:tracking-[0.36em]">
          {blogHero.eyebrow}
        </p>
        <h1 className="font-sans text-[clamp(2.25rem,6vw,3.5rem)] font-normal leading-none text-white">
          {blogHero.title}
        </h1>
        <p className="max-w-[520px] text-[12px] font-semibold leading-relaxed text-white sm:text-[13px]">
          {blogHero.subtitle}
        </p>
      </div>
    </section>
  );
}
