import Image from "next/image";

import { subscriptionAssets } from "@/features/subscriptions/constants/subscriptionAssets";

/** Figma · Page Hero — Subscription 335:3330 */
export function SubscriptionHero() {
  return (
    <section
      className="relative flex h-[320px] w-full flex-col items-center justify-center gap-4 overflow-hidden sm:h-[380px] lg:h-[460px]"
      aria-label="The Subscription"
    >
      <Image
        src={subscriptionAssets.hero}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-[rgba(44,36,29,0.55)]"
        aria-hidden
      />
      <p className="relative z-[1] text-[12px] font-semibold uppercase tracking-[0.42em] text-gold-light">
        The Subscription
      </p>
      <h1 className="relative z-[1] max-w-[20ch] text-center font-sans text-[clamp(1.75rem,4.5vw,3.5rem)] font-medium uppercase tracking-[0.24em] text-white">
        A New <em className="font-medium italic text-gold-light">Scent</em>,
        Every Month.
      </h1>
      <p className="relative z-[1] max-w-[36ch] px-4 text-center text-[13px] font-semibold uppercase tracking-[0.28em] text-white/75">
        One curated 10ml atomizer — delivered free to your door.
      </p>
    </section>
  );
}
