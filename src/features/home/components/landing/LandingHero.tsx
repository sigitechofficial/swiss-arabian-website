import Link from "next/link";
import { HeroSwiper } from "./HeroSwiper";

export function LandingHero() {
  return (
    <section className="hero" aria-labelledby="heroTitle">
      <div className="hero__media">
        <HeroSwiper />
        <div className="hero__glow" />
      </div>
      <div className="container hero__inner">
        <p className="eyebrow hero__eyebrow">Extrait de Parfum · Est. 1974</p>
        <h1 className="display hero__title" id="heroTitle">
          East Meets West
        </h1>
        <p className="lead hero__lead">
          A house founded on duality — the drama and grandeur of the Orient, the
          power and dynamism of the West — captured in every bottle.
        </p>
        <div className="hero__cta">
          <Link className="hero__btn hero__btn--solid" href="/products">
            Shop the collection
          </Link>
          <a className="hero__btn hero__btn--ghost" href="#story">
            Discover our story
          </a>
        </div>
      </div>
    </section>
  );
}
