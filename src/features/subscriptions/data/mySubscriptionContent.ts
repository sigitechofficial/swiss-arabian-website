import { accountAssets } from "@/features/account/constants/accountAssets";
import type { AccountStatusTone } from "@/features/account/components/AccountStatus";

export type SubscriptionMonthStatus = "DELIVERED" | "NEXT_UP" | "UPCOMING";

export type SubscriptionMonthRow = {
  monthLabel: string;
  scent: string;
  amountLabel: string;
  billingLabel: string;
  status: SubscriptionMonthStatus;
  thumbnail: string;
};

export const subscriptionStatusMeta: Record<
  SubscriptionMonthStatus,
  { label: string; tone: AccountStatusTone }
> = {
  DELIVERED: { label: "Delivered", tone: "success" },
  NEXT_UP: { label: "Next up", tone: "accent" },
  UPCOMING: { label: "Upcoming", tone: "muted" },
};

/**
 * Figma reference data (1236:9635 · 1236:9685…1236:9767).
 * Placeholder until a storefront Subscriptions API exists.
 */
export const mySubscription = {
  statusLabel: "Active",
  planName: "12-Month Signature Subscription",
  details: [
    { label: "Billing", value: "AED 149 / month" },
    { label: "Started", value: "12 March 2026" },
    { label: "Next billing date", value: "12 August 2026" },
    { label: "Delivery address", value: "Villa 12, Jumeirah 1, Dubai" },
    { label: "Deliveries so far", value: "5 of 12" },
  ],
  nextDelivery: {
    eyebrow: "Next delivery · Month 06",
    scent: "Amber Infusion",
    note: "Ships 12 August 2026 · free delivery",
    image: accountAssets.subscriptionProduct,
  },
  delivered: 5,
  total: 12,
} as const;

export const subscriptionMonths: SubscriptionMonthRow[] = [
  {
    monthLabel: "Month 01",
    scent: "Shaghaf Oud",
    amountLabel: "AED 149",
    billingLabel: "12 Mar 2026",
    status: "DELIVERED",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 02",
    scent: "Rose & Oud",
    amountLabel: "AED 149",
    billingLabel: "12 Apr 2026",
    status: "DELIVERED",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 03",
    scent: "Vanilla 01",
    amountLabel: "AED 149",
    billingLabel: "12 May 2026",
    status: "DELIVERED",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 04",
    scent: "Soul of Bali",
    amountLabel: "AED 149",
    billingLabel: "12 Jun 2026",
    status: "DELIVERED",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 05",
    scent: "Shaghaf Nectar Blush",
    amountLabel: "AED 149",
    billingLabel: "12 Jul 2026",
    status: "DELIVERED",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 06",
    scent: "Amber Infusion",
    amountLabel: "AED 149",
    billingLabel: "Ships 12 Aug 2026",
    status: "NEXT_UP",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 07",
    scent: "Patchouli 01",
    amountLabel: "AED 149",
    billingLabel: "12 Sep 2026",
    status: "UPCOMING",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 08",
    scent: "Enigma of Taif",
    amountLabel: "AED 149",
    billingLabel: "12 Oct 2026",
    status: "UPCOMING",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 09",
    scent: "Mukhallat Malaki",
    amountLabel: "AED 149",
    billingLabel: "12 Nov 2026",
    status: "UPCOMING",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 10",
    scent: "Layali",
    amountLabel: "AED 149",
    billingLabel: "12 Dec 2026",
    status: "UPCOMING",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 11",
    scent: "Casablanca",
    amountLabel: "AED 149",
    billingLabel: "12 Jan 2027",
    status: "UPCOMING",
    thumbnail: accountAssets.subscriptionProduct,
  },
  {
    monthLabel: "Month 12",
    scent: "Attar Al Kaaba",
    amountLabel: "AED 149",
    billingLabel: "12 Feb 2027",
    status: "UPCOMING",
    thumbnail: accountAssets.subscriptionProduct,
  },
];
