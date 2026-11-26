"use client";

import { useState } from "react";
import { useLastDayFormat, useRequestDate } from "@/features/afterSales/hooks/useRequestDate";
import { afterSalesOptionLabel } from "@/features/afterSales/utils/eligibility";
import { unitDifferenceText } from "@/features/afterSales/utils/afterSalesFlowCopy";
import { returnEstimateView } from "@/features/afterSales/utils/returnEstimateView";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type {
  AssistantFlowAction,
  AssistantFlowExchangeReview,
  AssistantFlowLineChoice,
  AssistantFlowReplacementLine,
  AssistantFlowView,
} from "../types";

const panel = "rounded-xl border border-black/10 bg-white p-3.5 text-[13px] leading-snug shadow-sm";
const choice =
  "w-full cursor-pointer rounded-lg border border-black/15 bg-white p-2 text-start text-xs hover:bg-black/5 disabled:opacity-50";
const quiet =
  "cursor-pointer rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs hover:bg-black/5 disabled:opacity-50";

/** An identifier (order, return or exchange number): shown exactly as stored, left to right. */
function Identifier({ value }: { value: string }) {
  return (
    <bdi dir="ltr" translate="no">
      {value}
    </bdi>
  );
}

type Props = {
  view: AssistantFlowView;
  /** A request is in flight: every button waits. */
  busy: boolean;
  /** Something the customer can retry (a network failure), shown above the buttons. */
  problem: string | null;
  locale: string;
  accent: string;
  onStep: (action: AssistantFlowAction) => void;
  onConfirm: (reviewToken: string) => void;
  onCancel: () => void;
  /** Leaves the flow card (after it is done or closed). */
  onClose: () => void;
};

/**
 * The return or exchange the customer works through in the chat: order, items, (for an exchange: what
 * to swap each item for), reason, then a review with the amounts and the things to know before
 * anything is sent. The server decides what is on offer and what each step accepts; this only draws it
 * and sends back the customer's choice. Nothing is created until the customer ticks "I understand" and
 * taps send, and what they send is exactly the review on the screen (a changed amount is shown again
 * first).
 */
export function AssistantReturnFlow({ view, busy, problem, locale, accent, onStep, onConfirm, onCancel, onClose }: Props) {
  const copy = useShopCopy();
  const shortDate = useRequestDate();
  const lastDay = useLastDayFormat();
  const exchange = view.kind === "EXCHANGE";

  if (view.refusal) {
    return (
      <div className={panel} data-assistant-flow="closed">
        <p>{refusalText(view.refusal.code, copy, exchange)}</p>
        <div className="mt-2">
          <button type="button" className={quiet} onClick={onClose}>
            {copy("assistant.returnFlow.close")}
          </button>
        </div>
      </div>
    );
  }

  if (view.step === "DONE" && view.result) {
    return (
      <div className={panel} data-assistant-flow="done">
        <p className="font-medium">
          {copy(exchange ? "assistant.exchangeFlow.doneTitle" : "assistant.returnFlow.doneTitle")}
        </p>
        <p className="mt-1">
          {copy("assistant.returnFlow.doneNumber")} <Identifier value={view.result.requestNumber} />
        </p>
        <p className="mt-1 opacity-80">{view.result.statusMessage}</p>
        <p className="mt-1 opacity-80">
          {copy(exchange ? "assistant.exchangeFlow.doneNext" : "assistant.returnFlow.doneNext")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <LocaleLink href="/account/returns" className={`${quiet} text-sa-primary no-underline`}>
            {copy("assistant.returnFlow.viewRequests")}
          </LocaleLink>
          <button type="button" className={quiet} onClick={onClose}>
            {copy("assistant.returnFlow.close")}
          </button>
        </div>
      </div>
    );
  }

  const back = view.step !== "PICK_ORDER" ? (
    <button type="button" className={quiet} disabled={busy} onClick={() => onStep({ type: "BACK" })}>
      {copy("assistant.returnFlow.back")}
    </button>
  ) : null;
  const stop = (
    <button type="button" className={quiet} disabled={busy} onClick={onCancel}>
      {copy("assistant.returnFlow.stop")}
    </button>
  );
  const trouble = problem ? (
    <p role="alert" className="mb-2 text-red-700">
      {problem}
    </p>
  ) : null;

  if (view.step === "PICK_ORDER") {
    return (
      <div className={panel} data-assistant-flow="order">
        <p className="font-medium">{copy("assistant.returnFlow.pickOrder")}</p>
        {trouble}
        <div className="mt-2 flex flex-col gap-2">
          {(view.orders ?? []).map((order) => (
            <button
              key={order.orderId}
              type="button"
              className={choice}
              disabled={busy}
              onClick={() => onStep({ type: "PICK_ORDER", orderId: order.orderId })}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-medium">
                  <Identifier value={order.orderNumber} />
                </span>
                <span className="shrink-0 opacity-70">{shortDate(order.placedAt)}</span>
              </span>
              <span className="block opacity-70">
                {order.statusLabel} · {copy("cart.page.items", { count: order.itemCount })}
              </span>
              {order.eligibleUntil ? (
                <span className="block opacity-80">
                  {copy(exchange ? "assistant.afterSales.exchangeOpenUntil" : "assistant.afterSales.returnOpenUntil", {
                    date: lastDay(order.eligibleUntil),
                  })}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">{stop}</div>
      </div>
    );
  }

  if (view.step === "PICK_ITEMS") {
    return (
      <ItemsStep
        key={view.expiresAt}
        exchange={exchange}
        lines={view.lines ?? []}
        busy={busy}
        trouble={trouble}
        accent={accent}
        back={back}
        stop={stop}
        onPick={(items) => onStep({ type: "PICK_ITEMS", items })}
      />
    );
  }

  if (view.step === "PICK_REPLACEMENT") {
    return (
      <ReplacementStep
        key={view.expiresAt}
        lines={view.replacementLines ?? []}
        busy={busy}
        trouble={trouble}
        accent={accent}
        back={back}
        stop={stop}
        onPick={(replacements) => onStep({ type: "PICK_REPLACEMENT", replacements })}
      />
    );
  }

  if (view.step === "PICK_REASON") {
    return (
      <ReasonStep
        key={view.expiresAt}
        exchange={exchange}
        reasons={view.reasons ?? []}
        initialReason={view.reasonCode ?? null}
        initialDetail={view.reasonDetail ?? ""}
        busy={busy}
        trouble={trouble}
        accent={accent}
        back={back}
        stop={stop}
        onPick={(reasonCode, detail) => onStep({ type: "PICK_REASON", reasonCode, ...(detail ? { detail } : {}) })}
      />
    );
  }

  // REVIEW
  const review = view.review;
  if (!review) return null;
  const returnView = review.estimate ? returnEstimateView(review.estimate, copy, locale) : null;
  const rows = returnView?.rows ?? exchangeRows(review.exchange, copy);
  return (
    <ReviewStep
      key={review.reviewToken}
      exchange={exchange}
      orderNumber={review.orderNumber}
      lines={review.lines}
      swaps={review.exchange?.lines ?? []}
      currencyCode={review.currencyCode}
      reasonLabel={afterSalesOptionLabel(exchange ? "exchangeReason" : "returnReason", review.reasonCode, copy)}
      reasonDetail={review.reasonDetail}
      rows={rows}
      notes={returnView?.notes ?? []}
      destination={returnView?.destination ?? null}
      direction={review.exchange?.estimate.direction ?? null}
      eligibleUntil={review.eligibleUntil ? lastDay(review.eligibleUntil) : null}
      withinPolicyWindow={review.withinPolicyWindow}
      changed={review.changed}
      blocked={review.blocked}
      busy={busy}
      trouble={trouble}
      accent={accent}
      back={back}
      stop={stop}
      onConfirm={() => onConfirm(review.reviewToken)}
    />
  );
}

type Row = { key: string; label: string; value: string; hint?: string; strong?: boolean };

/** The exchange's money as rows, from the website's own estimate and its own labels. */
function exchangeRows(review: AssistantFlowExchangeReview | undefined, copy: ReturnType<typeof useShopCopy>): Row[] {
  if (!review) return [];
  const e = review.estimate;
  const money = (amount: string) => formatMoney(Number(amount), e.currencyCode);
  const rows: Row[] = [];
  if (Number(e.replacementDelivery.amount) > 0 || e.replacementDelivery.waived) {
    rows.push({
      key: "delivery",
      label: copy("afterSales.flow.exchange.delivery"),
      value: e.replacementDelivery.waived ? copy("returnEstimate.waived") : money(e.replacementDelivery.amount),
    });
  }
  if (Number(e.offerAdjustmentAmount) !== 0) {
    rows.push({ key: "offer", label: copy("afterSales.flow.exchange.offer"), value: money(e.offerAdjustmentAmount.replace("-", "")) });
  }
  if (e.direction === "CUSTOMER_OWES") {
    rows.push({ key: "pay", label: copy("afterSales.flow.exchange.youPay"), value: money(e.customerPayableAmount), strong: true });
  } else if (e.direction === "REFUND_DUE") {
    rows.push({ key: "back", label: copy("afterSales.flow.exchange.youGetBack"), value: money(e.refundableDifferenceAmount), strong: true });
  } else {
    rows.push({ key: "even", label: copy("afterSales.flow.exchange.even"), value: money("0"), strong: true });
  }
  return rows;
}

function ItemsStep({
  exchange,
  lines,
  busy,
  trouble,
  accent,
  back,
  stop,
  onPick,
}: {
  exchange: boolean;
  lines: AssistantFlowLineChoice[];
  busy: boolean;
  trouble: React.ReactNode;
  accent: string;
  back: React.ReactNode;
  stop: React.ReactNode;
  onPick: (items: Array<{ orderLineId: string; quantity: number }>) => void;
}) {
  const copy = useShopCopy();
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(lines.map((line) => [line.orderLineId, line.selectedQty])),
  );
  const chosen = lines.filter((line) => (qty[line.orderLineId] ?? 0) > 0);
  return (
    <div className={panel} data-assistant-flow="items">
      <p className="font-medium">{copy(exchange ? "assistant.exchangeFlow.pickItems" : "assistant.returnFlow.pickItems")}</p>
      {trouble}
      <ul className="mt-2 flex flex-col gap-2">
        {lines.map((line) => {
          const blocked = line.blockedReason !== null || line.returnableQty < 1;
          const value = qty[line.orderLineId] ?? 0;
          return (
            <li key={line.orderLineId} className="flex items-center justify-between gap-2 rounded-lg border border-black/10 p-2">
              <span className="min-w-0">
                <span className="block font-medium">{line.productName ?? ""}</span>
                {line.variantName ? <span className="block opacity-70">{line.variantName}</span> : null}
                {blocked ? (
                  <span className="block opacity-70">
                    {copy(exchange ? "assistant.exchangeFlow.lineBlocked" : "assistant.returnFlow.lineBlocked")}
                  </span>
                ) : (
                  <span className="block opacity-70">
                    {copy(exchange ? "assistant.exchangeFlow.canExchange" : "assistant.returnFlow.canReturn", {
                      count: String(line.returnableQty),
                    })}
                  </span>
                )}
              </span>
              {blocked ? null : (
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={quiet}
                    aria-label={copy("assistant.returnFlow.less")}
                    disabled={busy || value < 1}
                    onClick={() => setQty((q) => ({ ...q, [line.orderLineId]: Math.max(0, value - 1) }))}
                  >
                    −
                  </button>
                  <span className="w-5 text-center" aria-live="polite">
                    {value}
                  </span>
                  <button
                    type="button"
                    className={quiet}
                    aria-label={copy("assistant.returnFlow.more")}
                    disabled={busy || value >= line.returnableQty}
                    onClick={() => setQty((q) => ({ ...q, [line.orderLineId]: Math.min(line.returnableQty, value + 1) }))}
                  >
                    +
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        {back}
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs text-white disabled:opacity-50 ${accent}`}
          disabled={busy || chosen.length === 0}
          onClick={() => onPick(chosen.map((line) => ({ orderLineId: line.orderLineId, quantity: qty[line.orderLineId] })))}
        >
          {copy("assistant.returnFlow.continue")}
        </button>
        {stop}
      </div>
    </div>
  );
}

/** Exchange: one replacement per chosen item, only ones the server offered (in stock, priced). */
function ReplacementStep({
  lines,
  busy,
  trouble,
  accent,
  back,
  stop,
  onPick,
}: {
  lines: AssistantFlowReplacementLine[];
  busy: boolean;
  trouble: React.ReactNode;
  accent: string;
  back: React.ReactNode;
  stop: React.ReactNode;
  onPick: (replacements: Array<{ orderLineId: string; sku: string }>) => void;
}) {
  const copy = useShopCopy();
  const [picked, setPicked] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(lines.map((line) => [line.orderLineId, line.selectedSku])),
  );
  const complete = lines.length > 0 && lines.every((line) => picked[line.orderLineId]);
  return (
    <div className={panel} data-assistant-flow="replacement">
      <p className="font-medium">{copy("afterSales.flow.replacement.title")}</p>
      {trouble}
      <div className="mt-2 flex flex-col gap-3">
        {lines.map((line) => (
          <fieldset key={line.orderLineId} className="rounded-lg border border-black/10 p-2">
            <legend className="px-1 font-medium">
              {copy("afterSales.flow.replacement.for", {
                name: [line.productName, line.variantName].filter(Boolean).join(" · "),
              })}
            </legend>
            {line.sameItemOnly ? <p className="mb-1 opacity-70">{copy("afterSales.flow.replacement.giftOnly")}</p> : null}
            <div className="flex flex-col gap-1">
              {line.options.map((option) => (
                <label key={option.sku} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-black/10 p-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="radio"
                      name={`assistant-replacement-${line.orderLineId}`}
                      checked={picked[line.orderLineId] === option.sku}
                      onChange={() => setPicked((p) => ({ ...p, [line.orderLineId]: option.sku }))}
                    />
                    <span className="min-w-0">
                      <span className="block">
                        {option.sameItem ? copy("afterSales.flow.replacement.same") : (option.variantName ?? option.productName ?? "")}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 opacity-80">
                    {unitDifferenceText({ unitDifference: option.unitDifference }, copy, (amount) =>
                      formatMoney(Number(amount), line.currencyCode),
                    )}
                  </span>
                </label>
              ))}
            </div>
            {line.unavailableCount > 0 ? (
              <p className="mt-1 opacity-70">{copy("assistant.exchangeFlow.someUnavailable")}</p>
            ) : null}
          </fieldset>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {back}
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs text-white disabled:opacity-50 ${accent}`}
          disabled={busy || !complete}
          onClick={() =>
            onPick(lines.map((line) => ({ orderLineId: line.orderLineId, sku: picked[line.orderLineId] as string })))
          }
        >
          {copy("assistant.returnFlow.continue")}
        </button>
        {stop}
      </div>
    </div>
  );
}

function ReasonStep({
  exchange,
  reasons,
  initialReason,
  initialDetail,
  busy,
  trouble,
  accent,
  back,
  stop,
  onPick,
}: {
  exchange: boolean;
  reasons: string[];
  initialReason: string | null;
  initialDetail: string;
  busy: boolean;
  trouble: React.ReactNode;
  accent: string;
  back: React.ReactNode;
  stop: React.ReactNode;
  onPick: (reasonCode: string, detail: string) => void;
}) {
  const copy = useShopCopy();
  const [reason, setReason] = useState<string | null>(initialReason);
  const [detail, setDetail] = useState(initialDetail);
  return (
    <div className={panel} data-assistant-flow="reason">
      <p className="font-medium">{copy("assistant.returnFlow.pickReason")}</p>
      {trouble}
      <div className="mt-2 flex flex-col gap-1" role="radiogroup" aria-label={copy("assistant.returnFlow.pickReason")}>
        {reasons.map((code) => (
          <label key={code} className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 p-2">
            <input type="radio" name="assistant-return-reason" checked={reason === code} onChange={() => setReason(code)} />
            <span>{afterSalesOptionLabel(exchange ? "exchangeReason" : "returnReason", code, copy)}</span>
          </label>
        ))}
      </div>
      <label className="mt-2 block">
        <span className="block opacity-70">{copy("assistant.returnFlow.detailLabel")}</span>
        <textarea
          value={detail}
          maxLength={500}
          rows={2}
          onChange={(event) => setDetail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-black/20 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/50"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {back}
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs text-white disabled:opacity-50 ${accent}`}
          disabled={busy || !reason}
          onClick={() => reason && onPick(reason, detail.trim())}
        >
          {copy("assistant.returnFlow.review")}
        </button>
        {stop}
      </div>
    </div>
  );
}

function ReviewStep({
  exchange,
  orderNumber,
  lines,
  swaps,
  currencyCode,
  reasonLabel,
  reasonDetail,
  rows,
  notes,
  destination,
  direction,
  eligibleUntil,
  withinPolicyWindow,
  changed,
  blocked,
  busy,
  trouble,
  accent,
  back,
  stop,
  onConfirm,
}: {
  exchange: boolean;
  orderNumber: string | null;
  lines: Array<{ orderLineId: string; productName: string | null; variantName: string | null; quantity: number }>;
  swaps: AssistantFlowExchangeReview["lines"];
  currencyCode: string;
  reasonLabel: string;
  reasonDetail: string | null;
  rows: Row[];
  notes: Array<{ key: string; text: string }>;
  destination: string | null;
  direction: "EVEN" | "CUSTOMER_OWES" | "REFUND_DUE" | null;
  eligibleUntil: string | null;
  withinPolicyWindow: boolean;
  changed: boolean;
  blocked: "GIFT_REQUIRED" | "OUT_OF_STOCK" | null;
  busy: boolean;
  trouble: React.ReactNode;
  accent: string;
  back: React.ReactNode;
  stop: React.ReactNode;
  onConfirm: () => void;
}) {
  const copy = useShopCopy();
  const [understood, setUnderstood] = useState(false);
  const swapFor = (orderLineId: string) => swaps.find((s) => s.orderLineId === orderLineId)?.replacement;
  return (
    <div className={panel} data-assistant-flow="review">
      <p className="font-medium">{copy(exchange ? "assistant.exchangeFlow.reviewTitle" : "assistant.returnFlow.reviewTitle")}</p>
      {changed ? (
        <p role="status" className="mt-1 rounded-lg bg-amber-50 p-2 text-amber-900">
          {copy("assistant.returnFlow.changed")}
        </p>
      ) : null}
      {trouble}
      <p className="mt-2">
        {copy("assistant.afterSales.orderLabel")} {orderNumber ? <Identifier value={orderNumber} /> : null}
      </p>
      <ul className="mt-1 list-disc ps-4">
        {lines.map((line) => {
          const replacement = swapFor(line.orderLineId);
          return (
            <li key={line.orderLineId}>
              {line.productName ?? ""}
              {line.variantName ? ` (${line.variantName})` : ""} × {line.quantity}
              {replacement ? (
                <span className="block opacity-80">
                  {copy("assistant.exchangeFlow.swapFor", {
                    name: replacement.sameItem
                      ? copy("afterSales.flow.replacement.same")
                      : (replacement.variantName ?? replacement.productName ?? replacement.sku),
                  })}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-2">
        {copy("assistant.returnFlow.reasonIs", { reason: reasonLabel })}
        {reasonDetail ? <span className="block opacity-70">{reasonDetail}</span> : null}
      </p>
      <dl className="mt-2 flex flex-col gap-1 border-t border-black/10 pt-2" data-currency={currencyCode}>
        {rows.map((row) => (
          <div key={row.key} className={`flex justify-between gap-2 ${row.strong ? "font-semibold" : ""}`}>
            <dt>
              {row.label}
              {row.hint ? <span className="block text-[11px] font-normal opacity-70">{row.hint}</span> : null}
            </dt>
            <dd className="shrink-0">{row.value}</dd>
          </div>
        ))}
      </dl>
      {destination ? <p className="mt-1 opacity-80">{destination}</p> : null}
      <div className="mt-2 rounded-lg bg-black/5 p-2" data-assistant-flow-warnings>
        <p className="font-medium">{copy("assistant.returnFlow.warningsTitle")}</p>
        <ul className="mt-1 list-disc ps-4">
          {exchange ? (
            <>
              <li>{copy("assistant.exchangeFlow.warnRequest")}</li>
              <li>{copy("assistant.exchangeFlow.warnNothingNow")}</li>
              {direction === "CUSTOMER_OWES" ? <li>{copy("afterSales.flow.exchange.payLater")}</li> : null}
              {direction === "REFUND_DUE" ? <li>{copy("afterSales.flow.exchange.refundLater")}</li> : null}
              <li>{copy("assistant.exchangeFlow.warnNotReserved")}</li>
              <li>{copy("assistant.exchangeFlow.warnSendBack")}</li>
              <li>{copy("assistant.exchangeFlow.warnFinal")}</li>
            </>
          ) : (
            <>
              <li>{copy("assistant.returnFlow.warnEstimate")}</li>
              <li>{copy("assistant.returnFlow.warnCondition")}</li>
              <li>{copy("assistant.returnFlow.warnFees")}</li>
              <li>{copy("assistant.returnFlow.warnFinal")}</li>
            </>
          )}
          {eligibleUntil ? <li>{copy("assistant.returnFlow.warnDeadline", { date: eligibleUntil })}</li> : null}
          {withinPolicyWindow ? null : <li>{copy("assistant.returnFlow.warnWindow")}</li>}
          {notes.map((note) => (
            <li key={note.key}>{note.text}</li>
          ))}
        </ul>
      </div>
      {blocked === "GIFT_REQUIRED" ? <p className="mt-2 text-red-700">{copy("assistant.returnFlow.giftRequired")}</p> : null}
      {blocked === "OUT_OF_STOCK" ? <p className="mt-2 text-red-700">{copy("afterSales.flow.exchange.stock")}</p> : null}
      <label className="mt-2 flex cursor-pointer items-start gap-2">
        <input type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />
        <span>{copy(exchange ? "assistant.exchangeFlow.understand" : "assistant.returnFlow.understand")}</span>
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {back}
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs text-white disabled:opacity-50 ${accent}`}
          disabled={busy || blocked !== null || !understood}
          onClick={onConfirm}
        >
          {copy(exchange ? "assistant.exchangeFlow.send" : "assistant.returnFlow.send")}
        </button>
        {stop}
      </div>
    </div>
  );
}

/** What a refusal says. The customer is never told that a person is looking at their account. */
function refusalText(code: string, copy: ReturnType<typeof useShopCopy>, exchange: boolean): string {
  switch (code) {
    case "ASSISTANT_OFF":
    case "RETURNS_IN_CHAT_OFF":
    case "EXCHANGES_IN_CHAT_OFF":
      return copy(exchange ? "assistant.exchangeFlow.refusal.off" : "assistant.returnFlow.refusal.off");
    case "NO_ELIGIBLE_ORDER":
      return copy(exchange ? "assistant.exchangeFlow.refusal.noOrder" : "assistant.returnFlow.refusal.noOrder");
    case "FLOW_ALREADY_OPEN":
      return copy("assistant.returnFlow.refusal.alreadyOpen");
    case "DAILY_FLOW_LIMIT":
    case "DAILY_REQUEST_LIMIT":
      return copy("assistant.returnFlow.refusal.limit");
    case "FLOW_EXPIRED":
      return copy("assistant.returnFlow.refusal.expired");
    case "CLOSED":
      return copy("assistant.returnFlow.refusal.closed");
    default:
      // Blocked account, care needed, step limit, anything new: one neutral sentence.
      return copy("assistant.returnFlow.refusal.care");
  }
}
