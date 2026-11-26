"use client";

import { formatMoney } from "@/lib/format/money";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { formatPoints, type LoyaltyEarnPreviewView } from "../types/loyalty";

/**
 * Compact rewards line for PDP, cart, cart drawer and checkout.
 *
 * Renders only the server's `estimatedPoints`. There is no progress bar and no
 * promotion wording — loyalty stays visually separate from promotion offers.
 */
export function EarnPreviewNote({
  preview,
  variant = "inline",
  showBasis = false,
}: {
  preview: LoyaltyEarnPreviewView | null | undefined;
  /** `inline` for PDP and the drawer, `block` for cart and checkout summaries. */
  variant?: "inline" | "block";
  /** Cart and checkout may show the server's eligible merchandise amount. */
  showBasis?: boolean;
}) {
  const t = useShopCopy();
  // Disabled program, disabled market and disabled earning all render nothing
  // rather than claiming zero points.
  if (!preview?.enabled) return null;

  const points = formatPoints(preview.estimatedPoints);
  const basis =
    showBasis && preview.eligibleAmount != null && preview.eligibleAmount > 0
      ? formatMoney(preview.eligibleAmount, preview.currencyCode ?? "AED")
      : null;

  if (variant === "inline") {
    return (
      <p className="loyalty-earn-note" data-testid="earn-preview">
        {t("loyalty.earn.inline", { count: preview.estimatedPoints, points })}
      </p>
    );
  }

  return (
    <section
      className="loyalty-earn-block"
      aria-labelledby="rewards-earn-heading"
      data-testid="earn-preview"
    >
      <h3 id="rewards-earn-heading" className="loyalty-earn-block__title">
        {t("loyalty.earn.title")}
      </h3>
      <p className="loyalty-earn-block__points">
        {t("loyalty.earn.block", { count: preview.estimatedPoints, points })}
      </p>
      {basis ? (
        <p className="loyalty-earn-block__basis">
          {t("loyalty.earn.basis", { amount: basis })}
        </p>
      ) : null}
    </section>
  );
}
