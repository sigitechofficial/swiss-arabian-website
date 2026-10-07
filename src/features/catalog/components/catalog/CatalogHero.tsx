"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { pageContainer } from "@/styles/siteChrome";
import {
  collectionEm,
  collectionEyebrow,
  collectionHead,
  collectionHero,
  collectionHeroMedia,
  collectionHeroPanel,
  collectionIntro,
  collectionTitle,
  crumbs,
  crumbsList,
} from "@/styles/shopChrome";

type CatalogHeroMeta = {
  eyebrow: string;
  title: string;
  titleEm: string;
  intro: string;
  heroImage: string;
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

        <div className={collectionHero}>
          {meta.heroImage ? (
            <img
              className={collectionHeroMedia}
              src={meta.heroImage}
              alt={heroAlt}
              width={720}
              height={1040}
              fetchPriority="high"
            />
          ) : null}
          <div className={collectionHeroPanel}>
            {meta.eyebrow ? <p className={collectionEyebrow}>{meta.eyebrow}</p> : null}
            <h1 className={collectionTitle} id="collection-heading">
              {meta.title}
              {meta.titleEm ? <em className={collectionEm}> {meta.titleEm}</em> : null}
            </h1>
            {meta.intro ? <p className={collectionIntro}>{meta.intro}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
