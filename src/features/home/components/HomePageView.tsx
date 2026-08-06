import { Reveal } from "@/components/motion";
import { BestSellersSection } from "./BestSellersSection";
import { CollectionsSection } from "./CollectionsSection";
import { HeroSection } from "./HeroSection";
import { HouseBandSection } from "./HouseBandSection";
import { NewsletterSection } from "./NewsletterSection";
import { NewLaunchesSection } from "./NewLaunchesSection";
import { OurStorySection } from "./OurStorySection";
import { ReviewsSection } from "./ReviewsSection";
import { ShaghafSection } from "./ShaghafSection";
import { ShopByGenderSection } from "./ShopByGenderSection";
import { TrendingSection } from "./TrendingSection";
import { WhySwissArabianSection } from "./WhySwissArabianSection";

/** Home landing — Figma Landing Page 001 / prototype index.html */
export function HomePageView() {
  return (
    <div className="bg-page">
      <h1 className="sr-only">Swiss Arabian — Luxury Oriental Perfumes</h1>
      <div className="h-1 w-full bg-page" aria-hidden />
      <Reveal fade>
        <HeroSection />
      </Reveal>
      <Reveal>
        <WhySwissArabianSection />
      </Reveal>
      <Reveal>
        <ShopByGenderSection />
      </Reveal>
      <Reveal>
        <NewLaunchesSection />
      </Reveal>
      <Reveal>
        <BestSellersSection />
      </Reveal>
      <Reveal>
        <CollectionsSection />
      </Reveal>
      <Reveal>
        <HouseBandSection />
      </Reveal>
      <Reveal>
        <TrendingSection />
      </Reveal>
      <Reveal>
        <ShaghafSection />
      </Reveal>
      <Reveal>
        <ReviewsSection />
      </Reveal>
      <Reveal>
        <div id="our-story">
          <OurStorySection />
        </div>
      </Reveal>
      <Reveal>
        <NewsletterSection />
      </Reveal>
    </div>
  );
}
