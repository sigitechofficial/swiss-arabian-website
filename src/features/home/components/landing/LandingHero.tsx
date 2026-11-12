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
import { getImageProps } from "next/image";
import { isOptimizableImageSrc } from "@/lib/images/remoteImagePatterns";

export type LandingHeroCta = {
  href: string;
  label: string;
};

function HeroCtaLink({ href, className, children }: { href: string; className: string; children: string }) {
  if (href.startsWith("#")) {
    return (
      <a
        className={className}
        href={href}
        onClick={(event) => {
          const node = document.getElementById(href.slice(1));
          if (!node) return;
          event.preventDefault();
          node.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <LocaleLink className={className} href={href}>
      {children}
    </LocaleLink>
  );
}

/** The hero spans the full viewport width. */
const HERO_SIZES = "100vw";

/** Full-width responsive candidates for `src` via the optimiser, or the original file. */
function heroSource(src: string): { src: string; srcSet?: string } {
  if (!isOptimizableImageSrc(src)) return { src };
  const { props } = getImageProps({ src, alt: "", fill: true, sizes: HERO_SIZES });
  return { src: props.src, srcSet: props.srcSet };
}

/**
 * CMS hero media, the page's LCP image. Art-directed: the mobile image is a
 * different file, not a resize. Both are resized to the screen by the optimiser.
 */
function HeroPicture({ desktop, mobile, alt }: { desktop: string; mobile: string; alt: string }) {
  const large = heroSource(desktop);
  const small = heroSource(mobile);
  return (
    <picture>
      <source media="(max-width: 700px)" srcSet={small.srcSet ?? small.src} sizes={HERO_SIZES} />
      <img
        className={heroImg}
        src={large.src}
        srcSet={large.srcSet}
        sizes={HERO_SIZES}
        alt={alt}
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
}

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
          <HeroPicture desktop={cmsDesktop} mobile={cmsMobile ?? cmsDesktop} alt={title || ""} />
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
        <p className={heroTitle} id="heroTitle">
          {title}
        </p>
        {lead ? <p className={heroLead}>{lead}</p> : null}
        {primaryCta || secondaryCta ? (
          <div className={heroCta}>
            {primaryCta ? (
              <HeroCtaLink className={heroBtnSolid} href={primaryCta.href}>
                {primaryCta.label}
              </HeroCtaLink>
            ) : null}
            {secondaryCta ? (
              <HeroCtaLink className={heroBtnGhost} href={secondaryCta.href}>
                {secondaryCta.label}
              </HeroCtaLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
