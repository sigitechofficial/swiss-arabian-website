import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import {
  storyChapters,
  storyPromise,
  storyStats,
  storyThesis,
} from "../data/storyContent";
import { StoryChapterRow } from "./StoryChapterRow";
import { StoryHero } from "./StoryHero";

/** Figma 944:7381 — Our Story · Desktop · 1440 · Light */
export function StoryPageView() {
  return (
    <div className="bg-page">
      <StoryHero />

      {/* Thesis */}
      <section className="border-y border-sa-border px-4 py-12 sm:px-6 sm:py-14 lg:px-20 lg:py-[72px]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-12">
          <p className="shrink-0 text-[9px] font-bold uppercase tracking-[0.28em] text-gold lg:w-[180px]">
            {storyThesis.label}
          </p>
          <p className="max-w-[1012px] font-sans text-[20px] font-medium leading-[1.55] text-sa-primary sm:text-[22px] lg:text-[24px]">
            {storyThesis.text}
          </p>
        </div>
      </section>

      {storyChapters.map((chapter) => (
        <StoryChapterRow key={chapter.index} chapter={chapter} />
      ))}

      {/* Promise */}
      <section className="border-t border-sa-border px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-[240px] lg:py-[88px]">
        <div className="mx-auto max-w-[960px]">
          <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-gold">
            {storyPromise.eyebrow}
          </p>
          <h2 className="mt-5 font-sans text-[clamp(1.75rem,4vw,3rem)] font-medium italic leading-[1.15] text-sa-primary">
            <span className="block">{storyPromise.quoteLine1}</span>
            <span className="block">{storyPromise.quoteLine2}</span>
          </h2>
          <p className="mx-auto mt-7 text-[15px] leading-[1.85] text-sa-secondary sm:text-[16px]">
            {storyPromise.body}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section
        className="border-t border-sa-border"
        aria-label="Brand milestones"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 md:grid-cols-3">
          {storyStats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-6 py-12 sm:px-10 sm:py-14 lg:px-12 lg:py-14 ${
                index < storyStats.length - 1
                  ? "border-b border-sa-border md:border-b-0 md:border-r"
                  : ""
              }`}
            >
              <p className="font-sans text-[40px] font-bold leading-none text-gold sm:text-[52px]">
                {stat.value}
              </p>
              <p className="mt-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sa-primary">
                {stat.label}
              </p>
              <p className="mt-2 max-w-[360px] text-[14px] leading-[1.75] text-sa-secondary">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <NewsletterSection />
    </div>
  );
}
