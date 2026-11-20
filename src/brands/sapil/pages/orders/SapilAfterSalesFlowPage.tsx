"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { ReturnOrderTarget } from "@/features/afterSales/hooks/useAfterSales";
import {
  useAfterSalesFlow,
  useAfterSalesFlowTarget,
  type AfterSalesFlow,
} from "@/features/afterSales/hooks/useAfterSalesFlow";
import type { AfterSalesKind, ExchangeOption } from "@/features/afterSales/types/afterSales";
import { flowBlockedKey, flowStepKey, unitDifferenceText } from "@/features/afterSales/utils/afterSalesFlowCopy";
import { distinctVariantName, lineOptions, reasonCodesFor } from "@/features/afterSales/utils/afterSalesFlow";
import { afterSalesOptionLabel, afterSalesStatusLabel } from "@/features/afterSales/utils/eligibility";
import { returnEstimateView } from "@/features/afterSales/utils/returnEstimateView";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  Breadcrumbs,
  Button,
  Eyebrow,
  QuantityStepper,
  RadioCardGroup,
  Steps,
  SummaryRow,
  TextAreaField,
  Wrap,
  cx,
  type Step,
} from "../../ui";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink, useSapilDate, useSapilMoney } from "../../components/commerce/shared";
import { OrderStateCard } from "../../components/orders/SapilOrderView";

type Props = {
  /** Signed-in customer's order (`/account/orders/[id]/return`). */
  orderId?: string;
  /** Guest order (`/track/[orderNumber]/return`), with the token this browser keeps. */
  orderNumber?: string;
  initialKind?: AfterSalesKind | null;
};

/**
 * The guided return / exchange (v9 design). The steps, rules and money come
 * from the shared flow (`useAfterSalesFlow`); this page only draws them.
 */
export function SapilAfterSalesFlowPage({ orderId, orderNumber, initialKind = null }: Props) {
  const t = useShopCopy();
  const { target, ready, missingToken } = useAfterSalesFlowTarget({ orderId, orderNumber });
  if (!ready) return <OrderStateCard busy title={t("afterSales.flow.loading")} />;
  if (missingToken || !target) {
    return (
      <OrderStateCard
        title={t("afterSales.flow.title")}
        body={t("afterSales.flow.noToken")}
        actions={
          <Button href={orderNumber ? `/track/${encodeURIComponent(orderNumber)}` : "/track"} LinkComponent={SapilLink}>
            {t("afterSales.flow.track")}
          </Button>
        }
      />
    );
  }
  return <FlowScreen target={target} initialKind={initialKind} />;
}

function orderHref(target: ReturnOrderTarget): string {
  return target.mode === "customer"
    ? `/account/orders/${encodeURIComponent(target.orderId)}`
    : `/track/${encodeURIComponent(target.orderNumber)}`;
}

function FlowScreen({ target, initialKind }: { target: ReturnOrderTarget; initialKind: AfterSalesKind | null }) {
  const t = useShopCopy();
  const sapil = useSapilCopy();
  const locale = useShopLocale();
  const flow = useAfterSalesFlow({ target, locale, initialKind });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // A new step: bring its heading into view and give it focus (screen readers hear where they are).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [flow.step, flow.result]);

  const back = orderHref(target);
  const reference = flow.orderNumber;
  const crumbs =
    target.mode === "customer"
      ? [
          { label: sapil("account.home"), href: "/" },
          { label: sapil("account.ordersTitle"), href: "/account/orders" },
          { label: reference ?? "…", href: back },
          { label: t("afterSales.flow.crumb") },
        ]
      : [
          { label: sapil("account.home"), href: "/" },
          { label: reference ?? "…", href: back },
          { label: t("afterSales.flow.crumb") },
        ];

  if (flow.result) {
    return (
      <Wrap className="pb-[72px]">
        <Breadcrumbs label={sapil("content.breadcrumb")} items={crumbs} LinkComponent={SapilLink} className="pt-[20px]" />
        <section className="bg-sapil-p-mint rounded-[32px] py-[48px] px-[44px] mt-[24px] max-900:py-[32px] max-900:px-[22px] max-900:rounded-[24px]">
          <Eyebrow>{t("afterSales.flow.done.number", { number: flow.result.requestNumber })}</Eyebrow>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-sapil-display font-[400] text-[clamp(34px,4vw,52px)] leading-[1.05] mt-[10px] mb-[12px] outline-none"
          >
            {flow.result.kind === "return" ? t("afterSales.flow.done.returnTitle") : t("afterSales.flow.done.exchangeTitle")}
          </h1>
          <p className="text-sapil-ink-2 max-w-[62ch]">
            {afterSalesStatusLabel(flow.result.status, t)}. {t("afterSales.flow.done.body")}
          </p>
          <div className="flex flex-wrap gap-[10px] mt-[24px]">
            <Button href={back} LinkComponent={SapilLink}>
              {t("afterSales.flow.done.order")}
            </Button>
            {target.mode === "customer" ? (
              <Button href="/account/returns" variant="line" LinkComponent={SapilLink}>
                {t("afterSales.flow.done.all")}
              </Button>
            ) : null}
          </div>
        </section>
      </Wrap>
    );
  }

  const steps: Step[] = flow.steps.map((step, index) => ({
    label: t(flowStepKey(step)),
    state: index < flow.stepIndex ? "done" : index === flow.stepIndex ? "current" : "upcoming",
    onSelect: index < flow.stepIndex ? () => flow.goTo(step) : undefined,
    selectLabel: t("afterSales.flow.revisit", { step: t(flowStepKey(step)) }),
  }));
  const last = flow.step === "review";

  return (
    <Wrap className="pb-[72px]">
      <Breadcrumbs label={sapil("content.breadcrumb")} items={crumbs} LinkComponent={SapilLink} className="pt-[20px]" />
      <header className="mt-[24px] mb-[20px]">
        <Eyebrow>
          <span dir="ltr">{reference ? t("afterSales.flow.eyebrow", { number: reference }) : " "}</span>
        </Eyebrow>
        <h1 className="font-sapil-display font-[400] text-[clamp(34px,4vw,52px)] leading-[1.05] mt-[10px]">
          {t("afterSales.flow.title")}
        </h1>
      </header>

      <Steps steps={steps} label={t("afterSales.flow.progressLabel")} className="mb-[20px]" />

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-[20px] items-start max-900:grid-cols-[minmax(0,1fr)]">
        <section
          aria-labelledby="flow-step-title"
          className="bg-sapil-white rounded-[28px] py-[32px] px-[36px] max-900:py-[24px] max-900:px-[20px] max-900:rounded-[22px]"
        >
          <h2
            id="flow-step-title"
            ref={headingRef}
            tabIndex={-1}
            className="font-sapil-sans font-[600] text-[22px] leading-[1.25] mb-[18px] outline-none"
          >
            {stepTitle(flow, t)}
          </h2>
          <StepBody flow={flow} />
          {flow.submitError ? (
            <p role="alert" className="mt-[18px] text-[14px] text-sapil-sale">
              {flow.submitError}
            </p>
          ) : null}
          {/* Back / Continue. On phones the bar stays at the bottom of the screen while the step scrolls. */}
          <div className="flex items-center justify-between gap-[12px] mt-[28px] pt-[20px] border-t border-sapil-line max-600:sticky max-600:bottom-0 max-600:z-[2] max-600:bg-sapil-white max-600:mx-[-20px] max-600:px-[20px] max-600:pb-[16px] max-600:mb-[-24px] max-600:rounded-b-[22px]">
            {flow.stepIndex > 0 ? (
              <Button variant="line" onClick={flow.back} disabled={flow.submitting} className="max-600:!px-[16px]">
                {t("afterSales.flow.back")}
              </Button>
            ) : (
              <SapilLink href={back} className="text-[14px] underline">
                {t("afterSales.flow.cancel")}
              </SapilLink>
            )}
            {last ? (
              <Button onClick={() => void flow.submit()} disabled={!flow.canContinue || flow.submitting} className="max-600:flex-1 max-600:!px-[16px] max-600:!text-[14px]">
                {flow.submitting
                  ? t("afterSales.flow.sending")
                  : flow.draft.kind === "exchange"
                    ? t("afterSales.flow.submitExchange")
                    : t("afterSales.flow.submitReturn")}
              </Button>
            ) : (
              <Button onClick={flow.next} disabled={!flow.canContinue} className="max-600:flex-1 max-600:!px-[16px] max-600:!text-[14px]">
                {t("afterSales.flow.continue")}
              </Button>
            )}
          </div>
        </section>

        <aside className="sticky top-[96px] max-900:static">
          <FlowSummary flow={flow} />
        </aside>
      </div>
    </Wrap>
  );
}

function stepTitle(flow: AfterSalesFlow, t: ReturnType<typeof useShopCopy>): string {
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

function ChooseStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const date = useSapilDate();
  if (flow.choicesLoading) return <Busy label={t("afterSales.flow.loading")} />;
  const describe = (kind: AfterSalesKind) => {
    const choice = flow.choices.find((c) => c.kind === kind)!;
    const body = kind === "return" ? t("afterSales.flow.choose.returnBody") : t("afterSales.flow.choose.exchangeBody");
    return (
      <>
        {body}
        {choice.allowed && choice.eligibleUntil ? (
          <span className="block mt-[4px] text-sapil-ink">{t("afterSales.flow.until", { date: date(choice.eligibleUntil) })}</span>
        ) : null}
        {!choice.allowed && choice.note ? <span className="block mt-[4px] text-sapil-sale">{choice.note}</span> : null}
      </>
    );
  };
  return (
    <RadioCardGroup
      name="after-sales-kind"
      aria-labelledby="flow-step-title"
      value={flow.draft.kind ?? ""}
      onValueChange={(value) => flow.choose(value as AfterSalesKind)}
      options={(["return", "exchange"] as const).map((kind) => ({
        value: kind,
        title: kind === "return" ? t("afterSales.flow.choose.return") : t("afterSales.flow.choose.exchange"),
        description: describe(kind),
        disabled: !flow.choices.find((c) => c.kind === kind)?.allowed,
      }))}
    />
  );
}

function ItemImage({ src, alt }: { src: string | null; alt: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- catalogue images come from the CDN as-is
    <img src={src} alt={alt} className="w-[64px] h-[64px] rounded-[14px] object-cover bg-sapil-paper flex-none" />
  ) : (
    <span aria-hidden="true" className="w-[64px] h-[64px] rounded-[14px] bg-sapil-paper flex-none" />
  );
}

function ItemsStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  if (flow.linesLoading) return <Busy label={t("afterSales.flow.loading")} />;
  if (flow.linesError) return <p role="alert" className="text-sapil-sale text-[14px]">{flow.linesError}</p>;
  if (!flow.lines.length) return <p className="text-sapil-ink-2">{t("afterSales.flow.items.none")}</p>;
  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="sr-only">{t("afterSales.flow.items.legend")}</legend>
      <p className="text-sapil-ink-2 text-[15px] mb-[16px]">{t("afterSales.flow.items.intro")}</p>
      <ul className="flex flex-col gap-[12px]">
        {flow.lines.map((line) => {
          const name = line.productName ?? line.sku;
          const quantity = flow.draft.quantities[line.orderLineId] ?? 0;
          const picked = quantity > 0;
          const pickable = line.returnableQty > 0 && !line.blockedReason;
          const id = `flow-line-${line.orderLineId}`;
          return (
            <li
              key={line.orderLineId}
              className={cx(
                "rounded-[20px] border p-[14px] grid grid-cols-[auto_auto_minmax(0,1fr)] gap-[14px] items-center",
                "max-600:grid-cols-[auto_auto_minmax(0,1fr)]",
                picked ? "border-sapil-accent bg-sapil-paper" : "border-sapil-line",
                !pickable && "opacity-60",
              )}
            >
              <input
                id={id}
                type="checkbox"
                className="w-[20px] h-[20px] accent-sapil-accent"
                checked={picked}
                disabled={!pickable}
                onChange={(event) => flow.toggleLine(line.orderLineId, event.target.checked)}
              />
              <ItemImage src={line.imageUrl} alt="" />
              <div className="min-w-0">
                <label htmlFor={id} className="block font-[600] text-[15px] leading-[1.3] cursor-pointer">
                  {name}
                </label>
                <small className="block text-[13px] text-sapil-muted mt-[2px]">
                  {[distinctVariantName(line.productName, line.variantName), t("afterSales.flow.items.bought", { count: line.orderedQty })]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {pickable ? null : (
                  <small className="block text-[13px] text-sapil-ink-2 mt-[2px]">{t(flowBlockedKey(line.blockedReason))}</small>
                )}
                {picked ? (
                  <div className="flex items-center gap-[10px] mt-[8px] flex-wrap">
                    <QuantityStepper
                      value={quantity}
                      min={1}
                      max={line.returnableQty}
                      itemLabel={name}
                      variant="compact"
                      className="!mt-0"
                      labels={{
                        group: t("afterSales.quantityOf", { name }),
                        decrease: t("afterSales.flow.items.fewer", { name }),
                        increase: t("afterSales.flow.items.more", { name }),
                      }}
                      onChange={(next) => flow.setQuantity(line.orderLineId, next)}
                    />
                    <small className="text-[13px] text-sapil-muted">
                      {t("afterSales.flow.items.ofAvailable", { count: line.returnableQty })}
                    </small>
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

function ReasonStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const kind = flow.draft.kind ?? "return";
  const group = kind === "return" ? "returnReason" : "exchangeReason";
  return (
    <>
      <RadioCardGroup
        name="after-sales-reason"
        aria-labelledby="flow-step-title"
        value={flow.draft.reasonCode ?? ""}
        onValueChange={flow.setReason}
        options={reasonCodesFor(kind).map((code) => ({ value: code, title: afterSalesOptionLabel(group, code, t) }))}
      />
      <TextAreaField
        id="flow-reason-text"
        className="mt-[20px]"
        label={t("afterSales.moreDetail")}
        optional={t("afterSales.optional")}
        rows={3}
        maxLength={500}
        value={flow.draft.reasonText}
        onChange={(event) => flow.setReasonText(event.target.value)}
      />
    </>
  );
}

function ReplacementStep({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const money = useSapilMoney();
  if (flow.replacementOptionsLoading) return <Busy label={t("afterSales.flow.loading")} />;
  const currency = flow.currencyCode ?? "AED";
  const price = (option: ExchangeOption) => unitDifferenceText(option, t, (amount) => money(Number(amount), currency));
  return (
    <div className="flex flex-col gap-[24px]">
      {flow.picked.map(({ line, quantity }) => {
        const options = lineOptions(flow.replacementOptions, line.orderLineId);
        const name = line.productName ?? line.sku;
        return (
          <fieldset key={line.orderLineId} className="border-0 p-0 m-0">
            <legend className="flex items-center gap-[12px] mb-[12px] font-[600] text-[15px]">
              <ItemImage src={line.imageUrl} alt="" />
              <span>
                {name}
                <small className="block font-[400] text-[13px] text-sapil-muted">
                  {t("afterSales.flow.replacement.forUnits", { count: quantity })}
                </small>
              </span>
            </legend>
            {line.isGift ? <p className="text-[13px] text-sapil-ink-2 mb-[10px]">{t("afterSales.flow.replacement.giftOnly")}</p> : null}
            <div role="radiogroup" aria-label={t("afterSales.flow.replacement.for", { name })} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-[10px]">
              {options.map((option) => {
                const selected = flow.draft.replacements[line.orderLineId] === option.sku;
                const label = option.sameItem
                  ? t("afterSales.flow.replacement.same")
                  : option.variantName ?? option.productName ?? option.sku;
                return (
                  <label
                    key={option.sku}
                    className={cx(
                      "relative flex items-center gap-[12px] rounded-[18px] border p-[12px] cursor-pointer [transition:border-color_.2s,box-shadow_.2s]",
                      selected ? "border-sapil-accent shadow-[0_0_0_3px_var(--sapil-accent-soft)]" : "border-sapil-line hover:border-sapil-line-2",
                      !option.inStock && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={`replacement-${line.orderLineId}`}
                      value={option.sku}
                      checked={selected}
                      disabled={!option.inStock}
                      onChange={() => flow.setReplacement(line.orderLineId, option.sku)}
                    />
                    <ItemImage src={option.imageUrl ?? line.imageUrl} alt="" />
                    <span className="min-w-0">
                      <b className="block font-[600] text-[14px] leading-[1.3]">{label}</b>
                      {option.sameItem && distinctVariantName(option.productName ?? name, option.variantName) ? (
                        <small className="block text-[12px] text-sapil-muted">{distinctVariantName(option.productName ?? name, option.variantName)}</small>
                      ) : null}
                      <small className={cx("block text-[13px] mt-[2px]", option.inStock ? "text-sapil-ink-2" : "text-sapil-sale")}>
                        {option.inStock ? price(option) : t("afterSales.flow.replacement.outOfStock")}
                      </small>
                    </span>
                  </label>
                );
              })}
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
  return (
    <>
      <dl className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto] gap-x-[16px] gap-y-[12px] text-[15px] max-600:grid-cols-[minmax(0,1fr)_auto]">
        <ReviewRow label={t("afterSales.flow.review.items")} onEdit={() => flow.goTo("items")}>
          <ul className="flex flex-col gap-[4px]">
            {flow.picked.map(({ line, quantity }) => (
              <li key={line.orderLineId}>
                {line.productName ?? line.sku} × {quantity}
                {kind === "exchange" ? (
                  <small className="block text-[13px] text-sapil-muted">
                    {t("afterSales.flow.review.instead", { option: replacementLabel(flow, line.orderLineId, t) })}
                  </small>
                ) : null}
              </li>
            ))}
          </ul>
        </ReviewRow>
        <ReviewRow label={t("afterSales.flow.review.reason")} onEdit={() => flow.goTo("reason")}>
          {flow.draft.reasonCode
            ? afterSalesOptionLabel(kind === "return" ? "returnReason" : "exchangeReason", flow.draft.reasonCode, t)
            : null}
          {flow.draft.reasonText.trim() ? (
            <small className="block text-[13px] text-sapil-muted [overflow-wrap:anywhere]">{flow.draft.reasonText.trim()}</small>
          ) : null}
        </ReviewRow>
      </dl>
      {flow.giftRequired ? (
        <div role="alert" className="mt-[20px] rounded-[18px] bg-sapil-p-sky py-[14px] px-[18px] text-[14px]">
          <b className="block font-[600]">{t("returnEstimate.giftRequiredTitle")}</b>
          <p className="mt-[4px] text-sapil-ink-2">{t("afterSales.err.giftRequired")}</p>
          <Button variant="line" onClick={flow.addRequiredGifts} className="mt-[10px] !h-[40px] !px-[16px] !text-[14px]">
            {t("returnEstimate.addGift")}
          </Button>
        </div>
      ) : null}
      <TextAreaField
        id="flow-note"
        className="mt-[24px]"
        label={t("afterSales.teamNote")}
        optional={t("afterSales.optional")}
        rows={2}
        maxLength={2000}
        value={flow.draft.note}
        onChange={(event) => flow.setNote(event.target.value)}
      />
      <p className="mt-[16px] text-[13px] text-sapil-ink-2">
        <SapilLink href="/return-terms" className="underline">
          {t("afterSales.flow.terms")}
        </SapilLink>
      </p>
    </>
  );
}

function replacementLabel(flow: AfterSalesFlow, orderLineId: string, t: ReturnType<typeof useShopCopy>): string {
  const option = lineOptions(flow.replacementOptions, orderLineId).find((o) => o.sku === flow.draft.replacements[orderLineId]);
  if (!option) return "";
  return option.sameItem ? t("afterSales.flow.replacement.same") : option.variantName ?? option.productName ?? option.sku;
}

function ReviewRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  const t = useShopCopy();
  return (
    <>
      <dt className="text-sapil-muted text-[13px] font-[600] uppercase tracking-[.08em] pt-[2px] max-600:col-span-full">{label}</dt>
      <dd className="min-w-0">{children}</dd>
      <dd>
        <button type="button" onClick={onEdit} className="text-[14px] underline" aria-label={t("afterSales.flow.review.editLabel", { section: label })}>
          {t("afterSales.flow.review.edit")}
        </button>
      </dd>
    </>
  );
}

/** Right column (under the step on phones): what is being asked so far, and the money. */
function FlowSummary({ flow }: { flow: AfterSalesFlow }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const money = useSapilMoney();
  const kind = flow.draft.kind;
  return (
    <div className="bg-sapil-white rounded-[24px] py-[24px] px-[26px] max-900:p-[20px]" aria-live="polite">
      <h2 className="font-sapil-sans font-[600] text-[13px] tracking-[.1em] uppercase text-sapil-muted mb-[12px]">
        {t("afterSales.flow.summary.title")}
      </h2>
      {kind ? (
        <p className="font-[600] mb-[10px]">{kind === "return" ? t("afterSales.flow.choose.return") : t("afterSales.flow.choose.exchange")}</p>
      ) : null}
      {flow.picked.length ? (
        <ul className="flex flex-col gap-[6px] text-[14px] mb-[12px]">
          {flow.picked.map(({ line, quantity }) => (
            <li key={line.orderLineId} className="flex justify-between gap-[10px]">
              <span className="min-w-0">{line.productName ?? line.sku}</span>
              <span className="tabular-nums">× {quantity}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-sapil-muted">{t("afterSales.flow.summary.empty")}</p>
      )}
      {kind === "return" && flow.returnEstimate.data && !flow.returnEstimate.empty ? (
        <ReturnMoney flow={flow} locale={locale} />
      ) : null}
      {kind === "exchange" && flow.exchangeEstimate.data && !flow.exchangeEstimate.empty ? (
        <ExchangeMoney flow={flow} money={(amount) => money(Number(amount), flow.exchangeEstimate.data!.currencyCode)} />
      ) : null}
      {flow.estimateError ? <p className="text-[13px] text-sapil-sale mt-[8px]">{flow.estimateError}</p> : null}
      {(kind === "return" ? flow.returnEstimate.updating : flow.exchangeEstimate.updating) ? (
        <p className="text-[13px] text-sapil-muted mt-[8px]" role="status">
          {t("afterSales.flow.summary.updating")}
        </p>
      ) : null}
    </div>
  );
}

function ReturnMoney({ flow, locale }: { flow: AfterSalesFlow; locale: string }) {
  const t = useShopCopy();
  const view = returnEstimateView(flow.returnEstimate.data!, t, locale);
  return (
    <div className="border-t border-sapil-line pt-[12px]">
      {view.rows.map((row) => (
        <div key={row.key}>
          <SummaryRow label={row.label} value={row.value} variant={row.strong ? "total" : "default"} />
          {row.hint && !row.strong ? <p className="text-[12px] text-sapil-muted mb-[6px]">{row.hint}</p> : null}
        </div>
      ))}
      <p className="text-[12px] text-sapil-muted mt-[6px]">{t("afterSales.flow.summary.estimate")}</p>
      {view.destination ? <p className="text-[12px] text-sapil-ink-2 mt-[6px]">{view.destination}</p> : null}
    </div>
  );
}

function ExchangeMoney({ flow, money }: { flow: AfterSalesFlow; money: (amount: string) => string }) {
  const t = useShopCopy();
  const e = flow.exchangeEstimate.data!;
  const pays = Number(e.customerPayableAmount);
  const back = Number(e.refundableDifferenceAmount);
  const offer = Number(e.offerAdjustmentAmount);
  return (
    <div className="border-t border-sapil-line pt-[12px]">
      {Number(e.replacementDelivery.amount) > 0 ? (
        <SummaryRow label={t("afterSales.flow.exchange.delivery")} value={money(e.replacementDelivery.amount)} />
      ) : null}
      {offer !== 0 ? (
        <SummaryRow label={t("afterSales.flow.exchange.offer")} value={offer > 0 ? money(e.offerAdjustmentAmount) : `− ${money(String(Math.abs(offer)))}`} />
      ) : null}
      <SummaryRow
        variant="total"
        label={pays > 0 ? t("afterSales.flow.exchange.youPay") : back > 0 ? t("afterSales.flow.exchange.youGetBack") : t("afterSales.flow.exchange.even")}
        value={pays > 0 ? money(e.customerPayableAmount) : back > 0 ? money(e.refundableDifferenceAmount) : ""}
      />
      <p className="text-[12px] text-sapil-muted">
        {pays > 0 ? t("afterSales.flow.exchange.payLater") : back > 0 ? t("afterSales.flow.exchange.refundLater") : t("afterSales.flow.exchange.evenNote")}
      </p>
      {!e.stockOk ? <p className="text-[12px] text-sapil-sale mt-[6px]">{t("afterSales.flow.exchange.stock")}</p> : null}
    </div>
  );
}

function Busy({ label }: { label: string }) {
  return (
    <p role="status" className="flex items-center gap-[10px] text-sapil-ink-2">
      <span aria-hidden="true" className="w-[20px] h-[20px] rounded-full border-[2px] border-sapil-line border-t-sapil-accent motion-safe:animate-spin" />
      {label}
    </p>
  );
}
