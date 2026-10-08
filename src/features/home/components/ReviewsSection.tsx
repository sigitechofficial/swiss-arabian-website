import { homeReviews } from "@/features/home/data/homeContent";
import { Accent, SectionHeader } from "./SectionHeader";

export function ReviewsSection() {
  return (
    <section className="bg-ash pb-16" aria-label="Customer reviews">
      <div className="mx-auto max-w-[1280px] border-t border-sa-border px-4 pt-16 sm:px-6 lg:px-10">
        <SectionHeader
          eyebrow="Our Happy Customers"
          title={
            <>
              Worn, loved, <Accent>repeated</Accent>
            </>
          }
          aside={
            <div className="text-right">
              <p className="font-sans text-2xl font-semibold text-sa-primary">
                4.9 <span className="text-lg text-gold">★★★★★</span>
              </p>
              <p className="text-[12px] text-sa-muted">10,000+ verified reviews</p>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {homeReviews.map((review) => (
            <blockquote
              key={review.id}
              className="relative bg-surface p-7"
            >
              <span
                className="absolute right-6 top-4 font-sans text-6xl italic text-sa-border"
                aria-hidden
              >
                “
              </span>
              <p className="text-gold" aria-label="5 stars">
                ★★★★★
              </p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-sa-primary">
                {review.quote}
              </p>
              <footer className="mt-5 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-paper font-sans font-semibold text-terra">
                  {review.initial}
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold text-sa-primary">
                    {review.name}
                  </span>
                  <span className="block text-[11.5px] text-sa-muted">
                    {review.meta}
                  </span>
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
