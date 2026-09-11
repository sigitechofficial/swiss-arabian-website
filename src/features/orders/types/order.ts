import type { AccountStatusTone } from "@/features/account/components/AccountStatus";

export type OrderChannel = "ONLINE" | "IN_STORE";

/**
 * View model for a purchase row. Shaped after the order card so the
 * storefront Orders API only needs a mapper, not a UI change.
 */
export type OrderSummaryView = {
  id: string;
  reference: string;
  dateLabel: string;
  channel: OrderChannel;
  fulfilmentLabel: string;
  itemCount: number;
  headline: string;
  statusLabel: string;
  statusTone: AccountStatusTone;
  thumbnail: string;
  isActive: boolean;
};
