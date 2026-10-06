"use client";

import { formatPoints, type LoyaltyOrderRewardView } from "../types/loyalty";

function vestingDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(date);
}

/**
 * Order confirmation rewards block, read from the frozen order snapshot.
 *
 * Pending points are never described as added, and a cart estimate is never
 * substituted here.
 */
export function OrderRewardNote({
  reward,
}: {
  reward: LoyaltyOrderRewardView | null | undefined;
}) {
  if (!reward?.earned || reward.state === "CANCELLED") return null;

  const points = formatPoints(reward.points);
  const vestsOn = vestingDate(reward.vestedAt);

  return (
    <section className="loyalty-order-reward" aria-labelledby="order-rewards-heading">
      <h2 id="order-rewards-heading" className="loyalty-order-reward__title">
        Rewards
      </h2>
      {reward.state === "AVAILABLE" ? (
        <>
          <p className="loyalty-order-reward__points">{`${points} points available`}</p>
          <p className="loyalty-order-reward__note">
            These points are ready to use.
          </p>
        </>
      ) : (
        <>
          <p className="loyalty-order-reward__points">{`${points} points pending`}</p>
          <p className="loyalty-order-reward__note">
            Your points will become available after this order qualifies.
          </p>
          {vestsOn ? (
            <p className="loyalty-order-reward__note">
              {`Available from approximately ${vestsOn}`}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
