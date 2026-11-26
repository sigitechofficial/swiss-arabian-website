"use client";

import { useLastDayFormat, useRequestDate } from "@/features/afterSales/hooks/useRequestDate";
import { resolveAfterSalesActions } from "@/features/afterSales/utils/afterSalesOptions";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type {
  AssistantAfterSalesOrder,
  AssistantAfterSalesRequest,
  AssistantAfterSalesView,
} from "../types";

const card = "rounded-xl border border-black/10 bg-white p-3.5 text-[13px] leading-snug shadow-sm";
const quietLink =
  "cursor-pointer rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs text-sa-primary no-underline hover:bg-black/5";
const textLink = "text-xs text-sa-primary underline underline-offset-2";

/** An identifier (order, return or exchange number): shown exactly as stored, left to right. */
function Identifier({ value }: { value: string }) {
  return (
    <bdi dir="ltr" translate="no">
      {value}
    </bdi>
  );
}

/**
 * One of the customer's own orders: what is in it, and whether a return or an exchange can be asked
 * for it. The reasons are the website's own sentences (the same as on the order page), so the chat can
 * never say something the order page does not. Nothing is started here: the buttons open the pages.
 */
function OrderCard({
  order,
  accent,
  onStart,
}: {
  order: AssistantAfterSalesOrder;
  accent: string;
  /** Starts a return or an exchange for this order in the chat. */
  onStart?: (kind: "RETURN" | "EXCHANGE", orderId: string) => void;
}) {
  const copy = useShopCopy();
  const shortDate = useRequestDate();
  const lastDay = useLastDayFormat();
  const { canReturn, canExchange, notes } = resolveAfterSalesActions(
    {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      signedIn: true,
      returns: order.returns,
      exchanges: order.exchanges,
    },
    // The chat does not know the page's own status check, so the neutral wording is used.
    true,
    copy,
    lastDay,
  );
  const lines: string[] = [];
  if (canReturn) {
    lines.push(
      order.returns.eligibleUntil
        ? copy("assistant.afterSales.returnOpenUntil", { date: lastDay(order.returns.eligibleUntil) })
        : copy("assistant.afterSales.returnOpen"),
    );
  }
  if (canExchange) {
    lines.push(
      order.exchanges.eligibleUntil
        ? copy("assistant.afterSales.exchangeOpenUntil", { date: lastDay(order.exchanges.eligibleUntil) })
        : copy("assistant.afterSales.exchangeOpen"),
    );
  }
  lines.push(...notes);
  const orderPage = `/account/orders/${encodeURIComponent(order.orderId)}`;
  return (
    <li className={card} data-assistant-after-sales-order>
      <div className="flex items-baseline justify-between gap-2">
        <p className="m-0 font-medium">
          <span>{copy("assistant.afterSales.orderLabel")}</span> <Identifier value={order.orderNumber} />
        </p>
        <span className="shrink-0 opacity-70">{shortDate(order.placedAt)}</span>
      </div>
      <p className="m-0 mt-0.5 opacity-70">
        {order.statusLabel} · {copy("cart.page.items", { count: order.itemCount })}
      </p>
      {lines.length > 0 ? (
        <ul className="m-0 mt-2 list-none space-y-1 p-0">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {onStart && order.chat?.return ? (
          <button
            type="button"
            data-assistant-start-return
            onClick={() => onStart("RETURN", order.orderId)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs text-white ${accent}`}
          >
            {copy("assistant.afterSales.returnItems")}
          </button>
        ) : null}
        {onStart && order.chat?.exchange ? (
          <button
            type="button"
            data-assistant-start-exchange
            onClick={() => onStart("EXCHANGE", order.orderId)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs text-white ${accent}`}
          >
            {copy("assistant.afterSales.exchangeItems")}
          </button>
        ) : null}
        {/* The chat's own buttons are off for this market or order: the website's form is still there. */}
        {(canReturn || canExchange) && !(onStart && (order.chat?.return || order.chat?.exchange)) ? (
          <LocaleLink href={`${orderPage}/return`} className={`rounded-full px-3 py-1.5 text-xs text-white no-underline ${accent}`}>
            {copy("afterSales.flow.entry.button")}
          </LocaleLink>
        ) : null}
        <LocaleLink href={orderPage} className={quietLink}>
          {copy("account.viewOrder")}
        </LocaleLink>
      </div>
    </li>
  );
}

/** One of the customer's own return or exchange requests, with where it is now. */
function RequestCard({ request }: { request: AssistantAfterSalesRequest }) {
  const copy = useShopCopy();
  const shortDate = useRequestDate();
  return (
    <li className={card} data-assistant-after-sales-request>
      <div className="flex items-baseline justify-between gap-2">
        <p className="m-0 font-medium">
          <span className="rounded-full bg-black/5 px-2 py-0.5 font-normal">
            {copy(request.kind === "RETURN" ? "assistant.afterSales.kindReturn" : "assistant.afterSales.kindExchange")}
          </span>{" "}
          <Identifier value={request.number} />
        </p>
        <span className="shrink-0 opacity-70">{shortDate(request.createdAt)}</span>
      </div>
      <p className="m-0 mt-1.5">{request.statusMessage}</p>
      {request.orderId ? (
        <div className="mt-2">
          <LocaleLink href={`/account/orders/${encodeURIComponent(request.orderId)}`} className={textLink}>
            {copy("account.viewOrder")}
          </LocaleLink>
        </div>
      ) : null}
    </li>
  );
}

/**
 * The signed-in customer's own orders or return and exchange requests, drawn from data the server
 * produced for them. Links go only to the customer's own pages on this site.
 */
export function AfterSalesCards({
  view,
  accent,
  onStart,
}: {
  view: AssistantAfterSalesView;
  accent: string;
  onStart?: (kind: "RETURN" | "EXCHANGE", orderId: string) => void;
}) {
  const copy = useShopCopy();
  if (view.kind === "ORDERS") {
    return (
      <section aria-label={copy("assistant.afterSales.ordersLabel")} className="space-y-2" data-assistant-after-sales>
        <ul className="m-0 list-none space-y-2 p-0">
          {view.orders.map((order) => (
            <OrderCard key={order.orderId} order={order} accent={accent} onStart={onStart} />
          ))}
        </ul>
        <LocaleLink href="/return-terms" className={textLink}>
          {copy("afterSales.flow.terms")}
        </LocaleLink>
      </section>
    );
  }
  return (
    <section aria-label={copy("assistant.afterSales.requestsLabel")} className="space-y-2" data-assistant-after-sales>
      <ul className="m-0 list-none space-y-2 p-0">
        {view.requests.map((request) => (
          <RequestCard key={`${request.kind}-${request.id}`} request={request} />
        ))}
      </ul>
      <LocaleLink href="/account/returns" className={textLink}>
        {copy("afterSales.viewAll")}
      </LocaleLink>
    </section>
  );
}
