import { ProductCard } from "@/features/home/components/ProductCard";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import {
  giftSetOffers,
  giftSetPopular,
} from "@/features/gift-box/data/giftBoxContent";
import {
  Accent,
  CenteredSectionHead,
} from "@/features/gift-box/components/CenteredSectionHead";
import { DisclaimerNote } from "@/features/gift-box/components/DisclaimerNote";
import { GiftSetsHero } from "@/features/gift-box/components/GiftSetsHero";
import { PopularFragrancesSection } from "@/features/gift-box/components/PopularFragrancesSection";

/** Gift Sets page — Figma 293:1881 */
export function GiftBoxPageView() {
  return (
    <div className="bg-page">
      <GiftSetsHero />

      <div className="pt-10">
        <CenteredSectionHead
          eyebrow="Save up to 50%"
          title={
            <>
              Offers & <Accent>Gift Sets</Accent>
            </>
          }
        />
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-4 px-4 pt-10 sm:px-6 md:grid-cols-3 lg:grid-cols-4 lg:px-10">
          {giftSetOffers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <section className="px-4 pt-20 sm:px-6 lg:px-10" aria-label="Popular products">
        <div className="mx-auto max-w-[1280px]">
          <CenteredSectionHead
            eyebrow="Loved by many"
            title={
              <>
                Popular <Accent>Products</Accent>
              </>
            }
          />
          <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4">
            {giftSetPopular.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <div className="pt-20">
        <PopularFragrancesSection />
      </div>

      <div className="pt-20">
        <DisclaimerNote />
        <NewsletterSection />
      </div>
    </div>
  );
}
