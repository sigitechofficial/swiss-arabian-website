import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";
import { faqDrawers } from "@/features/faq/data/faqContent";

/** The brand history already published in the FAQ: shown until the market publishes its story page. */
const BRAND_HISTORY =
  faqDrawers
    .flatMap((drawer) => drawer.items)
    .find((item) => item.id === "general-name")?.answer ?? "";

/**
 * Swiss Arabian's /our-story when the market has no story page yet. Async (a
 * server component) so brands may load their own wording on the server.
 */
export async function OurStoryFallbackView() {
  return <FeaturePlaceholder title="Our story" description={BRAND_HISTORY} />;
}
