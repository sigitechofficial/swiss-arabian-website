import {
  CircleHelp,
  CreditCard,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Repeat,
  RotateCcw,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type AccountQuickLink = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
};

export const accountQuickLinks: AccountQuickLink[] = [
  {
    icon: Package,
    title: "Orders",
    description: "Track a delivery and see what you’ve bought before.",
    href: "/account/orders",
  },
  {
    icon: UserRound,
    title: "Profile",
    description: "Your name, email, mobile number and password.",
    href: "/account/profile",
  },
  {
    icon: MapPin,
    title: "Addresses",
    description: "Add, edit or remove your delivery addresses.",
    href: "/account/addresses",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "The payments you’ve made on your orders.",
    href: "/account/payments",
  },
  {
    icon: Heart,
    title: "Wishlist",
    description: "The Swiss Arabian scents you’ve saved for later.",
    href: "/account/wishlist",
  },
  {
    icon: Repeat,
    title: "Subscriptions",
    description: "Pending agreements you have registered. No payment is collected here.",
    href: "/account/subscription",
  },
  {
    icon: Gift,
    title: "Rewards",
    description: "Your points, your tier and what they unlock.",
    href: "/account/rewards",
  },
];

export const accountSupportLinks: AccountQuickLink[] = [
  {
    icon: RotateCcw,
    title: "Returns and exchanges",
    description: "Read our exchange and return policy.",
    href: "/faq?topic=order",
  },
  {
    icon: CircleHelp,
    title: "Frequently asked questions",
    description: "Scents, orders, delivery and samples answered.",
    href: "/faq",
  },
  {
    icon: MessageCircle,
    title: "Contact us",
    description: "WhatsApp our team or send us an email.",
    href: "/faq#contact",
  },
];
