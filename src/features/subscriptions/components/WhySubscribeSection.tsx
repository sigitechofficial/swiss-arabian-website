import Image from "next/image";

import { whyFeatures } from "@/features/subscriptions/data/subscriptionContent";

export function WhySubscribeSection() {
  return (
    <section className="px-4 pt-16 sm:px-6 lg:px-10" aria-labelledby="why-subscribe">
      <h2
        id="why-subscribe"
        className="text-center font-[family-name:var(--font-display)] text-[clamp(1.6rem,3vw,2.1rem)] font-medium text-[var(--ink,#241f1b)]"
      >
        Why subscribe?
      </h2>
      <div className="mx-auto mt-12 grid max-w-[1100px] gap-10 md:grid-cols-3">
        {whyFeatures.map((item) => (
          <article key={item.title} className="text-center">
            <div className="mx-auto grid size-[88px] place-items-center rounded-full bg-[var(--cream-2,#f3ebda)]">
              <Image src={item.icon} alt="" width={28} height={28} unoptimized />
            </div>
            <h3 className="mt-5 text-[1.05rem] font-semibold text-[var(--ink,#241f1b)]">{item.title}</h3>
            <p className="mx-auto mt-2 max-w-[28ch] text-[0.92rem] leading-relaxed text-[var(--ink-2,#5b5148)]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
