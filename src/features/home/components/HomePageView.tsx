import { LandingBundles } from "./landing/LandingBundles";
import { LandingCollections } from "./landing/LandingCollections";
import { LandingFeatureCards } from "./landing/LandingFeatureCards";
import { LandingHero } from "./landing/LandingHero";
import { LandingNotes } from "./landing/LandingNotes";
import { LandingPlans } from "./landing/LandingPlans";
import { LandingProductsBand } from "./landing/LandingProductsBand";
import { LandingReel } from "./landing/LandingReel";
import { LandingReviews } from "./landing/LandingReviews";
import { LandingStory } from "./landing/LandingStory";
import { LandingTrending } from "./landing/LandingTrending";

export function HomePageView() {
  return (
    <div className="landing">
      <LandingHero />
      <LandingFeatureCards />
      <LandingProductsBand />
      <LandingCollections />
      <LandingNotes />
      <LandingTrending />
      <LandingBundles />
      <LandingReel />
      <LandingReviews />
      <LandingStory />
      <LandingPlans />
    </div>
  );
}
