"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
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
  eyebrowText: eyebrowProp,
  heading: headingProp,
  description = null,
  plans,
  editorialPricingOnly = true,
}: LandingPlansProps = {}) {
  const t = useShopCopy();
  // Not set by the CMS (undefined): the house wording in the page's language.
  const eyebrowText = eyebrowProp === undefined ? t("landing.plans.eyebrow") : eyebrowProp;
  const heading = headingProp === undefined ? t("landing.plans.heading") : headingProp;
  const cards: LandingPlanCard[] =
    // Only real plans (subscription service / CMS). Never built-in prices.
    plans ?? [];

  if (!cards.length) return null;

  return (
    <section className={plansSection} aria-labelledby="plansTitle">
      <div className={pageContainer}>
        <header className={sectionHead}>
          {eyebrowText ? <p className={eyebrow}>{eyebrowText}</p> : null}
          <p className={sectionTitle} id="plansTitle">
            {heading}
          </p>
          {description ? <p className={lead}>{description}</p> : null}
          {editorialPricingOnly && plans ? (
            <p className={lead}>
              {t("landing.plans.editorial")}
            </p>
          ) : null}
        </header>

        <div className={plansGrid}>
          {cards.map((plan) => {
            const benefits = plan.benefits ?? [];
            const href = plan.href?.trim() || "/subscriptions";
            return (
              <article
                key={plan.id}
                className={
                  plan.featured ? `${planCard} ${planCardFeatured}` : planCard
                }
              >
                <div className={planHead}>
                  <p className={planName}>{plan.name}</p>
                  {plan.featured || plan.badgeLabel ? (
                    <span className={planBadge}>
                      {plan.badgeLabel || t("landing.plans.popular")}
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
                  {plan.ctaLabel?.trim() || t("landing.plans.start")}
                </LocaleLink>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
