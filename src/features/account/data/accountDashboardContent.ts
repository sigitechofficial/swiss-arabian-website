import {
  BadgeCheck,
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

import type { MessageKey } from "@/lib/i18n/messages";

/** Dashboard tiles. Wording lives in `src/messages/*.json` (`titleKey`, `descriptionKey`). */
export type AccountQuickLink = {
  icon: LucideIcon;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  href: string;
};

export const accountQuickLinks: AccountQuickLink[] = [
  { icon: Package, titleKey: "account.tile.orders", descriptionKey: "account.tile.ordersText", href: "/account/orders" },
  { icon: UserRound, titleKey: "account.tile.profile", descriptionKey: "account.tile.profileText", href: "/account/profile" },
  { icon: MapPin, titleKey: "account.tile.addresses", descriptionKey: "account.tile.addressesText", href: "/account/addresses" },
  { icon: CreditCard, titleKey: "account.tile.payments", descriptionKey: "account.tile.paymentsText", href: "/account/payments" },
  { icon: Heart, titleKey: "account.tile.wishlist", descriptionKey: "account.tile.wishlistText", href: "/account/wishlist" },
  {
    icon: Repeat,
    titleKey: "account.tile.subscriptions",
    descriptionKey: "account.tile.subscriptionsText",
    href: "/account/subscription",
  },
  { icon: Gift, titleKey: "account.tile.rewards", descriptionKey: "account.tile.rewardsText", href: "/account/rewards" },
  {
    icon: BadgeCheck,
    titleKey: "account.tile.employeeBenefits",
    descriptionKey: "account.tile.employeeBenefitsText",
    href: "/account/employee-benefits",
  },
];

export const accountSupportLinks: AccountQuickLink[] = [
  { icon: RotateCcw, titleKey: "account.help.returns", descriptionKey: "account.help.returnsText", href: "/faq?topic=order" },
  { icon: CircleHelp, titleKey: "account.help.faq", descriptionKey: "account.help.faqText", href: "/faq" },
  { icon: MessageCircle, titleKey: "account.help.contact", descriptionKey: "account.help.contactText", href: "/faq#contact" },
];
