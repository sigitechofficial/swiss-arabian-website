import type { NavbarVariant } from "@/components/layout/navbar";

export type LandingPageCard = {
  id: number;
  title: string;
  description: string;
  logoUsage: string;
  href: string;
  variant: NavbarVariant;
};

export const LANDING_PAGE_CARDS: LandingPageCard[] = [
  {
    id: 1,
    title: "Landing page 1",
    description: "Centered logo with a slim search field on the left. Account and bag on the right.",
    logoUsage:
      "Logo centered. Cropped lockup: SA mark + SWISS ARABIAN. SINCE 1974 is dropped.",
    href: "/lp/1",
    variant: "logo-center",
  },
  {
    id: 2,
    title: "Landing page 2",
    description: "One row: logo left, menu centered, account and bag on the right.",
    logoUsage:
      "Logo left. Full lockup: SA mark + SWISS ARABIAN + SINCE 1974.",
    href: "/lp/2",
    variant: "inline",
  },
  {
    id: 3,
    title: "Landing page 3",
    description: "Same one-row layout as page 2, with UAE / English in the top bar.",
    logoUsage:
      "Logo left. Cropped lockup: SA mark + SWISS ARABIAN. SINCE 1974 is dropped.",
    href: "/lp/3",
    variant: "inline-locale",
  },
  {
    id: 4,
    title: "Landing page 4",
    description: "Logo left, large borderless search in the center, icons on the right.",
    logoUsage:
      "Logo left. Cropped lockup: SA mark + SWISS ARABIAN. SINCE 1974 is dropped.",
    href: "/lp/4",
    variant: "split",
  },
  {
    id: 5,
    title: "Landing page 5",
    description: "Boutique header: chocolate ticker, pill search, labeled account / wishlist / bag.",
    logoUsage:
      "Logo centered. Full lockup: SA mark + SWISS ARABIAN + SINCE 1974.",
    href: "/lp/5",
    variant: "minimal",
  },
  {
    id: 6,
    title: "Landing page 6",
    description: "Search on the left, stronger underline on the menu row.",
    logoUsage:
      "Logo centered. Text wordmark only: “SWISS ARABIAN”. No SA icon and no SINCE 1974.",
    href: "/lp/6",
    variant: "underline",
  },
];

export function landingPageById(id: string | number) {
  const numeric = typeof id === "number" ? id : Number(id);
  return LANDING_PAGE_CARDS.find((card) => card.id === numeric) ?? null;
}
