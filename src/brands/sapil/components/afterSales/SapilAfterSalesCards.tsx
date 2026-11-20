"use client";

import { useState } from "react";
import { useCustomerExchangeDetail, useCustomerReturnDetail } from "@/features/afterSales/hooks/useAfterSales";
import { useExchangeMoney, type ExchangeGuestProof } from "@/features/afterSales/hooks/useExchangeMoney";
import { useRequestDate } from "@/features/afterSales/hooks/useRequestDate";
import type {
  ExchangeMoneyView,
  StorefrontExchangeSummaryView,
  StorefrontReturnSummaryView,
} from "@/features/afterSales/types/afterSales";
import { afterSalesOptionLabel, afterSalesStatusLabel } from "@/features/afterSales/utils/eligibility";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Button, cx } from "../../ui";
import { StatusPill } from "../account/AccountChrome";
import { SapilLink } from "../shared/SapilLink";
import { requestUnitCount } from "@/features/afterSales/utils/requestUnits";

const CARD = "rounded-[20px] bg-sapil-white p-[20px] max-600:p-[16px]";
const LINK = "font-[600] text-sapil-accent underline underline-offset-[3px]";

/** The exchange's money: pay the price difference, or the status of a difference refund (shared useExchangeMoney). */
function SapilExchangeMoney({
  exchangeRequestId,
  money,
  guest,
}: {
  exchangeRequestId: string;
  money: ExchangeMoneyView | null | undefined;
  guest?: ExchangeGuestProof;
}) {
  const view = useExchangeMoney({ exchangeRequestId, money, guest });
  if (!view) return null;
  return (
    <div data-sapil="exchange-money" data-action={view.action} className="mt-[14px] rounded-[16px] bg-sapil-paper p-[14px] text-[14px]">
      <p className="font-[600]">
        {view.title}
        {view.amount ? <span dir="ltr">{` ${view.amount}`}</span> : null}
      </p>
      <p role={view.confirming ? "status" : undefined} className="mt-[4px] leading-[1.5] text-sapil-ink-2">
        {view.body}
      </p>
      {view.offerNote ? <p className="mt-[4px] leading-[1.5] text-sapil-ink-2">{view.offerNote}</p> : null}
      {view.unconfirmedNote ? (
        <p role="status" className="mt-[4px] leading-[1.5] text-sapil-ink-2">
          {view.unconfirmedNote}
        </p>
      ) : null}
      {view.error ? (
        <p role="alert" className="mt-[4px] leading-[1.5] text-sapil-sale">
          {view.error}
        </p>
      ) : null}
      {view.canPay ? (
        <Button onClick={view.pay} disabled={view.opening} className={cx("mt-[10px] !h-[44px] !px-[18px] !text-[14px]", view.opening && "opacity-60 cursor-wait")}>
          {view.payLabel}
        </Button>
      ) : null}
    </div>
  );
}

function CardHead({
  number,
  status,
  meta,
}: {
  number: string;
  status: string;
  meta: React.ReactNode;
}) {
  const t = useShopCopy();
  return (
    <div className="flex flex-wrap items-start justify-between gap-[12px]">
      <div className="min-w-0">
        <b className="block font-[700] text-[16px]" dir="ltr">
          {number}
        </b>
        <p className="text-[14px] text-sapil-ink-2 mt-[2px]">{meta}</p>
      </div>
      <StatusPill status={status} label={afterSalesStatusLabel(status, t)} />
    </div>
  );
}

function OrderMeta({ orderId, orderNumber, createdAt, itemCount }: { orderId?: string; orderNumber?: string | null; createdAt?: string | null; itemCount: number }) {
  const t = useShopCopy();
  const date = useRequestDate();
  return (
    <>
      {orderId && orderNumber ? (
        <>
          <SapilLink href={`/account/orders/${encodeURIComponent(orderId)}`} className="underline" dir="ltr">
            {orderNumber}
          </SapilLink>
          {" · "}
        </>
      ) : null}
      {createdAt ? `${date(createdAt)} · ` : ""}
      {t("account.itemCount", { count: itemCount })}
    </>
  );
}

/** A return request (signed-in customer): status, reason, the latest message, and its items on demand. */
export function SapilReturnCard({ item, showOrder = true }: { item: StorefrontReturnSummaryView; showOrder?: boolean }) {
  const t = useShopCopy();
  const [open, setOpen] = useState(false);
  const detail = useCustomerReturnDetail(open ? item.returnRequestId : null);
  return (
    <article className={CARD} data-sapil="return-request">
      <CardHead
        number={item.returnNumber}
        status={item.status}
        meta={<OrderMeta orderId={showOrder ? item.orderId : undefined} orderNumber={item.orderNumber} createdAt={item.createdAt} itemCount={requestUnitCount(item)} />}
      />
      <p className="mt-[10px] text-[14px]">
        {afterSalesOptionLabel("returnReason", item.reasonCode, t)} · {afterSalesOptionLabel("returnResolution", item.requestedResolution, t)}
      </p>
      {item.latestStatusMessage ? <p className="mt-[4px] text-[14px] leading-[1.5] text-sapil-ink-2">{item.latestStatusMessage}</p> : null}
      <button type="button" aria-expanded={open} className={cx(LINK, "mt-[12px] text-[14px]")} onClick={() => setOpen((value) => !value)}>
        {open ? t("afterSales.hideDetails") : t("afterSales.viewDetails")}
      </button>
      {open && detail.data ? (
        <ul className="list-none p-0 mt-[12px] border-t border-sapil-line">
          {detail.data.items.map((line) => (
            <li key={line.itemId} className="py-[10px] border-b border-sapil-line last:border-b-0 text-[14px]">
              <b className="font-[600]">{line.productName ?? line.sku}</b>
              <span className="block text-sapil-ink-2">
                {t("orders.qty", { count: line.requestedQty })}
                {line.variantName ? ` · ${line.variantName}` : ""}
              </span>
            </li>
          ))}
          {detail.data.customerNote ? (
            <li className="py-[10px] text-[14px] text-sapil-ink-2">{t("afterSales.note", { note: detail.data.customerNote })}</li>
          ) : null}
        </ul>
      ) : null}
    </article>
  );
}

/** An exchange request (signed-in customer): as a return, plus the price difference and the replacement order. */
export function SapilExchangeCard({ item, showOrder = true }: { item: StorefrontExchangeSummaryView; showOrder?: boolean }) {
  const t = useShopCopy();
  const [open, setOpen] = useState(false);
  const detail = useCustomerExchangeDetail(open ? item.exchangeRequestId : null);
  return (
    <article className={CARD} data-sapil="exchange-request">
      <CardHead
        number={item.exchangeNumber}
        status={item.status}
        meta={<OrderMeta orderId={showOrder ? item.orderId : undefined} orderNumber={item.orderNumber} createdAt={item.createdAt} itemCount={requestUnitCount(item)} />}
      />
      <p className="mt-[10px] text-[14px]">
        {afterSalesOptionLabel("exchangeReason", item.reasonCode, t)} · {afterSalesOptionLabel("exchangeType", item.exchangeType, t)}
      </p>
      {item.latestStatusMessage ? <p className="mt-[4px] text-[14px] leading-[1.5] text-sapil-ink-2">{item.latestStatusMessage}</p> : null}
      <SapilExchangeMoney exchangeRequestId={item.exchangeRequestId} money={detail.data?.money ?? item.money} />
      <button type="button" aria-expanded={open} className={cx(LINK, "mt-[12px] text-[14px]")} onClick={() => setOpen((value) => !value)}>
        {open ? t("afterSales.hideDetails") : t("afterSales.viewDetails")}
      </button>
      {open && detail.data ? (
        <ul className="list-none p-0 mt-[12px] border-t border-sapil-line">
          {detail.data.items.map((line) => (
            <li key={line.itemId} className="py-[10px] border-b border-sapil-line last:border-b-0 text-[14px]">
              <b className="font-[600]">{line.productName ?? line.sku}</b>
              <span className="block text-sapil-ink-2">
                {t("orders.qty", { count: line.requestedQty })} → <span dir="ltr">{line.replacementSku}</span>
                {line.replacementSize ? ` (${line.replacementSize})` : ""}
              </span>
            </li>
          ))}
          {detail.data.customerNote ? (
            <li className="py-[10px] border-b border-sapil-line last:border-b-0 text-[14px] text-sapil-ink-2">
              {t("afterSales.note", { note: detail.data.customerNote })}
            </li>
          ) : null}
          {detail.data.money?.replacementOrderId ? (
            <li className="py-[10px] text-[14px]">
              <SapilLink href={`/account/orders/${encodeURIComponent(detail.data.money.replacementOrderId)}`} className={LINK}>
                {detail.data.money.replacementOrderNumber ?? t("afterSales.viewReplacement")}
              </SapilLink>
            </li>
          ) : null}
        </ul>
      ) : null}
    </article>
  );
}

/** A guest's return request (tracking page). */
export function SapilGuestReturnCard({ item }: { item: StorefrontReturnSummaryView }) {
  return (
    <article className={CARD} data-sapil="return-request">
      <CardHead number={item.returnNumber} status={item.status} meta={<OrderMeta createdAt={item.createdAt} itemCount={requestUnitCount(item)} />} />
      {item.latestStatusMessage ? <p className="mt-[8px] text-[14px] leading-[1.5] text-sapil-ink-2">{item.latestStatusMessage}</p> : null}
    </article>
  );
}

/** A guest's exchange request, with its price difference (paid with the order's access token). */
export function SapilGuestExchangeCard({ item, guest }: { item: StorefrontExchangeSummaryView; guest: ExchangeGuestProof }) {
  return (
    <article className={CARD} data-sapil="exchange-request">
      <CardHead number={item.exchangeNumber} status={item.status} meta={<OrderMeta createdAt={item.createdAt} itemCount={requestUnitCount(item)} />} />
      {item.latestStatusMessage ? <p className="mt-[8px] text-[14px] leading-[1.5] text-sapil-ink-2">{item.latestStatusMessage}</p> : null}
      <SapilExchangeMoney exchangeRequestId={item.exchangeRequestId} money={item.money} guest={guest} />
    </article>
  );
}
