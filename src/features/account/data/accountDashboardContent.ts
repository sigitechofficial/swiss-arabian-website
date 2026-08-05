import { accountAssets } from "../constants/accountAssets";

export type AccountQuickLink = {
  icon: string;
  title: string;
  description: string;
  href?: string;
};

/** Figma · card-grid (1098:9684) */
export const accountQuickLinks: AccountQuickLink[] = [
  {
    icon: accountAssets.icons.orders,
    title: "Order History",
    description:
      "Track your orders, start a return, or view previous purchases.",
    href: "/account/orders",
  },
  {
    icon: accountAssets.icons.payments,
    title: "My Payments",
    description: "Manage your saved cards and payment methods.",
    href: "/account/payments",
  },
  {
    icon: accountAssets.icons.wishlist,
    title: "Wishlist",
    description: "View and manage your favourite Swiss Arabian scents.",
    href: "/account/wishlist",
  },
  {
    icon: accountAssets.icons.profile,
    title: "Profile",
    description: "Edit your name, password, and manage your email.",
    href: "/account/profile",
  },
  {
    icon: accountAssets.icons.addresses,
    title: "My Addresses",
    description: "Add, edit, or remove your delivery addresses.",
    href: "/account/addresses",
  },
];

/** Figma · card-grid (1098:9690) */
export const accountSupportLinks: AccountQuickLink[] = [
  {
    icon: accountAssets.icons.returnsFaq,
    title: "Returns FAQ",
    description:
      "Questions about returns? Read our exchange and return policy.",
  },
  {
    icon: accountAssets.icons.faq,
    title: "Swiss Arabian FAQ",
    description:
      "Browse our FAQs — scents, orders, delivery and samples answered.",
  },
  {
    icon: accountAssets.icons.contact,
    title: "Contact Us",
    description: "WhatsApp our team, email us, or find quick answers.",
  },
];
