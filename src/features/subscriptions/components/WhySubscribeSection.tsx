import {
  Accent,
  CenteredSectionHead,
} from "@/features/gift-box/components/CenteredSectionHead";
import { IconFeatureCard } from "@/features/subscriptions/components/IconFeatureCard";
import { whyFeatures } from "@/features/subscriptions/data/subscriptionContent";

/** Figma · Why subscribe */
export function WhySubscribeSection() {
  return (
    <section className="px-4 pt-14 sm:px-6 lg:px-10" aria-labelledby="why-subscribe">
      <CenteredSectionHead
        eyebrow="Benefits"
        title={
          <>
            Why <Accent>subscribe?</Accent>
          </>
        }
      />
      <div className="mx-auto mt-10 grid max-w-[1200px] gap-4 md:grid-cols-3">
        {whyFeatures.map((item) => (
          <IconFeatureCard key={item.title} item={item} variant="card" />
        ))}
      </div>
    </section>
  );
}
