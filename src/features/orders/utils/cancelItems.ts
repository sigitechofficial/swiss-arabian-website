import type { CancelItemsPreview } from "@/features/account/api/customerOrders.service";
import type { Translator } from "@/lib/i18n/messages";

/** A paid order line the customer may cancel units of (inside the cancellation window). */
export type CancellableLine = {
  orderLineId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type OrderLineLike = {
  orderLineId: string;
  productName?: string | null;
  sku: string;
  quantity: string;
  unitPrice: string;
  isGift?: boolean | null;
  cancelled?: boolean | null;
};

/**
 * The lines a customer can cancel one by one: still active and not a free
 * gift (gifts follow their offer). Same rule on every brand.
 */
export function cancellableOrderLines(lines: readonly OrderLineLike[]): CancellableLine[] {
  return lines
    .filter((line) => !line.cancelled && !line.isGift)
    .map((line) => ({
      orderLineId: line.orderLineId,
      name: line.productName ?? line.sku,
      quantity: Number.parseInt(line.quantity, 10) || 1,
      unitPrice: Number(line.unitPrice),
    }));
}

/** Units the customer could pick across those lines. */
export function cancellableUnits(lines: readonly CancellableLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export type CancelPreviewLine = { key: string; text: string; tone?: "strong" | "small" };

/**
 * What cancelling the picked units would do, as lines to show: the items'
 * value, offers and delivery the kept items no longer earn, gifts that go,
 * and the refund (or the new cash-on-delivery amount). Figures come from the
 * server's preview (`POST …/cancel-items/preview`).
 */
export function cancelPreviewLines(
  preview: CancelItemsPreview,
  money: (value: string) => string,
  t: Translator,
): CancelPreviewLine[] {
  if (preview.wholeOrder) return [{ key: "whole", text: t("orders.cancel.preview.whole"), tone: "strong" }];
  const lines: CancelPreviewLine[] = [
    { key: "items", text: t("orders.cancel.preview.items", { amount: money(preview.cancelledAmount) }) },
  ];
  if (Number(preview.offerAdjustmentAmount) > 0) {
    lines.push({ key: "offer", text: t("orders.cancel.preview.offer", { amount: money(preview.offerAdjustmentAmount) }) });
  }
  if (Number(preview.deliveryChargeAmount) > 0) {
    lines.push({ key: "delivery", text: t("orders.cancel.preview.delivery", { amount: money(preview.deliveryChargeAmount) }) });
  }
  const gifts = preview.giftsRemoved.map((gift) => gift.productName ?? gift.sku).filter(Boolean);
  if (gifts.length > 0) lines.push({ key: "gifts", text: t("orders.cancel.preview.gifts", { names: gifts.join(", ") }) });
  if (preview.cashOnDelivery) {
    lines.push({
      key: "cod",
      text: t("orders.cancel.preview.cod", { amount: money(preview.totalAfter), before: money(preview.totalBefore) }),
      tone: "strong",
    });
  } else if (Number(preview.refundAmount) > 0) {
    lines.push({ key: "refund", text: t("orders.cancel.preview.refund", { amount: money(preview.refundAmount) }), tone: "strong" });
  } else {
    lines.push({ key: "noRefund", text: t("orders.cancel.preview.noRefund"), tone: "strong" });
  }
  if (!preview.cashOnDelivery) {
    lines.push({ key: "newTotal", text: t("orders.cancel.preview.newTotal", { amount: money(preview.totalAfter) }), tone: "small" });
  }
  return lines;
}
