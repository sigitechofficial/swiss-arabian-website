import { FEATURE_CARDS } from "../../constants/landingContent";

export function LandingFeatureCards() {
  return (
    <section className="feature-cards" aria-label="Why Swiss Arabian">
      <div className="container">
        <div className="feature-cards-list">
          {FEATURE_CARDS.map((card) => (
            <article
              key={card.className}
              className={`feature-card ${card.className}`}
            >
              <div className="feature-card-box">
                <div className="feature-card-bg">
                  <img src={card.image} alt="" loading="lazy" />
                </div>
                <div className="feature-card-copy">
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
