import Link from "next/link";
import { PLAN_FEATURES, PLANS } from "../../constants/landingContent";
import {
  eyebrow,
  lead,
  planAmount,
  planBadge,
  planCard,
  planCardFeatured,
  planCta,
  planCtaGhost,
  planDesc,
  planFeatures,
  planHead,
  planName,
  planPer,
  planPrice,
  planRule,
  plansGrid,
  plansSection,
  sectionHead,
  sectionTitle,
} from "@/styles/landingChrome";
import { pageContainer } from "@/styles/siteChrome";

export function LandingPlans() {
  return (
    <section className={plansSection} aria-labelledby="plansTitle">
      <div className={pageContainer}>
        <header className={sectionHead}>
          <p className={eyebrow}>Plans</p>
          <h2 className={sectionTitle} id="plansTitle">
            Choose your plan
          </h2>
          <p className={lead}>
            Every plan includes free shipping and full flexibility — change, skip
            or cancel whenever you like.
          </p>
        </header>

        <div className={plansGrid}>
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={plan.featured ? `${planCard} ${planCardFeatured}` : planCard}
            >
              <div className={planHead}>
                <h3 className={planName}>{plan.name}</h3>
                {plan.featured ? (
                  <span className={planBadge}>Most popular</span>
                ) : null}
              </div>
              <p className={planPrice}>
                <span className={planAmount}>{plan.amount}</span>
                <span className={planPer}>/month</span>
              </p>
              <p className={planDesc}>{plan.desc}</p>
              <hr className={planRule} />
              <ul className={planFeatures} role="list">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link className={plan.featured ? planCta : planCtaGhost} href="/subscriptions">
                Start plan
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
