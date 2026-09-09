import Link from "next/link";
import { SIGNATURE_COLLECTIONS } from "../../constants/landingContent";

export function LandingCollections() {
  return (
    <section className="section collections" aria-labelledby="collTitle">
      <div className="container">
        <header className="section-head">
          <h2 className="display section-head__title" id="collTitle">
            Shop by Categories
          </h2>
          <p className="lead">Enter the World of Swiss Arabian</p>
        </header>

        <div className="collection-grid">
          {SIGNATURE_COLLECTIONS.map((collection) => (
            <Link
              key={collection.title}
              className="collection-card"
              href={collection.href}
            >
              <img
                className={
                  "frame" in collection && collection.frame === "product"
                    ? "collection-card__art collection-card__art--product"
                    : "collection-card__art"
                }
                src={collection.image}
                alt={collection.alt}
                loading="lazy"
              />
              <span className="collection-card__body">
                <span className="display collection-card__title">
                  {collection.title}
                </span>
                <span className="link-underline">Explore</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
