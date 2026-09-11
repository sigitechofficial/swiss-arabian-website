"use client";

import Link from "next/link";

import { Stagger, StaggerItem } from "@/components/motion";
import { useApiQuery } from "@/lib/api/queryHooks";

import { customerAccountKeys } from "../api/customerAccount.keys";
import { listCustomerAddresses } from "../api/customerAccount.service";
import { countryNameForCode } from "../schemas/addressBook.schema";
import { AccountSectionHeading } from "./AccountSectionHeading";

type HighlightCard = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
};

export function AccountProfileHighlights() {
  // Shares the address book's cache, so edits there update this card.
  const addresses = useApiQuery(customerAccountKeys.addresses(), listCustomerAddresses);
  const saved = addresses.data ?? [];
  const primary = saved.find((a) => a.isDefaultShipping) ?? saved[0];

  const shippingCard: HighlightCard = primary
    ? {
        title: "Shipping Address",
        description: [
          primary.fullName || [primary.firstName, primary.lastName].filter(Boolean).join(" "),
          [primary.address1, primary.city].filter(Boolean).join(", "),
          primary.country || countryNameForCode(primary.countryCode ?? ""),
        ]
          .filter(Boolean)
          .join(" · "),
        actionLabel: saved.length > 1 ? `Manage ${saved.length} addresses` : "Manage addresses",
        href: "/account/addresses",
      }
    : {
        title: "Shipping Address",
        description: "Add your shipping addresses for faster checkout.",
        actionLabel: "Add address",
        href: "/account/addresses",
      };

  const cards: HighlightCard[] = [
    shippingCard,
    {
      title: "Payment Method",
      description: "Pay by card, cash on delivery or Tabby at checkout, and see every payment you’ve made.",
      actionLabel: "View payments",
      href: "/account/payments",
    },
    {
      title: "Questions? Bring them on (all of them)",
      description: "Get quick answers to your questions, chat with us, and more.",
      actionLabel: "Get help",
      href: "/faq",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <AccountSectionHeading title="Profile" linkLabel="View profile" href="/account/profile" />
      <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StaggerItem key={card.title}>
            <div className="flex h-full flex-col gap-2.5 rounded-lg border border-[#c8baa8] bg-paper px-7 py-8 dark:border-sa-border dark:bg-surface">
              <p className="text-[14.5px] font-bold text-sa-primary">{card.title}</p>
              <p className="text-[12.5px] leading-relaxed text-sa-secondary">{card.description}</p>
              <Link href={card.href} className="mt-auto text-[12px] font-medium text-terra hover:underline">
                {card.actionLabel} &nbsp;→
              </Link>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
