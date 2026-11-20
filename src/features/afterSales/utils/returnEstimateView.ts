import { formatMoney } from "@/features/home/utils/formatMoney";
import type { Translator } from "@/lib/i18n/messages";
import type { ReturnEstimate } from "../types/afterSales";
import { afterSalesCopyText } from "./afterSalesCopy";

export type ReturnEstimateRow = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  /** The estimated refund line. */
  strong?: boolean;
};

export type ReturnEstimateView = {
  rows: ReturnEstimateRow[];
  /** A free gift has to come back with this return (the order lines to add). */
  giftRequired: { lineIds: string[] } | null;
  notes: { key: string; text: string }[];
  /** Where the money goes back to. */
  destination: string;
};

/**
 * The refund estimate laid out as rows for every brand: items (with VAT),
 * delivery, each fee and deduction, credits, and the estimated refund. The
 * figures come from the backend (same calculator as the real refund).
 */
export function returnEstimateView(e: ReturnEstimate, t: Translator, locale: string): ReturnEstimateView {
  const money = (amount: string) => formatMoney(Number(amount), e.currencyCode);
  const minus = (amount: string) => `− ${money(amount)}`;
  const copy = (item: Parameters<typeof afterSalesCopyText>[0]) => afterSalesCopyText(item, t, locale);
  const { returnShippingFee, restockingFee, freeGift, spentPoints, offerAdjustment, deliveryCharge } = e.deductions;
  const rows: ReturnEstimateRow[] = [
    {
      key: "items",
      label: t("returnEstimate.items"),
      value: money(e.taxIncluded ? e.itemsTotal : e.itemsAmount),
      hint:
        e.taxIncluded && Number(e.taxAmount) > 0
          ? t("returnEstimate.vatIncluded", { money: money(e.taxAmount) })
          : undefined,
    },
  ];
  if (!e.taxIncluded && Number(e.taxAmount) > 0) {
    rows.push({ key: "vat", label: t("returnEstimate.vat"), value: money(e.taxAmount) });
  }
  rows.push({
    key: "delivery",
    label: t("returnEstimate.delivery"),
    // No fee was charged: nothing to refund (not "not refunded").
    value: e.delivery.refunded
      ? money(e.delivery.amount)
      : e.delivery.reason === "NO_SHIPPING_CHARGED"
        ? t("returnEstimate.noDeliveryFee")
        : t("returnEstimate.notRefunded"),
    hint: copy(e.delivery.message),
  });
  if (Number(returnShippingFee.amount) > 0 || returnShippingFee.waived) {
    rows.push({
      key: "returnShipping",
      label: t("returnEstimate.returnShippingFee"),
      value: returnShippingFee.waived ? t("returnEstimate.waived") : minus(returnShippingFee.amount),
    });
  }
  if (Number(restockingFee.amount) > 0 || restockingFee.waived) {
    rows.push({
      key: "restocking",
      label: t("returnEstimate.restockingFee", { percent: restockingFee.percent }),
      value: restockingFee.waived ? t("returnEstimate.waived") : minus(restockingFee.amount),
    });
  }
  if (Number(freeGift.amount) > 0) {
    const names = freeGift.gifts.map((gift) => gift.productName || gift.sku).filter(Boolean).join(", ");
    rows.push({ key: "freeGift", label: t("returnEstimate.freeGift"), value: minus(freeGift.amount), hint: names || undefined });
  }
  if (offerAdjustment && Number(offerAdjustment.amount) > 0) {
    rows.push({ key: "offerAdjustment", label: t("returnEstimate.offerAdjustment"), value: minus(offerAdjustment.amount) });
  }
  if (deliveryCharge && Number(deliveryCharge.amount) > 0) {
    rows.push({ key: "deliveryCharge", label: t("returnEstimate.deliveryCharge"), value: minus(deliveryCharge.amount) });
  }
  if (e.deliveryCredit && Number(e.deliveryCredit.amount) > 0) {
    rows.push({ key: "deliveryCredit", label: t("returnEstimate.deliveryCredit"), value: `+ ${money(e.deliveryCredit.amount)}` });
  }
  if (e.offerCredit && Number(e.offerCredit.amount) > 0) {
    rows.push({ key: "offerCredit", label: t("returnEstimate.offerCredit"), value: `+ ${money(e.offerCredit.amount)}` });
  }
  if (Number(spentPoints.amount) > 0) {
    rows.push({
      key: "spentPoints",
      label: t("returnEstimate.spentPoints", { points: spentPoints.points }),
      value: minus(spentPoints.amount),
    });
  }
  rows.push({ key: "total", label: t("returnEstimate.total"), value: money(e.estimatedRefund), strong: true });

  return {
    rows,
    giftRequired: e.giftRequirement.required
      ? { lineIds: e.giftRequirement.gifts.map((gift) => gift.orderLineId) }
      : null,
    notes: e.notes.map((note) => ({ key: `${note.key}.${note.variant}`, text: copy(note) })),
    destination: copy(e.refundDestination),
  };
}
