import Link from "next/link";
import { pageContainer } from "@/styles/siteChrome";
import {
  hero,
  heroBtnGhost,
  heroBtnSolid,
  heroCta,
  heroEyebrow,
  heroGlow,
  heroInner,
  heroLead,
  heroMedia,
  heroTitle,
} from "@/styles/landingChrome";
import { HeroSwiper } from "./HeroSwiper";

export function LandingHero() {
  return (
    <section className={hero} aria-labelledby="heroTitle">
      <div className={heroMedia}>
        <HeroSwiper />
        <div className={heroGlow} />
      </div>
      <div className={`${pageContainer} ${heroInner}`}>
        <p className={heroEyebrow}>Extrait de Parfum · Est. 1974</p>
        <h1 className={heroTitle} id="heroTitle">
          East Meets West
        </h1>
        <p className={heroLead}>
          A house founded on duality — the drama and grandeur of the Orient, the
          power and dynamism of the West — captured in every bottle.
        </p>
        <div className={heroCta}>
          <Link className={heroBtnSolid} href="/products">
            Shop the collection
          </Link>
          <a className={heroBtnGhost} href="#story">
            Discover our story
          </a>
        </div>
      </div>
    </section>
  );
}
