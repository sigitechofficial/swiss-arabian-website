"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { PageLoading } from "@/components/ui/PageLoading";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { formatOrderDate } from "@/features/orders/utils/orderStatus";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";
import {
  accountCol,
  accountCrumbs,
  accountEyebrow,
  accountHead,
  accountLayout,
  accountLede,
  accountOrderCta,
  accountPanel,
  accountPanelBody,
  accountPanelHead,
  accountPanelTitle,
  accountPrimaryCta,
  orderNotice,
  orderNoticeTone,
  orderStep,
  orderStepDot,
  orderStepLabel,
  orderStepLine,
  orderStepRail,
  orderSteps,
} from "@/styles/accountChrome";
import { crumbsList, pageTitle } from "@/styles/shopChrome";
import type { ReturnOrderTarget } from "../../hooks/useAfterSales";
import { useAfterSalesFlow, useAfterSalesFlowTarget, type AfterSalesFlow } from "../../hooks/useAfterSalesFlow";
import type { AfterSalesKind, ExchangeOption } from "../../types/afterSales";
import { distinctVariantName, lineOptions, reasonCodesFor } from "../../utils/afterSalesFlow";
import { flowBlockedKey, flowStepKey, unitDifferenceText } from "../../utils/afterSalesFlowCopy";
import { afterSalesOptionLabel, afterSalesStatusLabel } from "../../utils/eligibility";
import { returnEstimateView } from "../../utils/returnEstimateView";

type Translator = ReturnType<typeof useShopCopy>;

type Props = {
  orderId?: string;
  orderNumber?: string;
  initialKind?: AfterSalesKind | null;
};

/** Signed-in pages keep the account tabs; a guest's page is the plain shop page. */
function Frame({ customer, children }: { customer: boolean; children: ReactNode }) {
  return customer ? <AccountPageShell>{children}</AccountPageShell> : <div className="bg-page">{children}</div>;
}

/**
 * `/account/orders/[id]/return` and `/track/[orderNumber]/return`: the guided
 * return / exchange (Swiss Arabian). Steps, rules and money come from the
 * shared flow; this view only draws them.
 */
export function AfterSalesFlowPageView({ orderId, orderNumber, initialKind = null }: Props) {
  const t = useShopCopy();
  const { target, ready, missingToken } = useAfterSalesFlowTarget({ orderId, orderNumber });
  const customer = Boolean(orderId);
  if (!ready) {
    return (
      <Frame customer={customer}>
        <PageLoading label={t("afterSales.flow.loading")} />
      </Frame>
    );
  }
  if (missingToken || !target) {
    return (
      <Frame customer={customer}>
        <div className={`${accountContainer} py-20 text-center`}>
          <h1 className={pageTitle}>{t("afterSales.flow.title")}</h1>
          <p className={`${accountLede} mx-auto`}>{t("afterSales.flow.noToken")}</p>
          <LocaleLink href={orderNumber ? `/track/${encodeURIComponent(orderNumber)}` : "/track"} className={`${accountPrimaryCta} mt-6`}>
            {t("afterSales.flow.track")}
          </LocaleLink>
        </div>
      </Frame>
    );
  }
  return (
    <Frame customer={customer}>
      <FlowScreen target={target} initialKind={initialKind} />
    </Frame>
  );
}

function orderHref(target: ReturnOrderTarget): string {
  return target.mode === "customer"
    ? `/account/orders/${encodeURIComponent(target.orderId)}`
    : `/track/${encodeURIComponent(target.orderNumber)}`;
}

function FlowScreen({ target, initialKind }: { target: ReturnOrderTarget; initialKind: AfterSalesKind | null }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const flow = useAfterSalesFlow({ target, locale, initialKind });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // A new step: bring its heading into view and focus it (screen readers hear where they are).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [flow.step, flow.result]);

  const back = orderHref(target);
  const reference = flow.orderNumber ?? "…";

  const crumbs = (
    <nav aria-label={t("account.breadcrumbNav")} className={accountCrumbs}>
      <ol className={crumbsList} role="list">
        <li>
          <LocaleLink href="/">{t("home")}</LocaleLink>
        </li>
        {target.mode === "customer" ? (
          <li>
            <LocaleLink href="/account/orders">{t("account.tab.orders")}</LocaleLink>
          </li>
        ) : null}
        <li>
          <LocaleLink href={back}>{reference}</LocaleLink>
        </li>
        <li aria-current="page">{t("afterSales.flow.crumb")}</li>
      </ol>
    </nav>
  );

  if (flow.result) {
    return (
      <div className={accountContainer}>
        {crumbs}
        <section className={`${accountPanel} my-8`}>
          <div className={`${accountPanelBody} py-10 text-center`}>
            <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#eef8f1] text-[#1a7338]" aria-hidden="true">
              <Check size={22} strokeWidth={2.2} />
            </span>
            <p className={accountEyebrow}>{t("afterSales.flow.done.number", { number: flow.result.requestNumber })}</p>
            <h1 ref={headingRef} tabIndex={-1} className={`${pageTitle} outline-none`}>
              {flow.result.kind === "return" ? t("afterSales.flow.done.returnTitle") : t("afterSales.flow.done.exchangeTitle")}
            </h1>
            <p className={`${accountLede} mx-auto`}>
              {afterSalesStatusLabel(flow.result.status, t)}. {t("afterSales.flow.done.body")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <LocaleLink href={back} className={accountPrimaryCta}>
                {t("afterSales.flow.done.order")}
              </LocaleLink>
              {target.mode === "customer" ? (
                <LocaleLink href="/account/returns" className={accountOrderCta}>
                  {t("afterSales.flow.done.all")}
                </LocaleLink>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const last = flow.step === "review";
  return (
    <div className={accountContainer}>
      {crumbs}
      <header className={accountHead}>
        <div className="min-w-0">
          <p className={accountEyebrow} dir="ltr">
            {t("afterSales.flow.eyebrow", { number: reference })}
          </p>
          <h1 className={pageTitle}>{t("afterSales.flow.title")}</h1>
        </div>
      </header>

      <div className={`${accountPanel} mb-[clamp(20px,3vw,28px)]`}>
        <StepRail flow={flow} />
      </div>

      <div className={accountLayout}>
        <div className={accountCol}>
          <section className={accountPanel} aria-labelledby="flow-step-title">
            <header className={accountPanelHead}>
              <h2 id="flow-step-title" ref={headingRef} tabIndex={-1} className="m-0 text-[1.05rem] font-semibold text-[var(--ink,#241f1b)] outline-none">
                {stepTitle(flow, t)}
              </h2>
            </header>
            <div className={accountPanelBody}>
              <StepBody flow={flow} />
              {flow.submitError ? (
                <p role="alert" className={`${orderNotice} ${orderNoticeTone.error} mt-4`}>
                  {flow.submitError}
                </p>
              ) : null}
            </div>
            {/* Back / Continue. On phones the bar stays at the bottom of the screen while the step scrolls. */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-white px-6 py-4 max-[599px]:sticky max-[599px]:bottom-0 max-[599px]:z-[2] max-[599px]:px-5">
              {flow.stepIndex > 0 ? (
                <button type="button" className={`${accountOrderCta} max-[599px]:px-4`} onClick={flow.back} disabled={flow.submitting}>
                  {t("afterSales.flow.back")}
                </button>
              ) : (
                <LocaleLink href={back} className="text-[0.8rem] font-medium text-[var(--copper,#8c4435)] underline underline-offset-4">
                  {t("afterSales.flow.cancel")}
                </LocaleLink>
              )}
              {last ? (
                <button
                  type="button"
                  className={`${accountPrimaryCta} cursor-pointer border-0 disabled:cursor-not-allowed disabled:opacity-50 max-[599px]:flex-1 max-[599px]:px-4 max-[599px]:text-[0.8rem]`}
                  onClick={() => void flow.submit()}
                  disabled={!flow.canContinue || flow.submitting}
                >
                  {flow.submitting
                    ? t("afterSales.flow.sending")
                    : flow.draft.kind === "exchange"
                      ? t("afterSales.flow.submitExchange")
                      : t("afterSales.flow.submitReturn")}
                </button>
              ) : (
                <button
                  type="button"
                  className={`${accountPrimaryCta} cursor-pointer border-0 disabled:cursor-not-allowed disabled:opacity-50 max-[599px]:flex-1 max-[599px]:px-4 max-[599px]:text-[0.8rem]`}
                  onClick={flow.next}
                  disabled={!flow.canContinue}
                >
                  {t("afterSales.flow.continue")}
                </button>
              )}
            </div>
          </section>
        </div>
        <aside className="sticky top-28 min-w-0 max-[900px]:static">
          <FlowSummary flow={flow} />
        </aside>
      </div>
    </div>
  );
}

function StepRail({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const lastIndex = flow.steps.length - 1;
  return (
    <ol className={orderSteps} aria-label={t("afterSales.flow.progressLabel")}>
      {flow.steps.map((step, index) => {
        const state = index < flow.stepIndex ? "done" : index === flow.stepIndex ? "current" : "next";
        const label = t(flowStepKey(step));
        const content = (
          <>
            <div className={orderStepRail} aria-hidden="true">
              <span className={orderStepLine} data-on={index <= flow.stepIndex} data-edge={index === 0} />
              <span className={orderStepDot} data-state={state}>
                {state === "done" ? <Check size={14} strokeWidth={2.2} /> : index + 1}
              </span>
              <span className={orderStepLine} data-on={index < flow.stepIndex} data-edge={index === lastIndex} />
            </div>
            <span className={`${orderStepLabel} max-[599px]:sr-only`} data-state={state}>
              {label}
            </span>
          </>
        );
        return (
          <li key={step} className={orderStep} aria-current={state === "current" ? "step" : undefined}>
            {state === "done" ? (
              <button
                type="button"
                onClick={() => flow.goTo(step)}
                aria-label={t("afterSales.flow.revisit", { step: label })}
                className="flex w-full cursor-pointer flex-col items-center gap-2.5 border-0 bg-transparent p-0 [font:inherit]"
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}

function stepTitle(flow: AfterSalesFlow, t: Translator): string {
  switch (flow.step) {
    case "choose":
      return t("afterSales.flow.choose.title");
    case "items":
      return flow.draft.kind === "exchange" ? t("afterSales.flow.items.titleExchange") : t("afterSales.flow.items.titleReturn");
    case "reason":
      return flow.draft.kind === "exchange" ? t("afterSales.flow.reason.titleExchange") : t("afterSales.flow.reason.titleReturn");
    case "replacement":
      return t("afterSales.flow.replacement.title");
    case "review":
      return t("afterSales.flow.review.title");
  }
}

function StepBody({ flow }: { flow: AfterSalesFlow }) {
  switch (flow.step) {
    case "choose":
      return <ChooseStep flow={flow} />;
    case "items":
      return <ItemsStep flow={flow} />;
    case "reason":
      return <ReasonStep flow={flow} />;
    case "replacement":
      return <ReplacementStep flow={flow} />;
    case "review":
      return <ReviewStep flow={flow} />;
  }
}

const optionCard =
  "flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg,4px)] border border-[var(--line)] bg-white px-4 py-3.5 transition-colors has-[:checked]:border-[var(--copper,#8c4435)] has-[:checked]:bg-[var(--cream,#faf6ee)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55 hover:border-[var(--copper,#8c4435)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--copper,#8c4435)]";

const radio = "mt-0.5 size-4 shrink-0 accent-[var(--copper,#8c4435)]";
const hint = "m-0 mt-1 text-[0.76rem] leading-[1.55] text-[var(--ink-2,#5b5148)]";

function Busy({ label }: { label: string }) {
  return (
    <p role="status" className="m-0 text-[0.82rem] text-[var(--ink-2,#5b5148)]">
      {label}
    </p>
  );
}

function ChooseStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  if (flow.choicesLoading) return <Busy label={t("afterSales.flow.loading")} />;
  return (
    <div role="radiogroup" aria-labelledby="flow-step-title" className="flex flex-col gap-3">
      {flow.choices.map((choice) => (
        <label key={choice.kind} className={optionCard}>
          <input
            type="radio"
            name="after-sales-kind"
            className={radio}
            checked={flow.draft.kind === choice.kind}
            disabled={!choice.allowed}
            onChange={() => flow.choose(choice.kind)}
          />
          <span className="min-w-0">
            <span className="block text-[0.9rem] font-semibold text-[var(--ink,#241f1b)]">
              {choice.kind === "return" ? t("afterSales.flow.choose.return") : t("afterSales.flow.choose.exchange")}
            </span>
            <span className={`${hint} block`}>
              {choice.kind === "return" ? t("afterSales.flow.choose.returnBody") : t("afterSales.flow.choose.exchangeBody")}
            </span>
            {choice.allowed && choice.eligibleUntil ? (
              <span className={`${hint} block font-medium text-[var(--ink,#241f1b)]`}>
                {t("afterSales.flow.until", { date: formatOrderDate(choice.eligibleUntil, { long: true, locale, timeZone }) })}
              </span>
            ) : null}
            {!choice.allowed && choice.note ? <span className={`${hint} block text-[#8c3a2b]`}>{choice.note}</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}

function Thumb({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- catalogue images come from the CDN as-is
    <img src={src} alt="" className="size-16 shrink-0 rounded-[var(--radius-lg,4px)] bg-[var(--cream-2,#f3ebda)] object-cover" />
  ) : (
    <span aria-hidden="true" className="size-16 shrink-0 rounded-[var(--radius-lg,4px)] bg-[var(--cream-2,#f3ebda)]" />
  );
}

function Stepper({ value, max, name, onChange }: { value: number; max: number; name: string; onChange: (next: number) => void }) {
  const t = useShopCopy();
  const btn =
    "grid size-9 cursor-pointer place-items-center border-0 bg-transparent text-[var(--ink,#241f1b)] disabled:cursor-not-allowed disabled:opacity-35";
  return (
    <span role="group" aria-label={t("afterSales.quantityOf", { name })} className="inline-flex items-center rounded-full border border-[var(--line)] bg-white">
      <button type="button" className={btn} aria-label={t("afterSales.flow.items.fewer", { name })} disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus size={14} />
      </button>
      <span aria-live="polite" className="min-w-6 text-center text-[0.85rem] font-semibold tabular-nums">
        {value}
      </span>
      <button type="button" className={btn} aria-label={t("afterSales.flow.items.more", { name })} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={14} />
      </button>
    </span>
  );
}

function ItemsStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  if (flow.linesLoading) return <Busy label={t("afterSales.flow.loading")} />;
  if (flow.linesError) return <p role="alert" className={`${orderNotice} ${orderNoticeTone.error}`}>{flow.linesError}</p>;
  if (!flow.lines.length) return <p className={hint}>{t("afterSales.flow.items.none")}</p>;
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">{t("afterSales.flow.items.legend")}</legend>
      <p className={`${hint} mt-0 mb-4`}>{t("afterSales.flow.items.intro")}</p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {flow.lines.map((line) => {
          const name = line.productName ?? line.sku;
          const quantity = flow.draft.quantities[line.orderLineId] ?? 0;
          const pickable = line.returnableQty > 0 && !line.blockedReason;
          const id = `flow-line-${line.orderLineId}`;
          return (
            <li
              key={line.orderLineId}
              className={`flex items-start gap-3 rounded-[var(--radius-lg,4px)] border px-4 py-3.5 ${quantity > 0 ? "border-[var(--copper,#8c4435)] bg-[var(--cream,#faf6ee)]" : "border-[var(--line)]"} ${pickable ? "" : "opacity-60"}`}
            >
              <input
                id={id}
                type="checkbox"
                className="mt-6 size-4 shrink-0 accent-[var(--copper,#8c4435)]"
                checked={quantity > 0}
                disabled={!pickable}
                onChange={(event) => flow.toggleLine(line.orderLineId, event.target.checked)}
              />
              <Thumb src={line.imageUrl} />
              <div className="min-w-0 flex-1">
                <label htmlFor={id} className="block cursor-pointer text-[0.88rem] font-semibold text-[var(--ink,#241f1b)]">
                  {name}
                </label>
                <p className={hint}>
                  {[distinctVariantName(line.productName, line.variantName), t("afterSales.flow.items.bought", { count: line.orderedQty })]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {pickable ? null : <p className={hint}>{t(flowBlockedKey(line.blockedReason))}</p>}
                {quantity > 0 ? (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                    <Stepper value={quantity} max={line.returnableQty} name={name} onChange={(next) => flow.setQuantity(line.orderLineId, next)} />
                    <span className="text-[0.76rem] text-[var(--ink-2,#5b5148)]">
                      {t("afterSales.flow.items.ofAvailable", { count: line.returnableQty })}
                    </span>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

const textarea =
  "mt-1.5 w-full rounded-md border border-sa-input bg-white px-3.5 py-3 text-[14px] text-sa-primary outline-none focus-visible:border-[var(--copper,#8c4435)]";

function OptionalLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  const t = useShopCopy();
  return (
    <label htmlFor={htmlFor} className="text-[0.8rem] font-semibold text-[var(--ink,#241f1b)]">
      {children} <span className="font-normal text-[var(--ink-2,#5b5148)]">{t("afterSales.optional")}</span>
    </label>
  );
}

function ReasonStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const kind = flow.draft.kind ?? "return";
  const group = kind === "return" ? "returnReason" : "exchangeReason";
  return (
    <>
      <div role="radiogroup" aria-labelledby="flow-step-title" className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 max-[599px]:grid-cols-[minmax(0,1fr)]">
        {reasonCodesFor(kind).map((code) => (
          <label key={code} className={optionCard}>
            <input type="radio" name="after-sales-reason" className={radio} checked={flow.draft.reasonCode === code} onChange={() => flow.setReason(code)} />
            <span className="text-[0.85rem] text-[var(--ink,#241f1b)]">{afterSalesOptionLabel(group, code, t)}</span>
          </label>
        ))}
      </div>
      <div className="mt-5">
        <OptionalLabel htmlFor="flow-reason-text">{t("afterSales.moreDetail")}</OptionalLabel>
        <textarea
          id="flow-reason-text"
          rows={3}
          maxLength={500}
          className={textarea}
          value={flow.draft.reasonText}
          onChange={(event) => flow.setReasonText(event.target.value)}
        />
      </div>
    </>
  );
}

function ReplacementStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  if (flow.replacementOptionsLoading) return <Busy label={t("afterSales.flow.loading")} />;
  const currency = flow.currencyCode ?? "AED";
  const price = (option: ExchangeOption) => unitDifferenceText(option, t, (amount) => formatMoney(Number(amount), currency));
  return (
    <div className="flex flex-col gap-6">
      {flow.picked.map(({ line, quantity }) => {
        const name = line.productName ?? line.sku;
        return (
          <fieldset key={line.orderLineId} className="m-0 border-0 p-0">
            <legend className="mb-3 flex items-center gap-3">
              <Thumb src={line.imageUrl} />
              <span>
                <span className="block text-[0.88rem] font-semibold text-[var(--ink,#241f1b)]">{name}</span>
                <span className={`${hint} block`}>{t("afterSales.flow.replacement.forUnits", { count: quantity })}</span>
              </span>
            </legend>
            {line.isGift ? <p className={`${hint} mb-2.5`}>{t("afterSales.flow.replacement.giftOnly")}</p> : null}
            <div
              role="radiogroup"
              aria-label={t("afterSales.flow.replacement.for", { name })}
              className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,210px),1fr))] gap-2.5"
            >
              {lineOptions(flow.replacementOptions, line.orderLineId).map((option) => (
                <label key={option.sku} className={`${optionCard} items-center`}>
                  <input
                    type="radio"
                    name={`replacement-${line.orderLineId}`}
                    className="sr-only"
                    checked={flow.draft.replacements[line.orderLineId] === option.sku}
                    disabled={!option.inStock}
                    onChange={() => flow.setReplacement(line.orderLineId, option.sku)}
                  />
                  <Thumb src={option.imageUrl ?? line.imageUrl} />
                  <span className="min-w-0">
                    <span className="block text-[0.85rem] font-semibold text-[var(--ink,#241f1b)]">
                      {option.sameItem ? t("afterSales.flow.replacement.same") : option.variantName ?? option.productName ?? option.sku}
                    </span>
                    {option.sameItem && distinctVariantName(option.productName ?? name, option.variantName) ? (
                      <span className={`${hint} mt-0 block`}>{distinctVariantName(option.productName ?? name, option.variantName)}</span>
                    ) : null}
                    <span className={`${hint} block ${option.inStock ? "" : "text-[#8c3a2b]"}`}>
                      {option.inStock ? price(option) : t("afterSales.flow.replacement.outOfStock")}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function ReviewStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const kind = flow.draft.kind ?? "return";
  const replacement = (orderLineId: string) => {
    const option = lineOptions(flow.replacementOptions, orderLineId).find((o) => o.sku === flow.draft.replacements[orderLineId]);
    if (!option) return "";
    return option.sameItem ? t("afterSales.flow.replacement.same") : option.variantName ?? option.productName ?? option.sku;
  };
  return (
    <>
      <dl className="m-0 grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-[0.85rem] max-[599px]:grid-cols-[minmax(0,1fr)_auto]">
        <ReviewRow label={t("afterSales.flow.review.items")} onEdit={() => flow.goTo("items")}>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {flow.picked.map(({ line, quantity }) => (
              <li key={line.orderLineId}>
                {line.productName ?? line.sku} × {quantity}
                {kind === "exchange" ? (
                  <span className={`${hint} mt-0 block`}>{t("afterSales.flow.review.instead", { option: replacement(line.orderLineId) })}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </ReviewRow>
        <ReviewRow label={t("afterSales.flow.review.reason")} onEdit={() => flow.goTo("reason")}>
          {flow.draft.reasonCode ? afterSalesOptionLabel(kind === "return" ? "returnReason" : "exchangeReason", flow.draft.reasonCode, t) : null}
          {flow.draft.reasonText.trim() ? <span className={`${hint} mt-0 block [overflow-wrap:anywhere]`}>{flow.draft.reasonText.trim()}</span> : null}
        </ReviewRow>
      </dl>
      {flow.giftRequired ? (
        <div role="alert" className={`${orderNotice} ${orderNoticeTone.info} mt-5`}>
          <p className="m-0 font-semibold">{t("returnEstimate.giftRequiredTitle")}</p>
          <p className="m-0 mt-1">{t("afterSales.err.giftRequired")}</p>
          <button type="button" onClick={flow.addRequiredGifts} className={`${accountOrderCta} mt-3 cursor-pointer`}>
            {t("returnEstimate.addGift")}
          </button>
        </div>
      ) : null}
      <div className="mt-6">
        <OptionalLabel htmlFor="flow-note">{t("afterSales.teamNote")}</OptionalLabel>
        <textarea id="flow-note" rows={2} maxLength={2000} className={textarea} value={flow.draft.note} onChange={(event) => flow.setNote(event.target.value)} />
      </div>
      <p className={`${hint} mt-4`}>
        <LocaleLink href="/return-terms" className="font-medium text-[var(--copper,#8c4435)] underline underline-offset-4">
          {t("afterSales.flow.terms")}
        </LocaleLink>
      </p>
    </>
  );
}

function ReviewRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  const t = useShopCopy();
  return (
    <>
      <dt className="pt-0.5 text-[0.7rem] font-semibold tracking-[0.1em] text-[var(--ink-2,#5b5148)] uppercase max-[599px]:col-span-full">{label}</dt>
      <dd className="m-0 min-w-0 text-[var(--ink,#241f1b)]">{children}</dd>
      <dd className="m-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("afterSales.flow.review.editLabel", { section: label })}
          className="cursor-pointer border-0 bg-transparent p-0 text-[0.8rem] font-medium text-[var(--copper,#8c4435)] underline underline-offset-4 [font:inherit]"
        >
          {t("afterSales.flow.review.edit")}
        </button>
      </dd>
    </>
  );
}

const sumRow = "flex justify-between gap-3 text-[0.82rem] text-[var(--ink-2,#5b5148)]";
const sumTotal = "mt-2 flex justify-between gap-3 border-t border-[var(--line)] pt-2.5 text-[0.92rem] font-semibold text-[var(--ink,#241f1b)]";

function FlowSummary({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const kind = flow.draft.kind;
  return (
    <section className={accountPanel} aria-live="polite">
      <header className={accountPanelHead}>
        <h2 className={accountPanelTitle}>{t("afterSales.flow.summary.title")}</h2>
      </header>
      <div className={`${accountPanelBody} flex flex-col gap-2`}>
        {kind ? (
          <p className="m-0 text-[0.88rem] font-semibold text-[var(--ink,#241f1b)]">
            {kind === "return" ? t("afterSales.flow.choose.return") : t("afterSales.flow.choose.exchange")}
          </p>
        ) : null}
        {flow.picked.length ? (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {flow.picked.map(({ line, quantity }) => (
              <li key={line.orderLineId} className={sumRow}>
                <span className="min-w-0">{line.productName ?? line.sku}</span>
                <span className="tabular-nums">× {quantity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={hint}>{t("afterSales.flow.summary.empty")}</p>
        )}
        {kind === "return" && flow.returnEstimate.data && !flow.returnEstimate.empty ? <ReturnMoney flow={flow} /> : null}
        {kind === "exchange" && flow.exchangeEstimate.data && !flow.exchangeEstimate.empty ? <ExchangeMoney flow={flow} /> : null}
        {flow.estimateError ? <p className={`${hint} text-[#8c3a2b]`}>{flow.estimateError}</p> : null}
        {(kind === "return" ? flow.returnEstimate.updating : flow.exchangeEstimate.updating) ? (
          <p className={hint} role="status">
            {t("afterSales.flow.summary.updating")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ReturnMoney({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const view = returnEstimateView(flow.returnEstimate.data!, t, locale);
  return (
    <div className="mt-2 border-t border-[var(--line)] pt-3">
      {view.rows.map((row) =>
        row.strong ? (
          <p key={row.key} className={`${sumTotal} m-0`}>
            <span>{row.label}</span>
            <span className="tabular-nums">{row.value}</span>
          </p>
        ) : (
          <div key={row.key} className="mb-1.5">
            <p className={`${sumRow} m-0`}>
              <span>{row.label}</span>
              <span className="tabular-nums">{row.value}</span>
            </p>
            {row.hint ? <p className={`${hint} mt-0.5`}>{row.hint}</p> : null}
          </div>
        ),
      )}
      <p className={hint}>{t("afterSales.flow.summary.estimate")}</p>
      {view.destination ? <p className={hint}>{view.destination}</p> : null}
    </div>
  );
}

function ExchangeMoney({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const e = flow.exchangeEstimate.data!;
  const money = (amount: string) => formatMoney(Number(amount), e.currencyCode);
  const pays = Number(e.customerPayableAmount);
  const back = Number(e.refundableDifferenceAmount);
  const offer = Number(e.offerAdjustmentAmount);
  return (
    <div className="mt-2 border-t border-[var(--line)] pt-3">
      {Number(e.replacementDelivery.amount) > 0 ? (
        <p className={`${sumRow} m-0 mb-1.5`}>
          <span>{t("afterSales.flow.exchange.delivery")}</span>
          <span className="tabular-nums">{money(e.replacementDelivery.amount)}</span>
        </p>
      ) : null}
      {offer !== 0 ? (
        <p className={`${sumRow} m-0 mb-1.5`}>
          <span>{t("afterSales.flow.exchange.offer")}</span>
          <span className="tabular-nums">{offer > 0 ? money(e.offerAdjustmentAmount) : `− ${money(String(Math.abs(offer)))}`}</span>
        </p>
      ) : null}
      <p className={`${sumTotal} m-0`}>
        <span>{pays > 0 ? t("afterSales.flow.exchange.youPay") : back > 0 ? t("afterSales.flow.exchange.youGetBack") : t("afterSales.flow.exchange.even")}</span>
        <span className="tabular-nums">{pays > 0 ? money(e.customerPayableAmount) : back > 0 ? money(e.refundableDifferenceAmount) : ""}</span>
      </p>
      <p className={hint}>
        {pays > 0 ? t("afterSales.flow.exchange.payLater") : back > 0 ? t("afterSales.flow.exchange.refundLater") : t("afterSales.flow.exchange.evenNote")}
      </p>
      {!e.stockOk ? <p className={`${hint} text-[#8c3a2b]`}>{t("afterSales.flow.exchange.stock")}</p> : null}
    </div>
  );
}
