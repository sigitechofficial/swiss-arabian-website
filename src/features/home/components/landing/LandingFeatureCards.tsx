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

const FEATURE_BG = [featureBg1, featureBg2, featureBg3, featureBg4] as const;

export type LandingTrustItem = {
  id: string;
  image?: string | null;
  headingLine1: string;
  headingLine2?: string | null;
  text?: string | null;
};

export type LandingFeatureCardsProps = {
  items?: LandingTrustItem[];
};

export function LandingFeatureCards({ items }: LandingFeatureCardsProps = {}) {
  const cards =
    items?.map((item, index) => ({
      id: item.id,
      image: item.image ?? "",
      title: [item.headingLine1, item.headingLine2 ?? ""] as [string, string],
      text: item.text ?? "",
      bg: FEATURE_BG[index % FEATURE_BG.length],
    })) ??
    // Only brand claims entered in the CMS. No built-in claims or stock images.
    [];

  if (!cards.length) return null;

  return (
    <section className={featureCards} aria-label="Why Swiss Arabian">
      <div className={pageContainer}>
        <div className={featureCardsList}>
          {cards.map((card) => (
            <article key={card.id} className={featureCard}>
              <div className={featureCardBox}>
                <div className={`${featureCardBg} ${card.bg}`}>
                  {card.image ? (
                    <img src={card.image} alt="" loading="lazy" />
                  ) : null}
                </div>
                <div className={featureCardCopy}>
                  {/* A label, not a heading (SEO audit); styled via data-feature-title. */}
                  <div data-feature-title>
                    {card.title[0]} <br />
                    <strong>{card.title[1]}</strong>
                  </div>
                  {card.text ? <p>{card.text}</p> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
