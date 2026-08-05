"use client";

import Link from "next/link";

import { toast } from "@/components/ui/Toaster";

import { AccountSectionHeading } from "./AccountSectionHeading";

type HighlightCard = {
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
};

/** Figma · profile-grid (1110:9358) */
const CARDS: HighlightCard[] = [
  {
    title: "Shipping Address",
    description: "Add your shipping addresses for faster checkout.",
    actionLabel: "Add address",
    href: "/account/addresses",
  },
  {
    title: "Payment Method",
    description:
      "You have no saved payment methods. Add one for faster checkout.",
    actionLabel: "Add payment",
    href: "/account/payments",
  },
  {
    title: "Questions? Bring them on (all of them)",
    description: "Get quick answers to your questions, chat with us, and more.",
    actionLabel: "Get help",
  },
];

export function AccountProfileHighlights() {
  return (
    <div className="flex flex-col gap-5">
      <AccountSectionHeading
        title="Profile"
        linkLabel="View profile"
        href="/account/profile"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.title}
            className="flex flex-col gap-2.5 border border-[#c8baa8] bg-paper px-7 py-8 dark:border-sa-border dark:bg-surface"
          >
            <p className="text-[16px] font-bold text-sa-primary">
              {card.title}
            </p>
            <p className="text-[13.5px] leading-relaxed text-sa-secondary">
              {card.description}
            </p>
            {card.href ? (
              <Link
                href={card.href}
                className="mt-auto text-[13px] font-medium text-terra hover:underline"
              >
                {card.actionLabel} &nbsp;→
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => toast("Support chat will be available soon.", "info")}
                className="mt-auto text-left text-[13px] font-medium text-terra hover:underline"
              >
                {card.actionLabel} &nbsp;→
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
