import Link from "next/link";
import {
  collectionArt,
  collectionArtProduct,
  collectionBody,
  collectionCard,
  collectionGrid,
  collectionTitle,
  collectionsSection,
  lead,
  linkUnderline,
  linkUnderlineLight,
  sectionHead,
  sectionTitle,
} from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";
import { SIGNATURE_COLLECTIONS } from "../../constants/landingContent";

export function LandingCollections() {
  return (
    <section className={`${collectionsSection} pt-[clamp(1.25rem,3vw,2rem)] pb-[clamp(3.5rem,8vw,7rem)]`} aria-labelledby="collTitle">
      <div className={pageContainer}>
        <header className={sectionHead}>
          <h2 className={sectionTitle} id="collTitle">
            Shop by Categories
          </h2>
          <p className={lead}>Enter the World of Swiss Arabian</p>
        </header>

        <div className={collectionGrid}>
          {SIGNATURE_COLLECTIONS.map((collection) => (
            <Link key={collection.title} className={collectionCard} href={collection.href}>
              <img
                className={
                  "frame" in collection && collection.frame === "product"
                    ? `${collectionArt} ${collectionArtProduct}`
                    : collectionArt
                }
                src={collection.image}
                alt={collection.alt}
                loading="lazy"
              />
              <span className={collectionBody}>
                <span className={collectionTitle}>{collection.title}</span>
                <span className={`${linkUnderline} ${linkUnderlineLight}`}>Explore</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
