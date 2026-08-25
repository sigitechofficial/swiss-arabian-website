import Link from "next/link";
import { PLAN_FEATURES, PLANS } from "../../constants/landingContent";

export function LandingPlans() {
  return (
    <section className="section plans" aria-labelledby="plansTitle">
      <div className="container">
        <header className="plans__head">
          <p className="eyebrow">Plans</p>
          <h2 className="display plans__title" id="plansTitle">
            Choose your plan
          </h2>
          <p className="lead plans__lead">
            Every plan includes free shipping and full flexibility — change, skip
            or cancel whenever you like.
          </p>
        </header>

        <div className="plans__grid">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={
                plan.featured ? "plan-card plan-card--featured" : "plan-card"
              }
            >
              <div className="plan-card__head">
                <h3 className="plan-card__name">{plan.name}</h3>
                {plan.featured ? (
                  <span className="plan-card__badge">Most popular</span>
                ) : null}
              </div>
              <p className="plan-card__price">
                <span className="plan-card__amount">{plan.amount}</span>
                <span className="plan-card__per">/month</span>
              </p>
              <p className="plan-card__desc">{plan.desc}</p>
              <hr className="plan-card__rule" />
              <ul className="plan-card__features" role="list">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                className={
                  plan.featured
                    ? "btn btn--block plan-card__cta"
                    : "btn btn--ghost btn--block plan-card__cta"
                }
                href="/subscriptions"
              >
                Start plan
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
