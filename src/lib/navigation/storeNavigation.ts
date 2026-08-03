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

export const accountNav: NavItem[] = [
  { label: "Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Security", href: "/account/security" },
];

export const footerNav = {
  shop: primaryNav,
  help: [
    { label: "Contact", href: "/search" },
    { label: "Account", href: "/account" },
  ],
} as const;
