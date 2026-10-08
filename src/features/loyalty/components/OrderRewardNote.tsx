"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { formatPoints, type LoyaltyOrderRewardView } from "../types/loyalty";

function vestingDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(date);
}

/** True when confirmation or order history should show the Rewards card. */
export function hasOrderLoyaltySection(reward: LoyaltyOrderRewardView | null | undefined): boolean {
  if (!reward) return false;
  const earned = reward.earned && reward.state !== "CANCELLED";
  const returned = reward.redemption.redeemed && reward.redemption.returnedPoints != null;
  return Boolean(earned || reward.redemption.redeemed || reward.earnAdjustment || returned);
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
  if (!hasOrderLoyaltySection(reward) || !reward) return null;

  const earned = Boolean(reward.earned && reward.state !== "CANCELLED");
  const vestsOn = reward.earned ? vestingDate(reward.vestedAt) : null;
  const redemption = reward.redemption.redeemed ? reward.redemption : null;
  const adjustment = reward.earnAdjustment;

  return (
    <section className="loyalty-order-reward min-w-0 space-y-2" aria-labelledby="order-rewards-heading">
      {showHeading ? (
        <h2 id="order-rewards-heading" className="loyalty-order-reward__title text-[16px] font-semibold text-sa-primary">
          Rewards
        </h2>
      ) : (
        <h2 id="order-rewards-heading" className="sr-only">
          Rewards
        </h2>
      )}
      {redemption ? (
        <>
          <p className="loyalty-order-reward__note text-[13px] text-sa-secondary">You used</p>
          <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
            {`${formatPoints(redemption.points)} points`}
          </p>
          {redemption.amount > 0 ? (
            <p className="loyalty-order-reward__note text-[13px] text-sa-secondary" dir="ltr">
              {formatMoney(redemption.amount, redemption.currencyCode ?? "AED")}
            </p>
          ) : null}
          {redemption.returnedPoints != null ? (
            <>
              <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
                Returned after refund
              </p>
              <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
                {`${formatPoints(redemption.returnedPoints)} points`}
              </p>
              {redemption.returnedAmount != null && redemption.returnedAmount > 0 ? (
                <p className="loyalty-order-reward__note text-[13px] text-sa-secondary" dir="ltr">
                  {formatMoney(redemption.returnedAmount, redemption.currencyCode ?? "AED")}
                </p>
              ) : null}
            </>
          ) : null}
          {redemption.netPoints != null ? (
            <>
              <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
                Net points used
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
          <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">You earned</p>
          <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
            {`${formatPoints(adjustment.originalPoints)} points`}
          </p>
          <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
            Adjusted after refund
          </p>
          <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
            {`−${formatPoints(adjustment.adjustedPoints)} points`}
          </p>
          <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">
            Current reward from this order
          </p>
          <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
            {`${formatPoints(adjustment.currentPoints)} points`}
          </p>
        </>
      ) : earned && reward.earned ? (
        reward.state === "AVAILABLE" ? (
          <>
            <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">You earned</p>
            <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
              {`${formatPoints(reward.points)} points available`}
            </p>
            <p className="loyalty-order-reward__note text-[13px] text-sa-secondary">
              These points are ready to use.
            </p>
          </>
        ) : (
          <>
            <p className="loyalty-order-reward__note pt-2 text-[13px] text-sa-secondary">You earned</p>
            <p className="loyalty-order-reward__points break-words text-[15px] font-semibold text-sa-primary tabular-nums">
              {`${formatPoints(reward.points)} points pending`}
            </p>
            <p className="loyalty-order-reward__note text-[13px] text-sa-secondary">
              Your points will become available after this order qualifies.
            </p>
            {vestsOn ? (
              <p className="loyalty-order-reward__note text-[13px] text-sa-secondary">
                {`Available from approximately ${vestsOn}`}
              </p>
            ) : null}
          </>
        )
      ) : null}
    </section>
  );
}
