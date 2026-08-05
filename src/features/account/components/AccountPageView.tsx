"use client";

import { useRouter } from "next/navigation";

import { performLogout } from "@/features/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { purchaseHistoryOrders } from "@/features/orders/data/purchaseHistoryContent";

import { accountContainer } from "../constants/accountLayout";
import {
  accountQuickLinks,
  accountSupportLinks,
} from "../data/accountDashboardContent";
import { AccountBreadcrumb } from "./AccountBreadcrumb";
import { AccountCard } from "./AccountCard";
import { AccountDashboardHero } from "./AccountDashboardHero";
import { AccountHelpRow } from "./AccountHelpRow";
import { AccountPageShell } from "./AccountPageShell";
import { AccountProfileHighlights } from "./AccountProfileHighlights";
import { AccountSectionHead } from "./AccountSectionHead";
import { AccountSectionHeading } from "./AccountSectionHeading";

function DashboardContent() {
  const user = useCurrentUser();
  const router = useRouter();
  const firstName =
    user?.firstName?.trim() ||
    user?.fullName?.trim().split(/\s+/)[0] ||
    "there";
  const recentOrder = purchaseHistoryOrders[0];

  return (
    <>
      <AccountBreadcrumb label="Account Dashboard" />
      <AccountDashboardHero firstName={firstName} />

      <div className={`${accountContainer} flex flex-col gap-14 py-14`}>
        <section className="flex flex-col gap-5">
          <AccountSectionHeading
            title="Recent purchase"
            linkLabel="View all purchases"
            href="/account/orders"
          />
          {recentOrder ? (
            <OrderCard order={recentOrder} />
          ) : (
            <p className="text-[15px] text-sa-secondary">
              You have no purchases yet.
            </p>
          )}
        </section>

        <section>
          <AccountProfileHighlights />
        </section>
      </div>

      <AccountSectionHead
        eyebrow="My Account"
        title="Account"
        accent="Dashboard"
      />
      <div className={`${accountContainer} grid gap-5 pb-14 md:grid-cols-2 lg:grid-cols-3`}>
        {accountQuickLinks.map((link) => (
          <AccountCard key={link.title} {...link} />
        ))}
      </div>

      <AccountSectionHead eyebrow="Support" title="Need" accent="Help?" />
      <AccountHelpRow />
      <div className={`${accountContainer} grid gap-5 py-10 md:grid-cols-2 lg:grid-cols-3`}>
        {accountSupportLinks.map((link) => (
          <AccountCard key={link.title} {...link} />
        ))}
      </div>

      <div className={`${accountContainer} pb-12`}>
        <button
          type="button"
          onClick={async () => {
            await performLogout();
            router.push("/");
          }}
          className="text-[13px] font-semibold text-sa-secondary hover:text-terra hover:underline"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

/** Account Dashboard — Figma 1068:2 · 1098:9661 */
export function AccountPageView() {
  return (
    <AccountPageShell>
      <DashboardContent />
    </AccountPageShell>
  );
}
