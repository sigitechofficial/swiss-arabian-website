import { newLaunches } from "@/features/home/data/homeContent";
import type { HomeProduct } from "@/features/home/types/home";

export const cartAssets = {
  truck: "/assets/cart/icon-truck.svg",
  addArrow: "/assets/cart/icon-add-arrow.svg",
} as const;

export const FREE_SHIPPING_THRESHOLD = 150;

export const DEFAULT_SIZE_LABEL = "75 ml EDP";

/** Figma cart sheet upsells (518:7097 / 475:7285) */
export const cartUpsells: HomeProduct[] = [
  {
    ...newLaunches.find((p) => p.slug === "patchouli-01")!,
    name: "Patchouli 01 Intense",
  },
  {
    ...newLaunches.find((p) => p.slug === "rose-01")!,
    name: "Rose 01 Premium",
    price: 72,
  },
];

/** Empty-cart suggestions — best-of lineup */
export const cartEmptySuggestions: HomeProduct[] = [
  ...cartUpsells,
  newLaunches.find((p) => p.slug === "vanilla-01")!,
  newLaunches.find((p) => p.slug === "incense-01")!,
].filter(Boolean);

export function notesFromFamily(family?: string): string[] {
  if (!family) return [];
  return family
    .split(/[·,]/)
    .map((n) => n.trim())
    .filter(Boolean);
}
