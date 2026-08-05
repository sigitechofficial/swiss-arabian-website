import { accountAssets } from "@/features/account/constants/accountAssets";

import type { OrderSummaryView } from "../types/order";

/**
 * Figma reference rows (1203:8928 · 1203:8944 · 1203:8958).
 * Placeholder until the storefront Orders API lands — no fake success paths,
 * every action here is read-only navigation.
 */
export const purchaseHistoryOrders: OrderSummaryView[] = [
  {
    id: "SA-20240526-001",
    reference: "SA-20240526-001",
    dateLabel: "May 26, 2026",
    channel: "ONLINE",
    fulfilmentLabel: "Ship",
    itemCount: 2,
    headline: "We're processing your order.",
    statusLabel: "Processing",
    statusTone: "accent",
    thumbnail: accountAssets.orderThumb,
    isActive: true,
  },
  {
    id: "SA-20240910-002",
    reference: "SA-20240910-002",
    dateLabel: "Sep 10, 2025",
    channel: "ONLINE",
    fulfilmentLabel: "Ship",
    itemCount: 2,
    headline: "Your order has been delivered.",
    statusLabel: "Delivered",
    statusTone: "success",
    thumbnail: accountAssets.orderThumb,
    isActive: false,
  },
  {
    id: "SA-20240220-003",
    reference: "SA-20240220-003",
    dateLabel: "Feb 20, 2025",
    channel: "IN_STORE",
    fulfilmentLabel: "In Store",
    itemCount: 2,
    headline: "Your order has been delivered.",
    statusLabel: "Delivered",
    statusTone: "success",
    thumbnail: accountAssets.orderThumb,
    isActive: false,
  },
];
