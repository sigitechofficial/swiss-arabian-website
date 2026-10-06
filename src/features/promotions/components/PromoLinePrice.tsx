import { formatMoney } from "@/features/home/utils/formatMoney";
import type { PromotionSnapshotV1 } from "../types/promotions";
import { lineMerchandiseDiscount, linePrices } from "../utils/lineMerchandiseDiscount";

const priceSize = "text-[0.72rem] leading-none";

const struck = `${priceSize} font-medium text-[rgb(33_33_33/0.45)] line-through`;

type PromoLinePriceProps = {
  snapshot: PromotionSnapshotV1 | null | undefined;
  fallbackSnapshot?: PromotionSnapshotV1 | null;
  line: {
    cartItemId?: string | null;
    sku?: string | null;
    unitPrice: number;
    quantity: number;
    currency: string;
  };
  className: string;
};

export function PromoLinePrice({
  snapshot,
  fallbackSnapshot,
  line,
  className,
}: PromoLinePriceProps) {
  const listTotal = line.unitPrice * line.quantity;
  const discount =
    lineMerchandiseDiscount(snapshot, line) ||
    lineMerchandiseDiscount(fallbackSnapshot, line);
  const prices = linePrices(listTotal, discount);

  return (
    <p className={`${className} m-0 flex flex-col items-end gap-1`} dir="ltr">
      {prices.sale != null ? (
        <>
          <span className={struck}>{formatMoney(prices.list, line.currency)}</span>
          <span className={priceSize}>{formatMoney(prices.sale, line.currency)}</span>
        </>
      ) : (
        formatMoney(prices.list, line.currency)
      )}
    </p>
  );
}
