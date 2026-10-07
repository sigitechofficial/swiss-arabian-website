"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import { formatPoints, type LoyaltyOrderRewardView } from "../types/loyalty";

function vestingDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(date);
}

/** True when confirmation should show the Rewards card. Redeemed-only orders count. */
export function hasOrderLoyaltySection(reward: LoyaltyOrderRewardView | null | undefined): boolean {
  if (!reward) return false;
  const earned = reward.earned && reward.state !== "CANCELLED";
  return Boolean(earned || reward.redemption.redeemed);
}

/**
 * Order confirmation rewards block, read from the frozen order snapshot.
 *
 * Pending points are never described as added, and a cart estimate is never
 * substituted here. A redemption-only order still shows this block.
 */
export function OrderRewardNote({
  reward,
}: {
  reward: LoyaltyOrderRewardView | null | undefined;
}) {
  if (!hasOrderLoyaltySection(reward) || !reward) return null;

  const earned = Boolean(reward.earned && reward.state !== "CANCELLED");
  const vestsOn = reward.earned ? vestingDate(reward.vestedAt) : null;
  const redemption = reward.redemption.redeemed ? reward.redemption : null;

  return (
    <section className="loyalty-order-reward" aria-labelledby="order-rewards-heading">
      <h2 id="order-rewards-heading" className="loyalty-order-reward__title">
        Rewards
      </h2>
      {redemption ? (
        <>
          <p className="loyalty-order-reward__note">You used</p>
          <p className="loyalty-order-reward__points">{`${formatPoints(redemption.points)} points`}</p>
          {redemption.amount > 0 ? (
            <p className="loyalty-order-reward__note" dir="ltr">
              {formatMoney(redemption.amount, redemption.currencyCode ?? "AED")}
            </p>
          ) : null}
        </>
      ) : null}
      {earned && reward.earned ? (
        reward.state === "AVAILABLE" ? (
          <>
            <p className="loyalty-order-reward__note">You earned</p>
            <p className="loyalty-order-reward__points">{`${formatPoints(reward.points)} points available`}</p>
            <p className="loyalty-order-reward__note">
              These points are ready to use.
            </p>
          </>
        ) : (
          <>
            <p className="loyalty-order-reward__note">You earned</p>
            <p className="loyalty-order-reward__points">{`${formatPoints(reward.points)} points pending`}</p>
            <p className="loyalty-order-reward__note">
              Your points will become available after this order qualifies.
            </p>
            {vestsOn ? (
              <p className="loyalty-order-reward__note">
                {`Available from approximately ${vestsOn}`}
              </p>
            ) : null}
          </>
        )
      ) : null}
    </section>
  );
}
