"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { PageLoading } from "@/components/ui/PageLoading";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { localizeHref } from "@/lib/i18n/localePath";
import { useUiStore } from "@/stores/useUiStore";
import { listCustomerAddresses } from "@/features/account/api/customerAccount.service";
import { customerAccountKeys } from "@/features/account/api/customerAccount.keys";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { monthsFromAgreement, TRACKER_DELIVERY_LABEL, TRACKER_PAYMENT_LABEL, type SubscriptionMonthRow } from "../utils/subscriptionMonthlyTracker";
import { SubscriptionCardSetup } from "./SubscriptionCardSetup";
import { SubscriptionMonthlyTracker } from "./SubscriptionMonthlyTracker";

import { SubscriptionManageSection } from "./SubscriptionManageSection";
import { SubscriptionPaymentMethodSection } from "./SubscriptionPaymentMethodSection";
import { SubscriptionPaymentRecoverySection } from "./SubscriptionPaymentRecoverySection";
import {
  cancelSubscription,
  changeSelectionMode,
  getMySubscription,
  getSubscriptionConsent,
  listPlanProducts,
  pauseSubscription,
  replaceSubscriptionQueue,
  resumeSubscription,
  retrySubscriptionPayment,
  skipSubscriptionMonth,
} from "../api/subscription.api";
import { subscriptionKeys } from "../api/subscription.keys";
import type { SubscriptionSelectionMode } from "../types/subscription.types";
import { managementErrorMessage, showSubscriptionManagement } from "../utils/subscriptionManagement";
import {
  activeRegistrationConsent,
  audienceLabel,
  isSubscriptionAudience,
  modeLabel,
  moveVariant,
  QUEUE_CLIENT_LIMIT,
  queueRows,
  selectVariant,
  statusLabel,
  subscriptionPriceLines,
} from "../utils/subscriptionRules";

type Props = { id: string };

export function AccountSubscriptionDetailPageView({ id }: Props) {
  const queryClient = useQueryClient();
  const pathname = usePathname() || "/";
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode || s.selectedMarketId || "");
  const brandCode = useUiStore((s) => s.catalogContext?.brandCode || "");
  const detail = useApiQuery(
    subscriptionKeys.detail(id, zoneCode),
    () => getMySubscription(id, zoneCode),
    { enabled: Boolean(zoneCode && id) },
  );
  const consent = useApiQuery(
    subscriptionKeys.consent(zoneCode, brandCode),
    () => getSubscriptionConsent(zoneCode),
    { enabled: Boolean(zoneCode && (detail.data?.status === "PENDING_ACTIVATION" || detail.data?.actions?.canReplacePaymentMethod === true)) },
  );
  const activeConsent = consent.isSuccess ? activeRegistrationConsent(consent.data) : null;
  const savedAudience = isSubscriptionAudience(detail.data?.audience) ? detail.data.audience : undefined;
  const products = useApiQuery(
    subscriptionKeys.products(detail.data?.planCode ?? "", zoneCode, savedAudience ?? ""),
    () => listPlanProducts(detail.data!.planCode, zoneCode, savedAudience),
    { enabled: Boolean(zoneCode && detail.data?.planCode && detail.data.status === "PENDING_ACTIVATION") },
  );
  const addresses = useApiQuery(customerAccountKeys.addresses(), listCustomerAddresses);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const savedIds = queueRows(detail.data?.queue).map((row) => row.variantId);
  const selected = draft ?? savedIds;
  const allowed = new Set((products.data ?? []).map((item) => item.variantId));
  savedIds.forEach((variantId) => allowed.add(variantId));
  const address = addresses.data?.find((item) => item.id === detail.data?.customerAddressId);
  const open = detail.data?.status === "PENDING_ACTIVATION";

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id, zoneCode) });
    await queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine(zoneCode) });
  }

  async function saveQueue() {
    if (detail.data?.selectionMode === "QUEUE" && selected.length > QUEUE_CLIENT_LIMIT) {
      setError("A queue can hold 12 fragrances.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await replaceSubscriptionQueue(id, zoneCode, selected);
      setDraft(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "The queue could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function switchMode(mode: SubscriptionSelectionMode) {
    setBusy(true);
    setError(null);
    try {
      await changeSelectionMode(id, zoneCode, mode);
      setDraft(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The selection mode could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function runManagement(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(managementErrorMessage(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      await cancelSubscription(id, zoneCode);
      if (detail.data?.planCode) sessionStorage.removeItem(`sa-sub-agreement:${detail.data.planCode}`);
      setConfirmCancel(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "This agreement could not be cancelled.");
    } finally {
      setBusy(false);
    }
  }

  const months = detail.data ? monthsFromAgreement(detail.data) : [];
  const currentMonth = [...months].reverse().find((row) => row.orderId) ?? months.find((row) => row.payment === "PROCESSING") ?? months[0];
  const price = detail.data ? subscriptionPriceLines(detail.data) : null;
  const completed = months.filter((row) => row.payment === "PAID" || row.payment === "SKIPPED").length;

  return (
    <AccountPageShell>
      <div className={`${accountContainer} flex flex-col gap-6 pt-7 pb-16 text-[#2B1D17] sm:pt-8`}>
        {detail.isLoading ? <PageLoading label="Loading this agreement…" /> : null}
        {detail.isError ? <p role="alert">{detail.error.message}</p> : null}
        {detail.data ? (
          <>
            <div className="flex flex-col gap-3.5">
              <LocaleLink href="/account/subscription" className="inline-flex min-h-8 items-center self-start text-sm font-semibold text-[#8E4636] no-underline">
                All subscriptions
              </LocaleLink>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="m-0 text-[2rem] font-semibold tracking-[-0.01em]">
                      {detail.data.audience === "WOMEN" ? "Women's" : detail.data.audience === "MEN" ? "Men's" : "Fragrance"} fragrance subscription
                    </h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F1E6] px-3 py-1 text-[13px] font-medium text-[#1F5B30]">
                      <span className="size-2 rounded-full bg-[#2E7D45]" />
                      {statusLabel(detail.data.status)}
                    </span>
                  </div>
                  <p className="m-0 text-[15px] text-[#6E5A50]">
                    12-month plan · Agreement <strong className="font-semibold tracking-[0.04em] text-[#2B1D17]">{detail.data.planCode}</strong> · {modeLabel(detail.data.selectionMode)}
                  </p>
                </div>
              </div>
            </div>
            <section aria-label="Subscription summary" className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
              <Summary label="MONTHLY TOTAL" value={price?.available ? `${detail.data.currencyCode} ${price.totalAmount}` : "—"} hint={`${detail.data.currencyCode} ${detail.data.amount} fragrance + ${detail.data.shippingMode === "EXTRA_FIXED" ? `${detail.data.currencyCode} ${detail.data.shippingAmount} shipping` : "shipping included"}`} />
              <Summary label="NEXT BILLING" value={detail.data.nextBillingAt ? new Date(detail.data.nextBillingAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not scheduled"} hint={detail.data.nextBillingAt ? `Next billing ${new Date(detail.data.nextBillingAt).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })}` : detail.data.status === "PENDING_ACTIVATION" ? "No payment has been taken." : "The next saved billing date"} />
              <Summary label="PLAN PROGRESS" value={`${completed} of ${months.length || 12} months`} hint="Paid or skipped months" />
              <Summary label="QUEUE" value={detail.data.audience ? audienceLabel(detail.data.audience) : "Saved picks"} hint={audienceLabel(detail.data.audience)} />
            </section>
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-6">
                {currentMonth ? <MonthHero month={currentMonth} /> : null}
                <SubscriptionMonthlyTracker detail={detail.data} />
              </div>
              <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
                <section className="flex flex-col gap-3.5 rounded-[20px] border border-[#E6DCCB] bg-white p-[22px]">
                  <h2 className="m-0 text-lg font-semibold">Billing</h2>
                  <dl className="m-0 flex flex-col gap-2.5 text-sm">
                    <div className="flex justify-between"><dt className="text-[#6E5A50]">Fragrance</dt><dd className="m-0 font-semibold">{detail.data.currencyCode} {detail.data.amount}</dd></div>
                    <div className="flex justify-between"><dt className="text-[#6E5A50]">Shipping</dt><dd className="m-0 font-semibold">{detail.data.shippingMode === "EXTRA_FIXED" ? `${detail.data.currencyCode} ${detail.data.shippingAmount}` : "Included"}</dd></div>
                    <div className="h-px bg-[#EDE4D6]" />
                    <div className="flex justify-between text-base"><dt className="font-semibold">Monthly total</dt><dd className="m-0 font-semibold">{price?.available ? `${detail.data.currencyCode} ${price.totalAmount}` : "—"}</dd></div>
                  </dl>
                  {detail.data.paymentMethod || detail.data.actions?.canReplacePaymentMethod ? (
                    <SubscriptionPaymentMethodSection
                      embedded
                      subscriptionId={id}
                      zoneCode={zoneCode}
                      paymentMethod={detail.data.paymentMethod}
                      canReplace={detail.data.actions?.canReplacePaymentMethod === true}
                      consent={activeConsent ? { version: activeConsent.version, text: activeConsent.text } : null}
                      returnPath={localizeHref(pathname, pathname)}
                      nextChargeLabel={detail.data.nextBillingAt ? `Next charge ${new Date(detail.data.nextBillingAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : null}
                      onSaved={refresh}
                    />
                  ) : null}
                </section>
                {address ? (
                  <p className="m-0 text-sm break-words text-[#6E5A50]">
                    {[address.address1, address.city, address.country].filter(Boolean).join(", ")}
                  </p>
                ) : null}
                {detail.data.paymentRecovery && detail.data.paymentRecovery.status !== "NONE" ? (
                  <SubscriptionPaymentRecoverySection
                    recovery={detail.data.paymentRecovery}
                    canReplace={detail.data.actions?.canReplacePaymentMethod === true}
                    onRetry={async () => {
                      const next = await retrySubscriptionPayment(id, zoneCode);
                      queryClient.setQueryData(subscriptionKeys.detail(id, zoneCode), next);
                      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine(zoneCode) });
                      await queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id, zoneCode) });
                    }}
                    onRefresh={refresh}
                  />
                ) : null}
                {showSubscriptionManagement(detail.data) ? (
                  <SubscriptionManageSection
                    actions={detail.data.actions}
                    status={detail.data.status}
                    pausedAt={detail.data.pausedAt}
                    renewalChargePending={detail.data.renewalChargePending}
                    busy={busy}
                    onPause={() => runManagement(() => pauseSubscription(id, zoneCode))}
                    onResume={() => runManagement(() => resumeSubscription(id, zoneCode))}
                    onSkip={(idempotencyKey) => runManagement(() => skipSubscriptionMonth(id, zoneCode, idempotencyKey))}
                    onCancel={() => runManagement(async () => {
                      await cancelSubscription(id, zoneCode);
                      if (detail.data?.planCode) sessionStorage.removeItem(`sa-sub-agreement:${detail.data.planCode}`);
                    })}
                  />
                ) : null}
                {detail.data.events && detail.data.events.length > 0 ? (
                  <ul className="m-0 list-none p-0 text-[13px] text-[#6E5A50]">
                    {detail.data.events.map((event) => (
                      <li key={event.id}>{event.eventType}{event.reason ? ` — ${event.reason}` : ""}</li>
                    ))}
                  </ul>
                ) : null}
              </aside>
            </div>
          </>
        ) : null}

        {open && activeConsent ? (
          <SubscriptionCardSetup
            zoneCode={zoneCode}
            consentVersion={activeConsent.version}
            consentText={activeConsent.text}
            returnPath={localizeHref(pathname, pathname)}
          />
        ) : null}

        {open && detail.data && detail.data.selectionMode !== "SURPRISE" ? (
          <div className={accountPanel}>
            <div className={`${accountPanelBody} flex flex-col gap-3`}>
              <h2 className="m-0 text-[1rem] font-semibold">Edit queue</h2>
              {(products.data ?? []).map((item) => (
                <button
                  key={item.variantId}
                  type="button"
                  className="h-11 text-left break-words underline"
                  onClick={() => {
                    try {
                      setDraft(selectVariant(detail.data!.selectionMode, selected, item.variantId, allowed));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "That fragrance cannot be added.");
                    }
                  }}
                >
                  Add {item.name}
                </button>
              ))}
              <ol className="list-decimal ps-5">
                {selected.map((variantId, index) => (
                  <li key={variantId} className="mt-2 break-words">
                    {products.data?.find((item) => item.variantId === variantId)?.name ??
                      queueRows(detail.data?.queue).find((row) => row.variantId === variantId)?.sku ??
                      variantId}
                    <button type="button" className="ms-2 h-11 underline" onClick={() => setDraft(moveVariant(selected, index, -1))}>
                      Up
                    </button>
                    <button type="button" className="ms-2 h-11 underline" onClick={() => setDraft(moveVariant(selected, index, 1))}>
                      Down
                    </button>
                    <button
                      type="button"
                      className="ms-2 h-11 underline"
                      onClick={() => setDraft(selected.filter((value) => value !== variantId))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ol>
              <button type="button" className="h-11 w-fit underline" disabled={busy} onClick={() => void saveQueue()}>
                Save queue
              </button>
            </div>
          </div>
        ) : null}

        {open && detail.data ? (
          <div className="flex flex-wrap gap-2">
            {(["REPLENISHMENT", "QUEUE", "SURPRISE"] as const)
              .filter((mode) => mode !== detail.data?.selectionMode)
              .filter((mode) => mode !== "SURPRISE" || isSubscriptionAudience(detail.data?.audience))
              .map((mode) => (
                <button key={mode} type="button" className="h-11 rounded-full border px-4" disabled={busy} onClick={() => void switchMode(mode)}>
                  Switch to {modeLabel(mode)}
                </button>
              ))}
          </div>
        ) : null}

        {error ? <p role="alert">{error}</p> : null}

        {open && !detail.data?.actions ? (
          confirmCancel ? (
            <div>
              <p>Cancel this agreement? This does not refund a payment, because none was collected.</p>
              <button type="button" className="mt-2 h-11 underline" disabled={busy} onClick={() => void cancel()}>
                Confirm cancellation
              </button>
              <button type="button" className="ms-3 h-11 underline" onClick={() => setConfirmCancel(false)}>
                Keep agreement
              </button>
            </div>
          ) : (
            <button type="button" className="h-11 w-fit underline" onClick={() => setConfirmCancel(true)}>
              Cancel agreement
            </button>
          )
        ) : null}
      </div>
    </AccountPageShell>
  );
}

function MonthHero({ month }: { month: SubscriptionMonthRow }) {
  const paid = month.payment === "PAID" || month.delivery === "SHIPPED" || month.delivery === "DELIVERED";
  const processing = month.payment === "PROCESSING" || month.delivery === "PROCESSING" || month.delivery === "ORDER_PENDING";
  const shipped = month.delivery === "SHIPPED" || month.delivery === "DELIVERED";
  const delivered = month.delivery === "DELIVERED";
  const steps = [
    { label: "Paid", on: paid },
    { label: "Processing", on: processing || shipped },
    { label: "Shipped", on: shipped },
    { label: "Delivered", on: delivered },
  ];
  const when = month.billingDate
    ? new Date(month.billingDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase()
    : null;
  return (
    <section className="flex flex-wrap gap-6 rounded-[20px] border border-[#E6DCCB] bg-white p-6">
      <div className="relative flex h-60 w-[220px] items-center justify-center overflow-hidden rounded-2xl bg-[#F1E6D6]">
        <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-[#2B1D17]">{month.label}</span>
        {month.imageUrl ? <img src={month.imageUrl} alt="" className="h-full w-full object-contain p-8" /> : <BottleMark large />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="text-xs font-medium tracking-[0.08em] text-[#6E5A50]">{month.orderId ? "LATEST SHIPMENT" : "NEXT FRAGRANCE"}{when ? ` · ${when}` : ""}</span>
        <h2 className="m-0 text-[1.7rem] font-semibold">{month.fragrance ?? "No fragrance saved yet"}</h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#E3F1E6] px-3 py-1 text-[13px] font-medium text-[#1F5B30]">{TRACKER_PAYMENT_LABEL[month.payment]}</span>
          {month.delivery !== "NOT_CREATED" ? (
            <span className="rounded-full bg-[#F6E7D4] px-3 py-1 text-[13px] font-medium text-[#7A4B0B]">{TRACKER_DELIVERY_LABEL[month.delivery]}</span>
          ) : null}
          {month.orderNumber ? <span className="rounded-full bg-[#F3EEE6] px-3 py-1 text-[13px] font-medium text-[#5A463C]">Order {month.orderNumber}</span> : null}
        </div>
        <ol className="m-0 flex list-none items-center gap-2 p-0 text-[13px]">
          {steps.map((step, index) => (
            <li key={step.label} className="flex items-center gap-2">
              <span className={`flex size-5 items-center justify-center rounded-full border text-[11px] ${step.on ? "border-[#8E4636] bg-[#8E4636] text-white" : "border-[#D9CBB6] text-[#B9A68F]"}`}>{step.on ? "✓" : ""}</span>
              <span className={step.on ? "font-medium text-[#8E4636]" : "text-[#6E5A50]"}>{step.label}</span>
              {index < steps.length - 1 ? <span className="h-px w-6 bg-[#E6DCCB]" /> : null}
            </li>
          ))}
        </ol>
        {month.orderId ? (
          <LocaleLink href={`/account/orders/${month.orderId}`} className="inline-flex h-11 w-fit items-center rounded-full border border-[#C9B49C] bg-white px-5 text-sm font-semibold text-[#2B1D17] no-underline">
            View order details
          </LocaleLink>
        ) : null}
      </div>
    </section>
  );
}

function BottleMark({ large = false }: { large?: boolean }) {
  const size = large ? 120 : 28;
  return (
    <svg width={size} height={size} viewBox="0 0 120 160" aria-hidden="true">
      <rect x="47" y="10" width="26" height="24" rx="4" fill="#C9A46A" />
      <rect x="53" y="34" width="14" height="10" fill="#A9814B" />
      <rect x="24" y="44" width="72" height="104" rx="16" fill="#8E4636" />
      <rect x="42" y="84" width="36" height="30" rx="3" fill="#F8F4EC" />
    </svg>
  );
}

function Summary({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="flex min-h-[118px] flex-col gap-1.5 rounded-[18px] border border-[#E6DCCB] bg-white px-[18px] py-4">
      <span className="text-[11px] font-bold tracking-[0.08em] text-[#6E5A50]">{label}</span>
      <strong className="text-[22px] font-semibold tracking-[-0.01em]">{value}</strong>
      <span className="text-[13px] text-[#6E5A50]">{hint}</span>
    </article>
  );
}
