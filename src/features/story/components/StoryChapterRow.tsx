import Image from "next/image";

import type { StoryChapter } from "../data/storyContent";

/** Figma chapter row — index + copy + bordered figure (944:7484+) */
export function StoryChapterRow({ chapter }: { chapter: StoryChapter }) {
  return (
    <section className="border-b border-sa-border px-4 py-12 sm:px-6 sm:py-14 lg:px-20 lg:py-[72px]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 lg:flex-row lg:items-start lg:gap-11">
        <div className="shrink-0 lg:w-[200px]">
          <p className="font-sans text-[40px] font-bold leading-none text-gold sm:text-[48px] lg:text-[56px]">
            {chapter.index}
          </p>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.28em] text-sa-secondary">
            {chapter.era}
          </p>
        </div>

        <div className="min-w-0 flex-1 lg:max-w-[632px]">
          <h2 className="font-sans text-[22px] font-semibold leading-[1.28] tracking-[-0.01em] text-sa-primary sm:text-[26px]">
            {chapter.title}
          </h2>
          <p className="mt-3.5 text-[15px] leading-[1.85] text-sa-secondary sm:text-[16px]">
            {chapter.body}
          </p>
        </div>

        <figure className="relative w-full overflow-hidden border border-sa-border aspect-[358/240] max-w-none lg:mx-0 lg:aspect-[360/500] lg:h-[500px] lg:w-[360px] lg:max-w-[360px] lg:shrink-0">
          <Image
            src={chapter.image}
            alt={chapter.caption}
            fill
            quality={90}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 360px"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 px-4 py-[13px] text-[9px] font-bold uppercase tracking-[0.16em] text-white">
            {chapter.caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
