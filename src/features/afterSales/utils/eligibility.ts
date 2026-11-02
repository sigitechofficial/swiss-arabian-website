const BLOCKED = new Set([
  "DRAFT",
  "CHECKOUT_STARTED",
  "CANCELLED",
  "FAILED",
]);

const ELIGIBLE = new Set([
  "SHIPMENT_CREATED",
  "IN_TRANSIT",
  "DELIVERED",
  "PARTIALLY_SHIPPED",
]);

const ELIGIBLE_FULFILLMENT = new Set([
  "FULFILLED",
  "PARTIALLY_FULFILLED",
]);

/** Show Request return/exchange only when the order looks shipped or delivered. */
export function isOrderEligibleForAfterSales(
  status: string,
  fulfillmentStatus?: string | null,
): boolean {
  const s = status?.toUpperCase() ?? "";
  const f = fulfillmentStatus?.toUpperCase() ?? "";
  if (BLOCKED.has(s)) return false;
  if (ELIGIBLE.has(s)) return true;
  if (ELIGIBLE_FULFILLMENT.has(f)) return true;
  return false;
}

export const RETURN_REASON_LABELS: Record<string, string> = {
  DAMAGED_ITEM: "Damaged item",
  WRONG_ITEM: "Wrong item received",
  DEFECTIVE_ITEM: "Defective item",
  SIZE_OR_VARIANT_ISSUE: "Size or variant issue",
  NOT_AS_DESCRIBED: "Not as described",
  CUSTOMER_CHANGED_MIND: "Changed my mind",
  LATE_DELIVERY: "Late delivery",
  DUPLICATE_ORDER: "Duplicate order",
  ALLERGY_OR_SAFETY_CONCERN: "Allergy or safety concern",
  OTHER: "Other",
};

export const RETURN_RESOLUTION_LABELS: Record<string, string> = {
  REFUND: "Refund",
  EXCHANGE: "Exchange",
  STORE_CREDIT: "Store credit",
  OTHER: "Other",
};

export const EXCHANGE_REASON_LABELS: Record<string, string> = {
  WRONG_ITEM: "Wrong item received",
  WRONG_VARIANT: "Wrong variant / size",
  DAMAGED_ITEM: "Damaged item",
  DEFECTIVE_ITEM: "Defective item",
  CUSTOMER_PREFERENCE: "Preference change",
  OTHER: "Other",
};

export const EXCHANGE_TYPE_LABELS: Record<string, string> = {
  SAME_ITEM: "Same item",
  DIFFERENT_VARIANT: "Different variant",
  DIFFERENT_PRODUCT: "Different product",
  SIZE_OR_COLOR_CHANGE: "Size or colour change",
  OTHER: "Other",
};

export function afterSalesStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case "REQUESTED":
      return "Requested";
    case "PENDING_REVIEW":
      return "Pending review";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "CANCELLED":
      return "Cancelled";
    case "CLOSED":
      return "Closed";
    case "COMPLETED":
      return "Completed";
    case "RECEIVED":
      return "Received";
    case "INSPECTED":
      return "Inspected";
    case "REFUND_PROCESSING":
      return "Refund processing";
    case "REFUND_COMPLETED":
      return "Refund completed";
    case "WAITING_FOR_RETURN":
    case "WAITING_FOR_ORIGINAL_RETURN":
      return "Waiting for the original return";
    case "ORIGINAL_RECEIVED":
      return "Original received";
    case "REPLACEMENT_CREATED":
    case "REPLACEMENT_ORDER_CREATED":
      return "Replacement order created";
    case "ADDITIONAL_PAYMENT_DUE":
      return "Additional payment due";
    default:
      return status?.trim() ? "In progress" : "In progress";
  }
}
