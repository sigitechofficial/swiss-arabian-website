"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { pageContainer } from "@/styles/siteChrome";
import {
  collectionEm,
  collectionEyebrow,
  collectionHead,
  collectionBanner,
  collectionBannerImage,
  collectionHero,
  collectionHeroMedia,
  collectionHeroWide,
  collectionHeroPanel,
  collectionIntro,
  collectionTitle,
  crumbs,
  crumbsList,
} from "@/styles/shopChrome";
import { getImageProps } from "next/image";
import { MediaImage } from "@/components/ui/MediaImage";
import { isOptimizableImageSrc } from "@/lib/images/remoteImagePatterns";
import { sanitizeCatalogHtml } from "@/features/catalog/utils/catalogHtml";

const HTML_TAG = /<\/?[a-z][a-z0-9]*\b[^>]*>/i;

type CatalogHeroMeta = {
  eyebrow: string;
  title: string;
  titleEm: string;
  intro: string;
  heroImage: string;
  /** Small-screen banner version (store banners). */
  heroImageMobile?: string;
  /** Banner pixel sizes: the space is reserved before the image loads (no layout shift). */
  heroSize?: {
    width: number | null;
    height: number | null;
    mobileWidth: number | null;
    mobileHeight: number | null;
  } | null;
  /** Wide banner artwork: full width above the title, never cropped. */
  wide?: boolean;
};

/** The banner spans the page container (max 1200px). */
const BANNER_SIZES = "(max-width: 1200px) 100vw, 1200px";

/**
 * Resized `srcSet` for a banner when the optimiser can serve it and its pixel
 * size is known (needed for the aspect ratio). Otherwise the original file.
 */
function bannerSource(src: string, width: number | null | undefined, height: number | null | undefined) {
  if (!width || !height || !isOptimizableImageSrc(src)) {
    return { src, srcSet: undefined, sizes: undefined };
  }
  const { props } = getImageProps({ src, alt: "", width, height, sizes: BANNER_SIZES });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

/** Wide store banner, the page's LCP image. Art-directed: the mobile banner is a different image, not a resize. */
function CollectionBanner({ meta, alt }: { meta: CatalogHeroMeta; alt: string }) {
  const size = meta.heroSize;
  const desktop = bannerSource(meta.heroImage, size?.width, size?.height);
  const mobile = meta.heroImageMobile
    ? bannerSource(meta.heroImageMobile, size?.mobileWidth, size?.mobileHeight)
    : null;
  return (
    <picture className={collectionBanner}>
      {mobile ? (
        <source
          media="(max-width: 767px)"
          srcSet={mobile.srcSet ?? mobile.src}
          sizes={mobile.sizes}
          width={size?.mobileWidth ?? undefined}
          height={size?.mobileHeight ?? undefined}
        />
      ) : null}
      <img
        className={collectionBannerImage}
        src={desktop.src}
        srcSet={desktop.srcSet}
        sizes={desktop.sizes}
        alt={alt}
        width={size?.width ?? undefined}
        height={size?.height ?? undefined}
        fetchPriority="high"
        loading="eager"
      />
    </picture>
  );
}

export function CatalogHero({ meta, heroAlt }: { meta: CatalogHeroMeta; heroAlt: string }) {
  const copy = useShopCopy();
  return (
    <section className={collectionHead} aria-labelledby="collection-heading">
      <div className={pageContainer}>
        <nav className={crumbs} aria-label="Breadcrumb">
          <ol className={crumbsList} role="list">
            <li>
              <LocaleLink href="/">{copy("home")}</LocaleLink>
            </li>
            <li aria-current="page">
              {[meta.title, meta.titleEm].filter(Boolean).join(" ")}
            </li>
          </ol>
        </nav>

        {meta.wide && meta.heroImage ? <CollectionBanner meta={meta} alt={heroAlt} /> : null}

        <div className={meta.wide && meta.heroImage ? collectionHeroWide : collectionHero}>
          {meta.heroImage && !meta.wide ? (
            <MediaImage
              className={collectionHeroMedia}
              src={meta.heroImage}
              alt={heroAlt}
              width={720}
              height={1040}
              sizes="(max-width: 860px) 100vw, 500px"
              fetchPriority="high"
              loading="eager"
            />
          ) : null}
          <div className={collectionHeroPanel}>
            {meta.eyebrow ? <p className={collectionEyebrow}>{meta.eyebrow}</p> : null}
            <h1 className={collectionTitle} id="collection-heading">
              {meta.title}
              {meta.titleEm ? <em className={collectionEm}> {meta.titleEm}</em> : null}
            </h1>
            {meta.intro && HTML_TAG.test(meta.intro) ? (
              // Collection descriptions from Shopify are HTML ("<p>…</p>"): show them formatted, cleaned first.
              <div
                className={`${collectionIntro} [&_p]:m-0 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:ps-5`}
                dangerouslySetInnerHTML={{ __html: sanitizeCatalogHtml(meta.intro) }}
              />
            ) : meta.intro ? (
              <p className={collectionIntro}>{meta.intro}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
