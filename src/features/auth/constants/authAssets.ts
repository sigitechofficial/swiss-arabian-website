import { homeAssets } from "@/features/home/constants/homeAssets";

export const authAssets = {
  logo: homeAssets.logo,
  eye: "/assets/auth/eye-outline.svg",
  google: "/assets/auth/google.svg",
  apple: "/assets/auth/apple.svg",
} as const;

/** Image + copy pairs for the auth brand carousel */
export const AUTH_BRAND_SLIDES = [
  {
    image: "/assets/auth/brand-slide-1.png",
    eyebrow: "The house",
    headline: "Scents that travel with you.",
    body: "From first spray to last echo — keep your favourites close and discover what comes next.",
  },
  {
    image: "/assets/auth/brand-slide-4.png",
    eyebrow: "Members",
    headline: "Your signature, saved.",
    body: "Sign in to check out faster, follow every order, and keep your favourite oud, amber and florals in one place.",
  },
  {
    image: "/assets/auth/brand-slide-5.png",
    eyebrow: "Crafted",
    headline: "Oud, amber, and beyond.",
    body: "Step into Swiss Arabian — heritage notes, modern wear, and collections made for every journey.",
  },
  {
    image: "/assets/auth/brand-slide-6.png",
    eyebrow: "Welcome",
    headline: "One account. Every scent.",
    body: "Track orders, revisit what you love, and pick up where you left off — anywhere you shop.",
  },
] as const;

export const AUTH_BRAND_PILLS = [
  "Crafted in Dubai since 1974",
  "Genuine & sealed",
  "Complimentary samples",
] as const;

export const AUTH_BRAND_SLIDE_MS = 5500;
