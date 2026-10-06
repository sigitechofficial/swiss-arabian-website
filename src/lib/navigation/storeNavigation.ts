export type NavItem = {
  label: string;
  href: string;
};

export const primaryNav: NavItem[] = [
  { label: "Shop", href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "Gift Box", href: "/collections/gift-sets" },
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Subscriptions", href: "/subscriptions" },
];

export const accountNav: NavItem[] = [
  { label: "Overview", href: "/account" },
  { label: "Profile", href: "/account/profile" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Security", href: "/account/security" },
];

export const accountTabNav: NavItem[] = [
  { label: "Dashboard", href: "/account" },
  { label: "Purchase History", href: "/account/orders" },
  { label: "Profile", href: "/account/profile" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Payments", href: "/account/payments" },
  { label: "Rewards", href: "/account/rewards" },
  { label: "Membership Benefits", href: "/account/membership" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Saved Items", href: "/account/saved" },
];

export const footerNav = {
  shop: primaryNav,
  help: [
    { label: "Contact", href: "/stores" },
    { label: "Account", href: "/account" },
  ],
} as const;
