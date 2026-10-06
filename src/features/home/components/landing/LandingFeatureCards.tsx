import { pageContainer } from "@/styles/siteChrome";
import {
  featureBg1,
  featureBg2,
  featureBg3,
  featureBg4,
  featureCard,
  featureCardBg,
  featureCardBox,
  featureCardCopy,
  featureCards,
  featureCardsList,
} from "@/styles/landingChrome";
import { FEATURE_CARDS } from "../../constants/landingContent";

const FEATURE_BG = {
  "feature-card--1": featureBg1,
  "feature-card--2": featureBg2,
  "feature-card--3": featureBg3,
  "feature-card--4": featureBg4,
} as const;

export function LandingFeatureCards() {
  return (
    <section className={featureCards} aria-label="Why Swiss Arabian">
      <div className={pageContainer}>
        <div className={featureCardsList}>
          {FEATURE_CARDS.map((card) => (
            <article key={card.className} className={featureCard}>
              <div className={featureCardBox}>
                <div className={`${featureCardBg} ${FEATURE_BG[card.className]}`}>
                  <img src={card.image} alt="" loading="lazy" />
                </div>
                <div className={featureCardCopy}>
                  <h2>
                    {card.title[0]} <br />
                    <strong>{card.title[1]}</strong>
                  </h2>
                  <p>{card.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
