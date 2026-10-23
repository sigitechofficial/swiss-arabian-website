import { howSteps } from "@/features/subscriptions/data/subscriptionContent";

export function HowSubscribeSection() {
  return (
    <section className="px-4 pt-16 sm:px-6 lg:px-10" aria-labelledby="how-subscribe">
      <h2
        id="how-subscribe"
        className="text-center font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2.1rem)] font-medium text-[var(--ink,#241f1b)]"
      >
        How to subscribe?
      </h2>
      <div className="mx-auto mt-12 grid max-w-[1100px] gap-10 md:grid-cols-3">
        {howSteps.map((item, index) => (
          <article key={item.title} className="text-center">
            <h3 className="text-[1.05rem] font-semibold text-[var(--ink,#241f1b)]">
              {index + 1}. {item.title}
            </h3>
            <p className="mx-auto mt-2 max-w-[32ch] text-[0.92rem] leading-relaxed text-[var(--ink-2,#5b5148)]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
