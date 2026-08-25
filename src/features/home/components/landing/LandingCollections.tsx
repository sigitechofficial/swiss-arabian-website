import Link from "next/link";
import { SIGNATURE_COLLECTIONS } from "../../constants/landingContent";

export function LandingCollections() {
  return (
    <section className="section collections" aria-labelledby="collTitle">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">The Maison</p>
          <h2 className="display section-head__title" id="collTitle">
            Signature collections
          </h2>
          <p className="lead">Four ways into the world of Swiss Arabian.</p>
        </header>

        <div className="collection-grid">
          {SIGNATURE_COLLECTIONS.map((collection) => (
            <Link
              key={collection.title}
              className="collection-card"
              href={collection.href}
            >
              <img
                className="collection-card__art"
                src={collection.image}
                alt={collection.alt}
                loading="lazy"
              />
              <span className="collection-card__body">
                <span className="eyebrow collection-card__eyebrow">
                  {collection.eyebrow}
                </span>
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
