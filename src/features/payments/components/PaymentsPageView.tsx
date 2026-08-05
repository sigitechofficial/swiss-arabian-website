"use client";

import Image from "next/image";

import { toast } from "@/components/ui/Toaster";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { accountAssets } from "@/features/account/constants/accountAssets";
import { accountContainer } from "@/features/account/constants/accountLayout";

import { savedCards } from "../data/paymentsContent";
import {
  AddPaymentMethodCard,
  PaymentMethodCard,
} from "./PaymentMethodCard";
import { TransactionHistory } from "./TransactionHistory";

/** Payments — Figma 1318:10242 */
export function PaymentsPageView() {
  return (
    <AccountPageShell>
      <AccountPageTitle
        title="Payments"
        subtitle="Your cards, billing and every transaction — in one place."
      />

      <section className={`${accountContainer} pt-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[19px] font-bold text-sa-primary lg:text-[22px]">
              Payment methods
            </h2>
            <p className="mt-1 text-[13px] text-sa-secondary">
              Used for orders and your monthly subscription charge.
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast("Adding a card will be available soon.", "info")}
            className="border border-sa-border px-3.5 py-2 text-[12px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra"
          >
            + Add new card
          </button>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedCards.map((card) => (
            <PaymentMethodCard key={card.id} card={card} />
          ))}
          <AddPaymentMethodCard />
        </div>

        <p className="mt-5 flex items-start gap-2.5 text-[13px] leading-relaxed text-sa-secondary">
          <Image
            src={accountAssets.dots.paid}
            alt=""
            width={8}
            height={8}
            className="mt-[7px] h-2 w-2 shrink-0"
          />
          Card details are encrypted and handled by our secure payment provider
          — Swiss Arabian never stores your full card number.
        </p>
      </section>

      <section className={`${accountContainer} pb-14 pt-10`}>
        <h2 className="text-[19px] font-bold text-sa-primary lg:text-[22px]">
          Transaction history
        </h2>
        <p className="mt-1 text-[13px] text-sa-secondary">
          Every charge, subscription payment and refund.
        </p>
        <div className="mt-5">
          <TransactionHistory />
        </div>
      </section>
    </AccountPageShell>
  );
}
