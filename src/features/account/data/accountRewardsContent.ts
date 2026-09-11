export type RewardEarnMethod = {
  id: string;
  title: string;
  description: string;
  icon: "shop" | "review" | "gift";
};

export type RewardRedeemOffer = {
  id: string;
  points: number;
  title: string;
  description: string;
};

export type RewardActivity = {
  id: string;
  date: string;
  title: string;
  detail: string;
  points: number;
};

export const REWARDS_SUMMARY = {
  points: 1240,
  tier: "Gold Member",
  nextTier: "Platinum",
  pointsToNext: 260,
  progress: 0.83,
  ordersCount: 34,
  valueEstimateUsd: 62,
} as const;

export const REWARD_EARN_METHODS: RewardEarnMethod[] = [
  {
    id: "shop",
    title: "Shop & earn",
    description:
      "Collect 1 point for every $1 you spend — on every order, automatically.",
    icon: "shop",
  },
  {
    id: "review",
    title: "Write a review",
    description: "Earn 50 points when you review a fragrance you’ve purchased.",
    icon: "review",
  },
  {
    id: "birthday",
    title: "Birthday bonus",
    description: "Enjoy a 200-point gift during your birthday month, on us.",
    icon: "gift",
  },
];

export const REWARD_REDEEM_OFFERS: RewardRedeemOffer[] = [
  {
    id: "shipping",
    points: 100,
    title: "Free express shipping",
    description: "On your next order — no minimum spend.",
  },
  {
    id: "sample",
    points: 150,
    title: "Deluxe sample set",
    description: "Three 2ml discoveries, curated for your profile.",
  },
  {
    id: "off10",
    points: 250,
    title: "$10 off",
    description: "Applied automatically at checkout.",
  },
  {
    id: "off25",
    points: 500,
    title: "$25 off",
    description: "Perfect for a full-size bottle.",
  },
];

export const REWARD_ACTIVITY: RewardActivity[] = [
  {
    id: "a1",
    date: "24 Jul 2026",
    title: "Order #SA-10842",
    detail: "Earned on purchase",
    points: 150,
  },
  {
    id: "a2",
    date: "18 Jul 2026",
    title: "Redeemed · Free express shipping",
    detail: "Applied to order #SA-10811",
    points: -100,
  },
  {
    id: "a3",
    date: "02 Jul 2026",
    title: "Order #SA-10790",
    detail: "Earned on purchase",
    points: 220,
  },
  {
    id: "a4",
    date: "12 Jun 2026",
    title: "Product review",
    detail: "Shaghaf Oud Aswad",
    points: 50,
  },
  {
    id: "a5",
    date: "28 May 2026",
    title: "Order #SA-10655",
    detail: "Earned on purchase",
    points: 95,
  },
];
