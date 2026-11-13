import type { OrderSummaryApi } from "@/features/account/api/customerOrders.service";
import { englishTranslator, type MessageKey, type Translator } from "@/lib/i18n/messages";
import type { OrderSummaryView } from "../types/order";
import {
  formatOrderDate,
  isActiveOrder,
  orderStatusDisplay,
  shipmentStatusLabel,
} from "./orderStatus";

function headlineKey(status: string): MessageKey {
  switch (status) {
    case "PAYMENT_PENDING":
      return "orders.headline.PAYMENT_PENDING";
    case "SHIPMENT_CREATED":
    case "IN_TRANSIT":
      return "orders.headline.onTheWay";
    case "DELIVERED":
      return "orders.headline.DELIVERED";
    case "CANCELLED":
      return "orders.headline.CANCELLED";
    case "REFUND_PENDING":
      return "orders.headline.REFUND_PENDING";
    case "REFUNDED":
      return "orders.headline.REFUNDED";
    case "MANUAL_REVIEW":
      return "orders.headline.MANUAL_REVIEW";
    case "FAILED":
      return "orders.headline.FAILED";
    default:
      return "orders.headline.preparing";
  }
}

/** Live order summary → the dashboard's order card model, in the translator's language. */
export function toOrderSummaryView(
  order: OrderSummaryApi,
  t: Translator = englishTranslator,
  locale = "en",
): OrderSummaryView {
  const { label, tone } = orderStatusDisplay(order.status, t);
  return {
    id: order.orderId,
    reference: order.orderNumber ?? order.orderId.slice(0, 8).toUpperCase(),
    dateLabel: formatOrderDate(order.createdAt, { locale }),
    channel: "ONLINE",
    fulfilmentLabel: order.shipment ? shipmentStatusLabel(order.shipment.status, t) : t("orders.fulfilment.ship"),
    itemCount: order.itemCount,
    headline: t(headlineKey(order.status)),
    statusLabel: label,
    statusTone: tone,
    // The orders list carries no product imagery; the card shows a placeholder.
    thumbnail: "",
    isActive: isActiveOrder(order.status),
  };
}
