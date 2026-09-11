"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { logoutCustomer } from "@/features/auth/api/auth.service";
import { endSession } from "@/lib/auth/endSession";
import { toastApiError } from "@/lib/api/toastApiError";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { listOrders } from "@/features/account/api/customerOrders.service";
import { OrderCard } from "@/features/orders/components/OrderCard";
import { toOrderSummaryView } from "@/features/orders/utils/toOrderSummaryView";

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

  // Latest real order — shares the "customer-orders" key prefix, so placing an
  // order or cancelling one refreshes this card too.
  const recentQuery = useQuery({
    queryKey: ["customer-orders", "recent"],
    queryFn: () => listOrders({ limit: 1, offset: 0 }),
    staleTime: 60_000,
  });
  const recentOrder = recentQuery.data?.items[0];

  async function handleLogout() {
    try {
      await logoutCustomer();
    } catch (error) {
      toastApiError(error);
    } finally {
      endSession();
      router.push("/");
    }
  }

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
            {recentQuery.isPending ? (
              <p className="text-[13.5px] text-sa-secondary">Loading your latest order…</p>
            ) : recentOrder ? (
              <OrderCard order={toOrderSummaryView(recentOrder)} />
            ) : (
              <p className="text-[13.5px] text-sa-secondary">
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
          onClick={handleLogout}
          className="text-[12px] font-semibold text-sa-secondary hover:text-terra hover:underline"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

/** Account Dashboard */
export function AccountPageView() {
  return (
    <AccountPageShell>
      <DashboardContent />
    </AccountPageShell>
  );
}
