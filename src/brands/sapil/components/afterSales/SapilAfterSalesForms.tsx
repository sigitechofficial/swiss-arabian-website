"use client";

import type { FieldErrors, FieldValues, UseFormRegister, UseFormWatch } from "react-hook-form";
import {
  afterSalesLineErrors,
  useExchangeRequestForm,
  useReturnRequestForm,
  type AfterSalesFormProps,
} from "@/features/afterSales/hooks/useAfterSalesForms";
import type { AfterSalesOrderLine, ReturnEstimate } from "@/features/afterSales/types/afterSales";
import { afterSalesErrorMessage } from "@/features/afterSales/utils/afterSalesErrors";
import { afterSalesOptionCodes, afterSalesOptionLabel } from "@/features/afterSales/utils/eligibility";
import { returnEstimateView } from "@/features/afterSales/utils/returnEstimateView";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Button, Field, SelectField, TextAreaField, cx } from "../../ui";

const FORM = "flex flex-col gap-[18px] rounded-[24px] bg-sapil-paper p-[24px] max-600:p-[16px] max-600:rounded-[20px]";
const TITLE = "sapil-h font-sapil-sans font-[700] text-[22px] leading-[1.2] tracking-[-.02em]";
const LEDE = "text-[14px] leading-[1.55] text-sapil-ink-2 -mt-[8px]";
const GRID = "grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[14px] max-600:grid-cols-[minmax(0,1fr)]";

/** The order's lines to pick from (quantity per line; replacement SKU and size for an exchange). */
function SapilLinePicker<T extends FieldValues>({
  idPrefix,
  catalog,
  register,
  watch,
  errors,
  showReplacement = false,
}: {
  idPrefix: string;
  catalog: AfterSalesOrderLine[];
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  showReplacement?: boolean;
}) {
  const t = useShopCopy();
  const values = watch("lines" as never) as unknown as { selected?: boolean }[] | undefined;
  const lineErrors = afterSalesLineErrors(errors as never);
  return (
    <fieldset className="border-0 p-0 m-0 flex flex-col gap-[10px]">
      <legend className="text-[14px] font-[600] mb-[8px]">{t("afterSales.items")}</legend>
      {lineErrors.list ? (
        <p role="alert" className="text-[13px] text-sapil-sale">
          {formErrorText(t, lineErrors.list)}
        </p>
      ) : null}
      {catalog.map((line, index) => {
        const selected = Boolean(values?.[index]?.selected);
        const error = lineErrors.line(index);
        const name = line.productName ?? line.sku;
        return (
          <div key={line.orderLineId} className={cx("rounded-[18px] bg-sapil-white p-[16px] flex flex-col gap-[12px] border", selected ? "border-sapil-accent" : "border-transparent")}>
            <div className="flex items-start gap-[12px]">
              <input
                id={`${idPrefix}-line-${index}`}
                type="checkbox"
                className="mt-[3px] w-[18px] h-[18px] shrink-0 accent-sapil-accent"
                {...register(`lines.${index}.selected` as never)}
              />
              <label htmlFor={`${idPrefix}-line-${index}`} className="min-w-0 flex-1 cursor-pointer">
                <b className="block text-[15px] font-[600] leading-[1.3]">{name}</b>
                <small className="block text-[13px] text-sapil-muted mt-[2px]">
                  {[line.variantName, line.sku, t("afterSales.ordered", { count: line.quantity })].filter(Boolean).join(" · ")}
                </small>
              </label>
              <Field
                id={`${idPrefix}-qty-${index}`}
                type="number"
                min={1}
                max={line.quantity}
                disabled={!selected}
                label={<span className="sr-only">{t("afterSales.quantityOf", { name })}</span>}
                className="w-[84px] shrink-0 !gap-0"
                inputClassName="!h-[44px] text-center"
                error={error.quantity ? formErrorText(t, error.quantity) : undefined}
                {...register(`lines.${index}.quantity` as never, { valueAsNumber: true })}
              />
            </div>
            {showReplacement && selected ? (
              <div className={GRID}>
                <Field
                  id={`${idPrefix}-sku-${index}`}
                  label={t("afterSales.replacementSku")}
                  placeholder={line.sku}
                  dir="ltr"
                  error={error.replacementSku ? formErrorText(t, error.replacementSku) : undefined}
                  {...register(`lines.${index}.replacementSku` as never)}
                />
                <Field
                  id={`${idPrefix}-size-${index}`}
                  label={t("afterSales.sizeVariant")}
                  placeholder={t("afterSales.sizePlaceholder")}
                  {...register(`lines.${index}.replacementSize` as never)}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}

/** The refund the customer can expect (backend figures, same calculator as the refund); always "an estimate". */
function SapilReturnEstimate({
  estimate,
  empty,
  loading,
  updating,
  error,
  onAddGift,
}: {
  estimate: ReturnEstimate | undefined;
  empty: boolean;
  loading: boolean;
  updating: boolean;
  error: unknown;
  onAddGift?: (orderLineIds: string[]) => void;
}) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const view = estimate && !error ? returnEstimateView(estimate, t, locale) : null;
  return (
    <section
      aria-live="polite"
      aria-busy={updating || loading}
      aria-label={t("returnEstimate.title")}
      data-sapil="return-estimate"
      className="rounded-[18px] bg-sapil-white p-[18px] flex flex-col gap-[12px]"
    >
      <div className="flex items-baseline justify-between gap-[12px]">
        <p className="text-[12px] font-[700] tracking-[.14em] uppercase text-sapil-muted">{t("returnEstimate.title")}</p>
        {updating && estimate ? <span className="text-[12px] text-sapil-muted">{t("returnEstimate.updating")}</span> : null}
      </div>
      {empty ? (
        <p className="text-[14px] text-sapil-ink-2">{t("returnEstimate.selectItems")}</p>
      ) : !estimate && loading ? (
        <p className="text-[14px] text-sapil-ink-2">{t("returnEstimate.loading")}</p>
      ) : !view ? (
        <p role="status" className="text-[14px] text-sapil-ink-2">
          {error ? afterSalesErrorMessage(error, t) : t("returnEstimate.unavailable")}
        </p>
      ) : (
        <>
          <dl className="m-0 grid">
            {view.rows.map((row) => (
              <div key={row.key} className={cx("py-[8px] border-b border-sapil-line last:border-b-0", row.strong && "pt-[12px]")}>
                <div className={cx("flex items-baseline justify-between gap-[16px]", row.strong ? "text-[17px] font-[700]" : "text-[14px]")}>
                  <dt className="min-w-0">{row.label}</dt>
                  <dd className="m-0 shrink-0 tabular-nums" dir="ltr">
                    {row.value}
                  </dd>
                </div>
                {row.hint ? <p className="text-[12px] leading-[1.5] text-sapil-muted mt-[2px]">{row.hint}</p> : null}
              </div>
            ))}
          </dl>
          {view.giftRequired ? (
            <div role="alert" className="rounded-[14px] bg-sapil-p-butter p-[14px] flex flex-col gap-[6px]">
              <b className="text-[14px] font-[600]">{t("returnEstimate.giftRequiredTitle")}</b>
              <p className="text-[14px] leading-[1.5]">{t("afterSales.err.giftRequired")}</p>
              {onAddGift ? (
                <Button variant="line" className="self-start !h-[40px] !px-[16px] !text-[14px]" onClick={() => onAddGift(view.giftRequired!.lineIds)}>
                  {t("returnEstimate.addGift")}
                </Button>
              ) : null}
            </div>
          ) : null}
          {view.notes.length ? (
            <ul className="list-none p-0 m-0 grid gap-[4px] text-[13px] leading-[1.5] text-sapil-ink-2">
              {view.notes.map((note) => (
                <li key={note.key}>{note.text}</li>
              ))}
            </ul>
          ) : null}
          <p className="text-[13px] leading-[1.5] text-sapil-ink-2">
            <b className="font-[600] text-sapil-ink">{t("returnEstimate.whereMoneyGoes")}</b> {view.destination}
          </p>
        </>
      )}
    </section>
  );
}

/** v9 return request: items, reason, resolution, notes and the live refund estimate. */
export function SapilReturnForm(props: AfterSalesFormProps) {
  const t = useShopCopy();
  const { form, onSubmit, pending, estimate, showEstimate, addGift } = useReturnRequestForm(props);
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  return (
    <form className={FORM} onSubmit={onSubmit} noValidate data-sapil="return-form">
      <p role="heading" aria-level={3} className={TITLE}>
        {t("afterSales.requestAReturn")}
      </p>
      <p className={LEDE}>{t("afterSales.returnNote")}</p>
      <SapilLinePicker idPrefix="return" catalog={props.lines} register={register} watch={watch} errors={errors} />
      <div className={GRID}>
        <SelectField id="return-reason" label={t("afterSales.reason")} {...register("reasonCode")}>
          {afterSalesOptionCodes("returnReason").map((value) => (
            <option key={value} value={value}>
              {afterSalesOptionLabel("returnReason", value, t)}
            </option>
          ))}
        </SelectField>
        <SelectField id="return-resolution" label={t("afterSales.resolution")} {...register("requestedResolution")}>
          {afterSalesOptionCodes("returnResolution")
            .filter((value) => value === "REFUND" || value === "EXCHANGE")
            .map((value) => (
              <option key={value} value={value}>
                {afterSalesOptionLabel("returnResolution", value, t)}
              </option>
            ))}
        </SelectField>
      </div>
      <TextAreaField id="return-detail" label={t("afterSales.moreDetail")} optional rows={3} {...register("reasonText")} />
      <TextAreaField id="return-note" label={t("afterSales.teamNote")} optional rows={2} {...register("customerNote")} />
      {showEstimate ? (
        <SapilReturnEstimate
          estimate={estimate.empty ? undefined : estimate.data}
          empty={estimate.empty}
          loading={estimate.isLoading || (estimate.updating && !estimate.data)}
          updating={estimate.updating}
          error={estimate.error}
          onAddGift={addGift}
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-[12px]">
        <Button type="submit" disabled={pending} className={cx(pending && "opacity-60 cursor-wait")}>
          {pending ? t("reviewForm.submitting") : t("afterSales.submitReturn")}
        </Button>
        {props.onCancel ? (
          <Button variant="link" onClick={props.onCancel}>
            {t("account.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

/** v9 exchange request: items with their replacement, reason, type and a note. */
export function SapilExchangeForm(props: AfterSalesFormProps) {
  const t = useShopCopy();
  const { form, onSubmit, pending } = useExchangeRequestForm(props);
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  return (
    <form className={FORM} onSubmit={onSubmit} noValidate data-sapil="exchange-form">
      <p role="heading" aria-level={3} className={TITLE}>
        {t("afterSales.requestAnExchange")}
      </p>
      <p className={LEDE}>{t("afterSales.exchangeNote")}</p>
      <SapilLinePicker idPrefix="exchange" catalog={props.lines} register={register} watch={watch} errors={errors} showReplacement />
      <div className={GRID}>
        <SelectField id="exchange-reason" label={t("afterSales.reason")} {...register("reasonCode")}>
          {afterSalesOptionCodes("exchangeReason").map((value) => (
            <option key={value} value={value}>
              {afterSalesOptionLabel("exchangeReason", value, t)}
            </option>
          ))}
        </SelectField>
        <SelectField id="exchange-type" label={t("afterSales.exchangeType")} {...register("exchangeType")}>
          {afterSalesOptionCodes("exchangeType").map((value) => (
            <option key={value} value={value}>
              {afterSalesOptionLabel("exchangeType", value, t)}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField id="exchange-note" label={t("afterSales.teamNote")} optional rows={2} {...register("customerNote")} />
      <div className="flex flex-wrap items-center gap-[12px]">
        <Button type="submit" disabled={pending} className={cx(pending && "opacity-60 cursor-wait")}>
          {pending ? t("reviewForm.submitting") : t("afterSales.submitExchange")}
        </Button>
        {props.onCancel ? (
          <Button variant="link" onClick={props.onCancel}>
            {t("account.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
