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
import { MediaImage } from "@/components/ui/MediaImage";
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

        {meta.wide && meta.heroImage ? (
          <picture className={collectionBanner}>
            {meta.heroImageMobile ? (
              <source
                media="(max-width: 767px)"
                srcSet={meta.heroImageMobile}
                width={meta.heroSize?.mobileWidth ?? undefined}
                height={meta.heroSize?.mobileHeight ?? undefined}
              />
            ) : null}
            {/* Art-directed <picture>: the mobile banner is a different image, not a resize. */}
            <img
              className={collectionBannerImage}
              src={meta.heroImage}
              alt={heroAlt}
              width={meta.heroSize?.width ?? undefined}
              height={meta.heroSize?.height ?? undefined}
              fetchPriority="high"
              loading="eager"
            />
          </picture>
        ) : null}

        <div className={meta.wide && meta.heroImage ? collectionHeroWide : collectionHero}>
          {meta.heroImage && !meta.wide ? (
            <MediaImage
              className={collectionHeroMedia}
              src={meta.heroImage}
              alt={heroAlt}
              width={720}
              height={1040}
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
