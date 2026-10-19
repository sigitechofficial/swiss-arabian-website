import { LandingBundles } from "@/features/home/components/landing/LandingBundles";
import { LandingCollections } from "@/features/home/components/landing/LandingCollections";
import { LandingFeatureCards } from "@/features/home/components/landing/LandingFeatureCards";
import { LandingHero } from "@/features/home/components/landing/LandingHero";
import { LandingNotes } from "@/features/home/components/landing/LandingNotes";
import { LandingPlans } from "@/features/home/components/landing/LandingPlans";
import { LandingProductsBand } from "@/features/home/components/landing/LandingProductsBand";
import { LandingReel } from "@/features/home/components/landing/LandingReel";
import { LandingReviews } from "@/features/home/components/landing/LandingReviews";
import { LandingStory } from "@/features/home/components/landing/LandingStory";
import { LandingTrending } from "@/features/home/components/landing/LandingTrending";

/**
 * Pre-CMS hardcoded Homepage composition.
 * Used only when CMS has no published version and legacy fallback is enabled.
 */
export function LegacyHomeFallback() {
  return (
    <div>
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
