import {
  Accent,
  CenteredSectionHead,
} from "@/features/gift-box/components/CenteredSectionHead";
import { IconFeatureCard } from "@/features/subscriptions/components/IconFeatureCard";
import { howSteps } from "@/features/subscriptions/data/subscriptionContent";

/** Figma · How to subscribe panel 335:3371 */
export function HowSubscribeSection() {
  return (
    <section className="px-4 pt-14 sm:px-6 lg:px-10" aria-labelledby="how-subscribe">
      <CenteredSectionHead
        eyebrow="Getting started"
        title={
          <>
            How to <Accent>subscribe?</Accent>
          </>
        }
      />
      <div className="mx-auto mt-10 max-w-[1200px] bg-section-soft p-6 sm:p-10">
        <div className="grid gap-8 md:grid-cols-3 md:gap-8">
          {howSteps.map((item) => (
            <IconFeatureCard key={item.title} item={item} variant="column" />
          ))}
        </div>
      </div>
    </section>
  );
}
