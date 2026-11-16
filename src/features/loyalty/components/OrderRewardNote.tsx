"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { formatPoints, type LoyaltyOrderRewardView } from "../types/loyalty";
import { rewardsVestingDate } from "../utils/loyaltyDates";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";

/** True when confirmation or order history should show the Rewards card. */
export function hasOrderLoyaltySection(
  reward: LoyaltyOrderRewardView | null | undefined,
): boolean {
  if (!reward) return false;
  const earned = reward.earned && reward.state !== "CANCELLED";
  const returned =
    reward.redemption.redeemed && reward.redemption.returnedPoints != null;
  return Boolean(
    earned || reward.redemption.redeemed || reward.earnAdjustment || returned,
  );
}

/**
 * Order rewards block, read from the current Backend order view.
 *
 * After-sale reversal and return lines are shown only when the server sends
 * those numbers. Nothing here is derived from refund money.
 */
export function OrderRewardNote({
  reward,
  showHeading = true,
}: {
  reward: LoyaltyOrderRewardView | null | undefined;
  showHeading?: boolean;
}) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  if (!hasOrderLoyaltySection(reward) || !reward) return null;

  const earned = Boolean(reward.earned && reward.state !== "CANCELLED");
  const vestsOn = reward.earned ? rewardsVestingDate(reward.vestedAt, locale, timeZone) : null;
  const redemption = reward.redemption.redeemed ? reward.redemption : null;
  const adjustment = reward.earnAdjustment;

  return (
    <section
      className="loyalty-order-reward min-w-0 space-y-2"
      aria-labelledby="order-rewards-heading"
    >
      {showHeading ? (
        <h2
          id="order-rewards-heading"
          className="loyalty-order-reward__title text-[16px] font-semibold text-sa-primary"
        >
          {t("account.tab.rewards")}
        </h2>
      ) : (
        <h2 id="order-rewards-heading" className="sr-only">
          {t("account.tab.rewards")}
        </h2>
      )}
      {redemption ? (
        <>
          <p className="loyalty-order-reward__note text-[13px] text-sa-secondary">
            {t("loyalty.order.used")}
          </p>
          <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
            {t("loyalty.points", { points: formatPoints(redemption.points) })}
          </p>
          {redemption.amount > 0 ? (
            <p
              className="loyalty-order-reward__note text-[13px] text-sa-secondary"
              dir="ltr"
            >
              {formatMoney(redemption.amount, redemption.currencyCode ?? "AED")}
            </p>
          ) : null}
          {redemption.returnedPoints != null ? (
            <>
              <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
                {t("loyalty.order.returned")}
              </p>
              <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
                {t("loyalty.points", { points: formatPoints(redemption.returnedPoints) })}
              </p>
              {redemption.returnedAmount != null &&
              redemption.returnedAmount > 0 ? (
                <p
                  className="loyalty-order-reward__note text-[13px] text-sa-secondary"
                  dir="ltr"
                >
                  {formatMoney(
                    redemption.returnedAmount,
                    redemption.currencyCode ?? "AED",
                  )}
                </p>
              ) : null}
            </>
          ) : null}
          {redemption.netPoints != null ? (
            <>
              <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
                {t("loyalty.order.net")}
              </p>
              <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
                {formatPoints(redemption.netPoints)}
              </p>
            </>
          ) : null}
        </>
      ) : null}
      {adjustment ? (
        <>
          <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
            {t("loyalty.order.earned")}
          </p>
          <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
            {t("loyalty.points", { points: formatPoints(adjustment.originalPoints) })}
          </p>
          <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
            {t("loyalty.order.adjusted")}
          </p>
          <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
            {t("loyalty.points", { points: `−${formatPoints(adjustment.adjustedPoints)}` })}
          </p>
          <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
            {t("loyalty.order.current")}
          </p>
          <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
            {t("loyalty.points", { points: formatPoints(adjustment.currentPoints) })}
          </p>
        </>
      ) : earned && reward.earned ? (
        reward.state === "AVAILABLE" ? (
          <>
            <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
              {t("loyalty.order.earned")}
            </p>
            <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
              {t("loyalty.order.pointsAvailable", { points: formatPoints(reward.points) })}
            </p>
            <p className="loyalty-order-reward__note text-[13px] text-sa-secondary">
              {t("loyalty.order.ready")}
            </p>
          </>
        ) : (
          <>
            <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
              {t("loyalty.order.earned")}
            </p>
            <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
              {t("loyalty.order.pointsPending", { points: formatPoints(reward.points) })}
            </p>
            <p className="loyalty-order-reward__note text-[13px] text-sa-secondary">
              {t("loyalty.order.qualifies")}
            </p>
            {vestsOn ? (
              <p className="loyalty-order-reward__note text-[13px] text-sa-secondary">
                {t("loyalty.order.availableFrom", { date: vestsOn })}
              </p>
            ) : null}
          </>
        )
      ) : null}
    </section>
  );
}
