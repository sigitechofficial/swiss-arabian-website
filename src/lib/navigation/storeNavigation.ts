export type NavItem = {
  label: string;
  href: string;
};

export const primaryNav: NavItem[] = [
  { label: "Shop", href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "Gift Box", href: "/gift-box" },
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Subscriptions", href: "/subscriptions" },
];

/** Legacy account hub cards */
export const accountNav: NavItem[] = [
  { label: "Overview", href: "/account" },
  { label: "Profile", href: "/account/profile" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Security", href: "/account/security" },
];

/** Figma · Tab Nav / Account */
export const accountTabNav: NavItem[] = [
  { label: "Dashboard", href: "/account" },
  { label: "Purchase History", href: "/account/orders" },
  { label: "Profile", href: "/account/profile" },
  { label: "Rewards", href: "/account/rewards" },
  { label: "Membership Benefits", href: "/account/membership" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Reviews", href: "/account/reviews" },
  { label: "Returns", href: "/account/returns" },
  { label: "Saved Items", href: "/account/saved" },
];

export const footerNav = {
  shop: primaryNav,
  help: [
    { label: "Contact", href: "/stores" },
    { label: "Account", href: "/account" },
  ],
} as const;
