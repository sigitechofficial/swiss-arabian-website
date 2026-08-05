import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { accountContainer } from "@/features/account/constants/accountLayout";

import { SubscriptionHistoryTable } from "./SubscriptionHistoryTable";
import { SubscriptionProgressPanel } from "./SubscriptionProgressPanel";
import { SubscriptionStatusCard } from "./SubscriptionStatusCard";

/** My Subscription — Figma 1236:9875 */
export function MySubscriptionPageView() {
  return (
    <AccountPageShell>
      <AccountPageTitle
        title="My Subscription"
        subtitle="Your scent calendar, deliveries and billing — all in one place."
      />

      <div className={`${accountContainer} flex flex-col gap-6 pb-14 pt-2`}>
        <SubscriptionStatusCard />
        <SubscriptionProgressPanel />
        <div className="pt-4">
          <SubscriptionHistoryTable />
        </div>
      </div>
    </AccountPageShell>
  );
}
