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
    FEATURE_CARDS.map((card, index) => ({
      id: card.className,
      image: card.image,
      title: card.title as unknown as [string, string],
      text: card.text,
      bg: FEATURE_BG[index % FEATURE_BG.length],
    }));

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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.image} alt="" loading="lazy" />
                  ) : null}
                </div>
                <div className={featureCardCopy}>
                  <h2>
                    {card.title[0]} <br />
                    <strong>{card.title[1]}</strong>
                  </h2>
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
