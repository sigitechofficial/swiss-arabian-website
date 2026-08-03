import Link from "next/link";

import { StoryArtPanel } from "./StoryArtPanel";

export function OurStorySection() {
  return (
    <section className="bg-ash pb-16" aria-label="Our story">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-4 pt-16 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">
            Our Story
          </p>
          <h2 className="mt-2 font-sans text-4xl font-medium leading-tight tracking-tight text-sa-primary lg:text-5xl">
            Fifty years of blending
            <br />
            <em className="font-normal italic text-terra">two traditions</em>
          </h2>
          <p className="mt-5 max-w-lg text-[14.5px] leading-relaxed text-sa-primary/80">
            Carrying a 50-year legacy rooted in Western and Oriental
            craftsmanship, Swiss Arabian is a house founded on duality — proudly
            celebrating the space where two seemingly opposed worlds come
            together.
          </p>
          <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-sa-primary/80">
            Born from precious beginnings, this fusion of creation transforms
            local knowledge into a fragrance brand worn the world over.
          </p>
          <dl className="mt-7 flex gap-10">
            <div>
              <dt className="sr-only">Years of craft</dt>
              <dd className="font-sans text-3xl font-semibold text-terra">50</dd>
              <dd className="text-[12px] font-semibold uppercase tracking-[0.1em] text-sa-muted">
                Years of craft
              </dd>
            </div>
            <div>
              <dt className="sr-only">Fragrances</dt>
              <dd className="font-sans text-3xl font-semibold text-terra">300+</dd>
              <dd className="text-[12px] font-semibold uppercase tracking-[0.1em] text-sa-muted">
                Fragrances
              </dd>
            </div>
            <div>
              <dt className="sr-only">Countries</dt>
              <dd className="font-sans text-3xl font-semibold text-terra">75</dd>
              <dd className="text-[12px] font-semibold uppercase tracking-[0.1em] text-sa-muted">
                Countries
              </dd>
            </div>
          </dl>
          <Link
            href="/collections"
            className="mt-8 inline-block bg-terra px-9 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#a25e48]"
          >
            Read our story
          </Link>
        </div>
        <StoryArtPanel />
      </div>
    </section>
  );
}
