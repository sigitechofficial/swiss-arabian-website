import Link from "next/link";

import { Stagger, StaggerItem } from "@/components/motion";
import { fragranceTags } from "@/features/gift-box/data/giftBoxContent";
import {
  Accent,
  CenteredSectionHead,
} from "@/features/gift-box/components/CenteredSectionHead";

/** Figma · Popular Fragrances tag cloud */
export function PopularFragrancesSection() {
  return (
    <section className="pb-4" aria-label="Popular fragrances">
      <CenteredSectionHead
        eyebrow="Find your note"
        title={
          <>
            Popular <Accent>Fragrances</Accent>
          </>
        }
      />
      <Stagger className="mx-auto mt-10 flex max-w-[1100px] flex-wrap items-start justify-center gap-2 px-4 sm:px-6">
        {fragranceTags.map((tag) => (
          <StaggerItem key={tag}>
            <Link
              href={`/products?note=${encodeURIComponent(tag.toLowerCase())}`}
              className="block border border-sa-input px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-sa-secondary transition-colors hover:border-terra hover:text-sa-primary"
            >
              {tag}
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
