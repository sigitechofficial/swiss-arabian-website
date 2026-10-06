import Link from "next/link";
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
  return (
    <section className={collectionHead} aria-labelledby="collection-heading">
      <div className={pageContainer}>
        <nav className={crumbs} aria-label="Breadcrumb">
          <ol className={crumbsList} role="list">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-current="page">
              {meta.title} {meta.titleEm}
            </li>
          </ol>
        </nav>

        <div className={collectionHero}>
          <img
            className={collectionHeroMedia}
            src={meta.heroImage}
            alt={heroAlt}
            width={720}
            height={1040}
            fetchPriority="high"
          />
          <div className={collectionHeroPanel}>
            <p className={collectionEyebrow}>{meta.eyebrow}</p>
            <h1 className={collectionTitle} id="collection-heading">
              {meta.title} <em className={collectionEm}>{meta.titleEm}</em>
            </h1>
            <p className={collectionIntro}>{meta.intro}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
