"use client";

import { useState } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  AccountStatusPill,
  type AccountStatusTone,
} from "@/features/account/components/AccountStatus";
import {
  useCustomerExchangeDetail,
  useCustomerReturnDetail,
} from "../hooks/useAfterSales";
import type {
  StorefrontExchangeSummaryView,
  StorefrontReturnSummaryView,
} from "../types/afterSales";
import { ExchangeMoneyPanel } from "./ExchangeMoneyPanel";
import { afterSalesOptionLabel, afterSalesStatusLabel } from "../utils/eligibility";
import { formatOrderDate } from "@/features/orders/utils/orderStatus";

function statusTone(status: string): AccountStatusTone {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "REQUESTED":
    case "PENDING_REVIEW":
      return "warning";
    default:
      return "muted";
  }
}

/** "en-AE" short date in English (as before); the page's language otherwise. */
function useRequestDate() {
  const locale = useShopLocale();
  return (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return locale === "en"
      ? date.toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" })
      : formatOrderDate(iso, { locale });
  };
}

export function ReturnRequestCard({
  item,
  expandable = true,
}: {
  item: StorefrontReturnSummaryView;
  expandable?: boolean;
}) {
  const t = useShopCopy();
  const formatDate = useRequestDate();
  const [open, setOpen] = useState(false);
  const detail = useCustomerReturnDetail(open ? item.returnRequestId : null);

  return (
    <article className="border border-sa-border bg-page p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[14px] font-semibold text-sa-primary">
            {item.returnNumber}
          </p>
          <p className="mt-1 text-[13px] text-sa-muted">
            {item.orderNumber ? (
              <LocaleLink
                href={`/account/orders/${item.orderId}`}
                className="font-medium text-terra hover:underline"
              >
                {item.orderNumber}
              </LocaleLink>
            ) : (
              t("account.orderLabel")
            )}
            {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ""}
            {` · ${t("account.itemCount", { count: item.itemCount })}`}
          </p>
        </div>
        <AccountStatusPill
          label={afterSalesStatusLabel(item.status, t)}
          tone={statusTone(item.status)}
        />
      </div>
      <p className="mt-3 text-[13px] text-sa-primary">
        {afterSalesOptionLabel("returnReason", item.reasonCode, t)}
        {" · "}
        {afterSalesOptionLabel("returnResolution", item.requestedResolution, t)}
      </p>
      {item.latestStatusMessage ? (
        <p className="mt-1 text-[13px] leading-relaxed text-sa-muted">
          {item.latestStatusMessage}
        </p>
      ) : null}
      {expandable ? (
        <button
          type="button"
          className="mt-3 text-[13px] font-semibold text-terra hover:underline"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t("afterSales.hideDetails") : t("afterSales.viewDetails")}
        </button>
      ) : null}
      {open && detail.data ? (
        <ul className="mt-4 divide-y divide-sa-border border-t border-sa-border pt-3">
          {detail.data.items.map((line) => (
            <li key={line.itemId} className="py-2.5 text-[13px]">
              <p className="font-semibold text-sa-primary">
                {line.productName ?? line.sku}
              </p>
              <p className="text-sa-muted">
                {t("orders.qty", { count: line.requestedQty })}
                {line.variantName ? ` · ${line.variantName}` : ""}
              </p>
            </li>
          ))}
          {detail.data.customerNote ? (
            <li className="py-2.5 text-[13px] text-sa-muted">
              {t("afterSales.note", { note: detail.data.customerNote })}
            </li>
          ) : null}
        </ul>
      ) : null}
    </article>
  );
}

export function ExchangeRequestCard({
  item,
  expandable = true,
}: {
  item: StorefrontExchangeSummaryView;
  expandable?: boolean;
}) {
  const t = useShopCopy();
  const formatDate = useRequestDate();
  const [open, setOpen] = useState(false);
  const detail = useCustomerExchangeDetail(
    open ? item.exchangeRequestId : null,
  );

  return (
    <article className="border border-sa-border bg-page p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[14px] font-semibold text-sa-primary">
            {item.exchangeNumber}
          </p>
          <p className="mt-1 text-[13px] text-sa-muted">
            {item.orderNumber ? (
              <LocaleLink
                href={`/account/orders/${item.orderId}`}
                className="font-medium text-terra hover:underline"
              >
                {item.orderNumber}
              </LocaleLink>
            ) : (
              t("account.orderLabel")
            )}
            {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ""}
            {` · ${t("account.itemCount", { count: item.itemCount })}`}
          </p>
        </div>
        <AccountStatusPill
          label={afterSalesStatusLabel(item.status, t)}
          tone={statusTone(item.status)}
        />
      </div>
      <p className="mt-3 text-[13px] text-sa-primary">
        {afterSalesOptionLabel("exchangeReason", item.reasonCode, t)}
        {" · "}
        {afterSalesOptionLabel("exchangeType", item.exchangeType, t)}
      </p>
      {item.latestStatusMessage ? (
        <p className="mt-1 text-[13px] leading-relaxed text-sa-muted">
          {item.latestStatusMessage}
        </p>
      ) : null}
      <ExchangeMoneyPanel
        exchangeRequestId={item.exchangeRequestId}
        money={detail.data?.money ?? item.money}
      />
      {expandable ? (
        <button
          type="button"
          className="mt-3 text-[13px] font-semibold text-terra hover:underline"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t("afterSales.hideDetails") : t("afterSales.viewDetails")}
        </button>
      ) : null}
      {open && detail.data ? (
        <ul className="mt-4 divide-y divide-sa-border border-t border-sa-border pt-3">
          {detail.data.items.map((line) => (
            <li key={line.itemId} className="py-2.5 text-[13px]">
              <p className="font-semibold text-sa-primary">
                {line.productName ?? line.sku}
              </p>
              <p className="text-sa-muted">
                {t("orders.qty", { count: line.requestedQty })} → {line.replacementSku}
                {line.replacementSize ? ` (${line.replacementSize})` : ""}
              </p>
            </li>
          ))}
          {detail.data.customerNote ? (
            <li className="py-2.5 text-[13px] text-sa-muted">
              {t("afterSales.note", { note: detail.data.customerNote })}
            </li>
          ) : null}
          {detail.data.money?.replacementOrderId ? (
            <li className="py-2.5 text-[13px]">
              <LocaleLink
                href={`/account/orders/${detail.data.money.replacementOrderId}`}
                className="font-semibold text-terra hover:underline"
              >
                {detail.data.money.replacementOrderNumber ?? t("afterSales.viewReplacement")}
              </LocaleLink>
            </li>
          ) : null}
        </ul>
      ) : null}
    </article>
  );
}

export function GuestReturnRequestCard({
  item,
}: {
  item: StorefrontReturnSummaryView;
}) {
  const t = useShopCopy();
  const formatDate = useRequestDate();
  return (
    <article className="border border-sa-border bg-page p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[14px] font-semibold text-sa-primary">
            {item.returnNumber}
          </p>
          <p className="mt-1 text-[12px] text-sa-muted">
            {formatDate(item.createdAt)}
            {` · ${t("account.itemCount", { count: item.itemCount })}`}
          </p>
        </div>
        <AccountStatusPill
          label={afterSalesStatusLabel(item.status, t)}
          tone={statusTone(item.status)}
        />
      </div>
      {item.latestStatusMessage ? (
        <p className="mt-2 text-[13px] leading-relaxed text-sa-muted">
          {item.latestStatusMessage}
        </p>
      ) : null}
    </article>
  );
}

export function GuestExchangeRequestCard({
  item,
  orderNumber,
  orderAccessToken,
}: {
  item: StorefrontExchangeSummaryView;
  orderNumber: string;
  orderAccessToken: string;
}) {
  const t = useShopCopy();
  const formatDate = useRequestDate();
  return (
    <article className="border border-sa-border bg-page p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[14px] font-semibold text-sa-primary">
            {item.exchangeNumber}
          </p>
          <p className="mt-1 text-[12px] text-sa-muted">
            {formatDate(item.createdAt)}
            {` · ${t("account.itemCount", { count: item.itemCount })}`}
          </p>
        </div>
        <AccountStatusPill
          label={afterSalesStatusLabel(item.status, t)}
          tone={statusTone(item.status)}
        />
      </div>
      {item.latestStatusMessage ? (
        <p className="mt-2 text-[13px] leading-relaxed text-sa-muted">
          {item.latestStatusMessage}
        </p>
      ) : null}
      <ExchangeMoneyPanel
        exchangeRequestId={item.exchangeRequestId}
        money={item.money}
        guest={{ orderNumber, orderAccessToken }}
      />
    </article>
  );
}
