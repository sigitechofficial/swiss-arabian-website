"use client";

import { useMemo, useState } from "react";

import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { AccountUnderlineTabs } from "@/features/account/components/AccountTabs";
import { accountContainer } from "@/features/account/constants/accountLayout";

import { purchaseHistoryOrders } from "../data/purchaseHistoryContent";
import { OrderCard } from "./OrderCard";

type ChannelFilter = "all" | "online" | "in-store";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "in-store", label: "In Store" },
] as const satisfies readonly { value: ChannelFilter; label: string }[];

function OrdersGroup({
  title,
  orders,
}: {
  title: string;
  orders: typeof purchaseHistoryOrders;
}) {
  if (!orders.length) return null;

  return (
    <section className={`${accountContainer} pb-2 pt-8`}>
      <h2 className="text-[19px] font-bold text-sa-primary lg:text-[22px]">
        {title}
      </h2>
      <div className="mt-5 flex flex-col gap-7">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}

/** Purchase History — Figma 1205:9002 */
export function PurchaseHistoryPageView() {
  const [filter, setFilter] = useState<ChannelFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return purchaseHistoryOrders;
    const channel = filter === "online" ? "ONLINE" : "IN_STORE";
    return purchaseHistoryOrders.filter((order) => order.channel === channel);
  }, [filter]);

  const active = filtered.filter((order) => order.isActive);
  const past = filtered.filter((order) => !order.isActive);

  return (
    <AccountPageShell>
      <AccountPageTitle title="Purchase History" />

      <div className={accountContainer}>
        <AccountUnderlineTabs
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter purchases by channel"
        />
      </div>

      <OrdersGroup title="Active Orders" orders={active} />
      <OrdersGroup title="Past Purchases" orders={past} />

      {!filtered.length ? (
        <div className={`${accountContainer} py-16`}>
          <p className="text-[15px] text-sa-secondary">
            No purchases in this view yet.
          </p>
        </div>
      ) : null}

      <div className="h-10" />
    </AccountPageShell>
  );
}
