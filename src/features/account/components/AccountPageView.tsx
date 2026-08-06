"use client";

import { useRouter } from "next/navigation";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
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
      <Reveal>
        <AccountDashboardHero firstName={firstName} />
      </Reveal>

      <div className={`${accountContainer} flex flex-col gap-14 py-14`}>
        <Reveal>
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
        </Reveal>

        <Reveal>
          <section>
            <AccountProfileHighlights />
          </section>
        </Reveal>
      </div>

      <Reveal>
        <AccountSectionHead
          eyebrow="My Account"
          title="Account"
          accent="Dashboard"
        />
      </Reveal>
      <div className={`${accountContainer} pb-14`}>
        <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {accountQuickLinks.map((link) => (
            <StaggerItem key={link.title}>
              <AccountCard {...link} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <Reveal>
        <AccountSectionHead eyebrow="Support" title="Need" accent="Help?" />
        <AccountHelpRow />
      </Reveal>
      <div className={`${accountContainer} py-10`}>
        <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {accountSupportLinks.map((link) => (
            <StaggerItem key={link.title}>
              <AccountCard {...link} />
            </StaggerItem>
          ))}
        </Stagger>
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
