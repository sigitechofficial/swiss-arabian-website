"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  afterSalesStatusLabel,
  RETURN_REASON_LABELS,
  RETURN_RESOLUTION_LABELS,
  EXCHANGE_REASON_LABELS,
  EXCHANGE_TYPE_LABELS,
} from "../utils/eligibility";

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

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReturnRequestCard({
  item,
  expandable = true,
}: {
  item: StorefrontReturnSummaryView;
  expandable?: boolean;
}) {
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
              <Link
                href={`/account/orders/${item.orderId}`}
                className="font-medium text-terra hover:underline"
              >
                {item.orderNumber}
              </Link>
            ) : (
              "Order"
            )}
            {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ""}
            {` · ${item.itemCount} item${item.itemCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <AccountStatusPill
          label={afterSalesStatusLabel(item.status)}
          tone={statusTone(item.status)}
        />
      </div>
      <p className="mt-3 text-[13px] text-sa-primary">
        {RETURN_REASON_LABELS[item.reasonCode] ?? item.reasonCode}
        {" · "}
        {RETURN_RESOLUTION_LABELS[item.requestedResolution] ??
          item.requestedResolution}
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
          {open ? "Hide details" : "View details"}
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
                Qty {line.requestedQty}
                {line.variantName ? ` · ${line.variantName}` : ""}
              </p>
            </li>
          ))}
          {detail.data.customerNote ? (
            <li className="py-2.5 text-[13px] text-sa-muted">
              Note: {detail.data.customerNote}
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
              <Link
                href={`/account/orders/${item.orderId}`}
                className="font-medium text-terra hover:underline"
              >
                {item.orderNumber}
              </Link>
            ) : (
              "Order"
            )}
            {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ""}
            {` · ${item.itemCount} item${item.itemCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <AccountStatusPill
          label={afterSalesStatusLabel(item.status)}
          tone={statusTone(item.status)}
        />
      </div>
      <p className="mt-3 text-[13px] text-sa-primary">
        {EXCHANGE_REASON_LABELS[item.reasonCode] ?? item.reasonCode}
        {" · "}
        {EXCHANGE_TYPE_LABELS[item.exchangeType] ?? item.exchangeType}
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
          {open ? "Hide details" : "View details"}
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
                Qty {line.requestedQty} → {line.replacementSku}
                {line.replacementSize ? ` (${line.replacementSize})` : ""}
              </p>
            </li>
          ))}
          {detail.data.customerNote ? (
            <li className="py-2.5 text-[13px] text-sa-muted">
              Note: {detail.data.customerNote}
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
  return (
    <article className="border border-sa-border bg-page p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[14px] font-semibold text-sa-primary">
            {item.returnNumber}
          </p>
          <p className="mt-1 text-[12px] text-sa-muted">
            {formatDate(item.createdAt)}
            {` · ${item.itemCount} item${item.itemCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <AccountStatusPill
          label={afterSalesStatusLabel(item.status)}
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
}: {
  item: StorefrontExchangeSummaryView;
}) {
  return (
    <article className="border border-sa-border bg-page p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[14px] font-semibold text-sa-primary">
            {item.exchangeNumber}
          </p>
          <p className="mt-1 text-[12px] text-sa-muted">
            {formatDate(item.createdAt)}
            {` · ${item.itemCount} item${item.itemCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <AccountStatusPill
          label={afterSalesStatusLabel(item.status)}
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
