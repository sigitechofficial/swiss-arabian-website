export const MAIN_NAV = [
  { label: "Minis", href: "/collections/minis" },
  { label: "New Launches", href: "/collections/new-launches" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Perfumes", href: "/collections/perfumes" },
  { label: "Perfume Oils", href: "/collections/perfume-oils" },
  { label: "Incense", href: "/collections/incense" },
  { label: "Gift Sets", href: "/gift-box" },
  { label: "Subscription", href: "/subscriptions" },
] as const;

export type MobileNavLink = { label: string; href: string };
export type MobileNavGroup = {
  label: string;
  href?: string;
  children: Array<MobileNavLink | { label: string; kind: "heading" }>;
};
export type MobileNavItem =
  | ({ type: "link" } & MobileNavLink)
  | ({ type: "group" } & MobileNavGroup);

export const MOBILE_NAV: MobileNavItem[] = [
  { type: "link", label: "Minis", href: "/collections/minis" },
  { type: "link", label: "New Launches", href: "/collections/new-launches" },
  { type: "link", label: "Best Sellers", href: "/collections/best-sellers" },
  { type: "link", label: "Perfumes", href: "/collections/perfumes" },
  { type: "link", label: "Perfume Oils", href: "/collections/perfume-oils" },
  { type: "link", label: "Incense", href: "/collections/incense" },
  { type: "link", label: "Gift Sets", href: "/gift-box" },
  { type: "link", label: "Subscription", href: "/subscriptions" },
];
