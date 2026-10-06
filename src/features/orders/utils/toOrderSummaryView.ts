import type { OrderSummaryApi } from "@/features/account/api/customerOrders.service";
import type { OrderSummaryView } from "../types/order";
import {
  formatOrderDate,
  isActiveOrder,
  orderStatusDisplay,
  shipmentStatusLabel,
} from "./orderStatus";

function headline(status: string): string {
  switch (status) {
    case "PAYMENT_PENDING":
      return "Your order is waiting for payment.";
    case "SHIPMENT_CREATED":
    case "IN_TRANSIT":
      return "Your order is on its way.";
    case "DELIVERED":
      return "Your order has been delivered.";
    case "CANCELLED":
      return "This order was cancelled.";
    case "REFUND_PENDING":
      return "This order is being refunded.";
    case "REFUNDED":
      return "This order was refunded.";
    case "MANUAL_REVIEW":
      return "Your order is being reviewed.";
    case "FAILED":
      return "This order couldn’t be completed.";
    default:
      return "We’re preparing your order.";
  }
}

/** Live order summary → the dashboard's order card model. */
export function toOrderSummaryView(order: OrderSummaryApi): OrderSummaryView {
  const { label, tone } = orderStatusDisplay(order.status);
  return {
    id: order.orderId,
    reference: order.orderNumber ?? order.orderId.slice(0, 8).toUpperCase(),
    dateLabel: formatOrderDate(order.createdAt),
    channel: "ONLINE",
    fulfilmentLabel: order.shipment ? shipmentStatusLabel(order.shipment.status) : "Ship",
    itemCount: order.itemCount,
    headline: headline(order.status),
    statusLabel: label,
    statusTone: tone,
    // The orders list carries no product imagery; the card shows a placeholder.
    thumbnail: "",
    isActive: isActiveOrder(order.status),
  };
}
