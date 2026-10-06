import { formatMoney } from "@/features/home/utils/formatMoney";
import { historicalLineDiscount } from "../utils/historicalLineDiscount";

/** Already included in the line total and the order Discount row. */
export function HistoricalLineDiscount({
  snapshot,
  currency,
  className,
}: {
  snapshot: unknown;
  currency: string;
  className: string;
}) {
  const amount = historicalLineDiscount(snapshot);
  if (amount == null) return null;
  return (
    <p className={className}>
      Discount <span dir="ltr">−{formatMoney(amount, currency)}</span>
    </p>
  );
}
