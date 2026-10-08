import Image from "next/image";

import type { CollectionHeroConfig } from "../constants/collectionHero";

/** Match home hero creatives — portrait below `md`, landscape from `md` up */
const ASPECT_MOBILE = "535 / 690";
/** Home HD banners are 3840×1000 */
const ASPECT_DESKTOP = "3840 / 1000";

/**
 * Collection hero.
 * - New creatives (`imageMobile`): art-only, no dark overlay / HTML copy
 * - Legacy single image: overlay + eyebrow / title / subtitle
 */
export function CollectionHero({ config }: { config: CollectionHeroConfig }) {
  const artOnly = Boolean(config.imageMobile);

  if (artOnly && config.imageMobile) {
    return (
      <section className="w-full bg-page" aria-label={config.title}>
        <div className="md:hidden">
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: ASPECT_MOBILE }}
          >
            <Image
              src={config.imageMobile}
              alt={config.title}
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        </div>
        <div className="hidden md:block">
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: ASPECT_DESKTOP }}
          >
            <Image
              src={config.image}
              alt={config.title}
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative flex h-[320px] w-full flex-col items-center justify-center gap-4 overflow-hidden sm:h-[380px] lg:h-[420px]"
      aria-label={config.title}
    >
      <Image
        src={config.image}
        alt=""
        fill
        priority
        quality={90}
        className="object-cover"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-[rgba(44,36,29,0.55)]"
        aria-hidden
      />
      <p className="relative z-[1] text-[12px] font-semibold uppercase tracking-[0.42em] text-gold-light">
        {config.eyebrow}
      </p>
      <h1 className="relative z-[1] px-4 text-center font-sans text-[clamp(2rem,5vw,3.5rem)] font-normal uppercase tracking-[0.24em] text-white">
        {config.title}
      </h1>
      <p className="relative z-[1] max-w-[36rem] px-6 text-center text-[13px] font-semibold uppercase tracking-[0.28em] text-white/75">
        {config.subtitle}
      </p>
    </section>
  );
}
