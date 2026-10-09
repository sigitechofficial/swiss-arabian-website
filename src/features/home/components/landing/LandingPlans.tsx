import { LocaleLink } from "@/lib/i18n/LocaleLink";
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

export type LandingPlanCard = {
  id: string;
  name: string;
  displayPrice: string;
  billingIntervalLabel?: string | null;
  description?: string | null;
  benefits?: string[] | null;
  featured?: boolean;
  badgeLabel?: string | null;
  ctaLabel?: string | null;
  href?: string | null;
};

export type LandingPlansProps = {
  eyebrowText?: string | null;
  heading?: string | null;
  description?: string | null;
  plans?: LandingPlanCard[];
  editorialPricingOnly?: boolean;
};

export function LandingPlans({
  eyebrowText = "Plans",
  heading = "Choose your plan",
  description = "Every plan includes free shipping and full flexibility — change, skip or cancel whenever you like.",
  plans,
  editorialPricingOnly = true,
}: LandingPlansProps = {}) {
  const cards: LandingPlanCard[] =
    plans ??
    PLANS.map((plan, index) => ({
      id: `legacy-${index}`,
      name: plan.name,
      displayPrice: plan.amount,
      billingIntervalLabel: "/month",
      description: plan.desc,
      featured: plan.featured,
      badgeLabel: plan.featured ? "Most popular" : null,
      ctaLabel: "Start plan",
      href: "/subscriptions",
    }));

  if (!cards.length) return null;

  return (
    <section className={plansSection} aria-labelledby="plansTitle">
      <div className={pageContainer}>
        <header className={sectionHead}>
          {eyebrowText ? <p className={eyebrow}>{eyebrowText}</p> : null}
          <h2 className={sectionTitle} id="plansTitle">
            {heading}
          </h2>
          {description ? <p className={lead}>{description}</p> : null}
          {editorialPricingOnly && plans ? (
            <p className={lead}>
              Plan pricing shown for merchandising only — checkout uses the
              subscription service when available.
            </p>
          ) : null}
        </header>

        <div className={plansGrid}>
          {cards.map((plan) => {
            const benefits =
              plan.benefits && plan.benefits.length
                ? plan.benefits
                : [...PLAN_FEATURES];
            const href = plan.href?.trim() || "/subscriptions";
            return (
              <article
                key={plan.id}
                className={
                  plan.featured ? `${planCard} ${planCardFeatured}` : planCard
                }
              >
                <div className={planHead}>
                  <h3 className={planName}>{plan.name}</h3>
                  {plan.featured || plan.badgeLabel ? (
                    <span className={planBadge}>
                      {plan.badgeLabel || "Most popular"}
                    </span>
                  ) : null}
                </div>
                <p className={planPrice}>
                  <span className={planAmount}>{plan.displayPrice}</span>
                  {plan.billingIntervalLabel ? (
                    <span className={planPer}>{plan.billingIntervalLabel}</span>
                  ) : null}
                </p>
                {plan.description ? (
                  <p className={planDesc}>{plan.description}</p>
                ) : null}
                <hr className={planRule} />
                <ul className={planFeatures} role="list">
                  {benefits.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <LocaleLink
                  className={plan.featured ? planCta : planCtaGhost}
                  href={href}
                >
                  {plan.ctaLabel?.trim() || "Start plan"}
                </LocaleLink>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
