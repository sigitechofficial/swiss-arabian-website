import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { pageContainer } from "@/styles/siteChrome";
import {
  hero,
  heroBtnGhost,
  heroBtnSolid,
  heroCta,
  heroEyebrow,
  heroGlow,
  heroImg,
  heroInner,
  heroLead,
  heroMedia,
  heroTitle,
} from "@/styles/landingChrome";
import type { HeroSlide } from "../../constants/heroSlides";
import { HeroSwiper } from "./HeroSwiper";

export type LandingHeroCta = {
  href: string;
  label: string;
};

export type LandingHeroProps = {
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** When set, renders a static responsive image instead of the default swiper. */
  desktopImage?: string | null;
  mobileImage?: string | null;
  /** Multi-slide media; ignored when desktopImage is set. */
  slides?: HeroSlide[];
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  showNavigation?: boolean;
  primaryCta?: LandingHeroCta | null;
  secondaryCta?: LandingHeroCta | null;
};

const DEFAULT_PRIMARY: LandingHeroCta = {
  href: "/products",
  label: "Shop the collection",
};

const DEFAULT_SECONDARY: LandingHeroCta = {
  href: "#story",
  label: "Discover our story",
};

export function LandingHero({
  eyebrow = "Extrait de Parfum · Est. 1974",
  title = "East Meets West",
  lead = "A house founded on duality — the drama and grandeur of the Orient, the power and dynamism of the West — captured in every bottle.",
  desktopImage,
  mobileImage,
  slides,
  autoplay,
  autoplayIntervalMs,
  showNavigation,
  primaryCta = DEFAULT_PRIMARY,
  secondaryCta = DEFAULT_SECONDARY,
}: LandingHeroProps = {}) {
  const cmsDesktop = desktopImage?.trim();
  const cmsMobile = mobileImage?.trim() || cmsDesktop;
  const useCmsMedia = Boolean(cmsDesktop);
  const useCmsSlides = !useCmsMedia && Boolean(slides?.length);

  return (
    <section className={hero} aria-labelledby="heroTitle">
      <div className={heroMedia}>
        {useCmsMedia && cmsDesktop ? (
          <picture>
            <source media="(max-width: 700px)" srcSet={cmsMobile!} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={heroImg} src={cmsDesktop} alt={title || ""} />
          </picture>
        ) : (
          <HeroSwiper
            slides={useCmsSlides ? slides : undefined}
            autoplay={autoplay}
            autoplayIntervalMs={autoplayIntervalMs}
            showNavigation={showNavigation}
          />
        )}
        <div className={heroGlow} />
      </div>
      <div className={`${pageContainer} ${heroInner}`}>
        {eyebrow ? <p className={heroEyebrow}>{eyebrow}</p> : null}
        <h1 className={heroTitle} id="heroTitle">
          {title}
        </h1>
        {lead ? <p className={heroLead}>{lead}</p> : null}
        {primaryCta || secondaryCta ? (
          <div className={heroCta}>
            {primaryCta ? (
              <LocaleLink className={heroBtnSolid} href={primaryCta.href}>
                {primaryCta.label}
              </LocaleLink>
            ) : null}
            {secondaryCta ? (
              secondaryCta.href.startsWith("#") ? (
                <a className={heroBtnGhost} href={secondaryCta.href}>
                  {secondaryCta.label}
                </a>
              ) : (
                <LocaleLink className={heroBtnGhost} href={secondaryCta.href}>
                  {secondaryCta.label}
                </LocaleLink>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
