import type { NavbarVariant } from "@/components/layout/navbar";

export type LandingPageCard = {
  id: number;
  title: string;
  description: string;
  href: string;
  variant: NavbarVariant;
};

export const LANDING_PAGE_CARDS: LandingPageCard[] = [
  {
    id: 1,
    title: "Landing page 1",
    description: "Centered logo with a slim search field on the left.",
    href: "/lp/1",
    variant: "logo-center",
  },
  {
    id: 2,
    title: "Landing page 2",
    description: "Logo, menu, and account on one row.",
    href: "/lp/2",
    variant: "inline",
  },
  {
    id: 3,
    title: "Landing page 3",
    description: "Same as page 2, cropped logo, with region and language.",
    href: "/lp/3",
    variant: "inline-locale",
  },
  {
    id: 4,
    title: "Landing page 4",
    description: "Cropped logo left, large borderless search center, icons right.",
    href: "/lp/4",
    variant: "split",
  },
  {
    id: 5,
    title: "Landing page 5",
    description: "Boutique header: chocolate ticker, pill search, labeled tools.",
    href: "/lp/5",
    variant: "minimal",
  },
  {
    id: 6,
    title: "Landing page 6",
    description: "Wordmark logo, left search, stronger nav underline.",
    href: "/lp/6",
    variant: "underline",
  },
];

export function landingPageById(id: string | number) {
  const numeric = typeof id === "number" ? id : Number(id);
  return LANDING_PAGE_CARDS.find((card) => card.id === numeric) ?? null;
}
