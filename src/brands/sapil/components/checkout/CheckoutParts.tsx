"use client";

import { forwardRef, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  Button,
  Field,
  FieldGrid,
  Fieldset,
  QuantityStepper,
  RadioCardGroup,
  SelectField,
  Steps,
  Wrap,
  type RadioCardOption,
  type Step,
} from "../../ui";
import { buttonClass } from "../../ui/Button";
import { ChevronIcon, cx, DefaultLink, type SapilLinkComponent } from "../../ui/shared";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilPhoneField } from "../commerce/SapilPhoneField";

/* ——— heading + progress (v9 `.co-head`) ——— */

export type CheckoutStepKey = "delivery" | "payment";

export function CheckoutHeader({
  step,
  bagHint,
  onOpenBag,
  hidden,
}: {
  step: CheckoutStepKey;
  bagHint: string;
  onOpenBag: () => void;
  hidden?: boolean;
}) {
  const t = useSapilCopy();
  const steps: Step[] = [
    { label: t("checkout.stepBag"), hint: bagHint, state: "done", onSelect: onOpenBag, selectLabel: t("checkout.stepBagOpen") },
    {
      label: t("checkout.stepDelivery"),
      hint: t("checkout.stepDeliveryHint"),
      state: step === "delivery" ? "current" : "done",
    },
    {
      label: t("checkout.stepPayment"),
      hint: t("checkout.stepPaymentHint"),
      state: step === "payment" ? "current" : "upcoming",
    },
    { label: t("checkout.stepConfirmation"), hint: t("checkout.stepConfirmationHint"), state: "upcoming" },
  ];
  return (
    <Wrap as="section" hidden={hidden} className="pt-[40px] max-900:pt-[24px]" data-co-head="">
      <div className="flex items-end justify-between gap-y-[16px] gap-x-[24px] flex-wrap mb-[20px] max-900:mb-[14px]">
        <h1 className="font-sapil-display font-[400] text-[clamp(36px,4vw,52px)] leading-[1] tracking-[-.01em] max-900:text-[34px]">
          {t("checkout.title")}
        </h1>
        <span className="flex items-center gap-[8px] text-[14px] font-[500] text-sapil-ink-2 max-900:text-[13px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="w-[20px] h-[20px] text-sapil-ok">
            <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
            <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
          </svg>
          {t("checkout.secure")}
          <span className="max-900:hidden">{t("checkout.secureMore")}</span>
        </span>
      </div>
      <Steps steps={steps} label={t("checkout.progress")} />
    </Wrap>
  );
}

/* ——— mobile summary toggle (v9 `.co-sumtoggle`) ——— */

export function SummaryToggle({ open, onToggle, total }: { open: boolean; onToggle: () => void; total: ReactNode }) {
  const t = useSapilCopy();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="checkout-summary"
      onClick={onToggle}
      className="hidden max-900:flex justify-between items-center h-[54px] px-[18px] bg-sapil-white rounded-[16px] font-[600] text-[15px] text-sapil-accent order-[-2]"
    >
      <span className="flex items-center gap-[6px] [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:[transition:transform_.2s]">
        {open ? t("checkout.hideSummary") : t("checkout.showSummary")}
        <span className={cx("inline-grid", open && "[&_svg]:rotate-180")}>
          <ChevronIcon />
        </span>
      </span>
      <b className="text-sapil-ink text-[17px] tabular-nums">{total}</b>
    </button>
  );
}

/* ——— contact + address fieldsets ——— */

export type AddressValue = {
  fullName: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  emirate: string;
};
export type AddressErrors = Partial<Record<"email" | "phone" | "fullName" | "emirate" | "city" | "address1", string>>;

export function ContactFieldset({
  email,
  onEmail,
  phone,
  onPhone,
  dialCode,
  errors,
  before,
}: {
  email: string;
  onEmail: (value: string) => void;
  phone: string;
  onPhone: (value: string) => void;
  dialCode: string;
  errors: AddressErrors;
  before?: ReactNode;
}) {
  const t = useSapilCopy();
  return (
    <Fieldset legend={t("checkout.contact")}>
      {before}
      <FieldGrid>
        <Field
          id="co-email"
          name="email"
          type="email"
          autoComplete="email"
          label={t("checkout.email")}
          placeholder={t("checkout.emailPlaceholder")}
          value={email}
          onChange={(event) => onEmail(event.target.value)}
          error={errors.email}
          required
        />
        <SapilPhoneField
          id="co-phone"
          name="phone"
          label={t("checkout.phone")}
          dialCode={dialCode}
          placeholder={t("checkout.phonePlaceholder")}
          value={phone}
          onChange={onPhone}
          error={errors.phone}
        />
      </FieldGrid>
    </Fieldset>
  );
}

export function AddressFieldset({
  legend,
  idPrefix,
  value,
  onChange,
  regionLabel,
  regionPlaceholder,
  regions,
  errors,
}: {
  legend: ReactNode;
  idPrefix: string;
  value: AddressValue;
  onChange: (field: keyof AddressValue, next: string) => void;
  regionLabel: string;
  regionPlaceholder: string;
  regions: readonly string[];
  errors: AddressErrors;
}) {
  const t = useSapilCopy();
  return (
    <Fieldset legend={legend}>
      <FieldGrid>
        <Field
          id={`${idPrefix}-name`}
          wide
          autoComplete="name"
          label={t("checkout.fullName")}
          placeholder={t("checkout.fullNamePlaceholder")}
          value={value.fullName}
          onChange={(event) => onChange("fullName", event.target.value)}
          error={errors.fullName}
          required
        />
        <SelectField
          id={`${idPrefix}-region`}
          label={regionLabel}
          autoComplete="address-level1"
          value={value.emirate}
          onChange={(event) => onChange("emirate", event.target.value)}
          error={errors.emirate}
          required
        >
          <option value="">{regionPlaceholder}</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </SelectField>
        <Field
          id={`${idPrefix}-area`}
          autoComplete="address-level2"
          label={t("checkout.area")}
          placeholder={t("checkout.areaPlaceholder")}
          value={value.city}
          onChange={(event) => onChange("city", event.target.value)}
          error={errors.city}
          required
        />
        <Field
          id={`${idPrefix}-street`}
          wide
          autoComplete="address-line1"
          label={t("checkout.street")}
          placeholder={t("checkout.streetPlaceholder")}
          value={value.address1}
          onChange={(event) => onChange("address1", event.target.value)}
          error={errors.address1}
          required
        />
        <Field
          id={`${idPrefix}-apt`}
          autoComplete="address-line2"
          label={t("checkout.apartment")}
          optional={t("checkout.optional")}
          placeholder={t("checkout.apartmentPlaceholder")}
          value={value.address2 ?? ""}
          onChange={(event) => onChange("address2", event.target.value)}
        />
      </FieldGrid>
    </Fieldset>
  );
}

export function DeliveryMethodFieldset({
  options,
  value,
  onChange,
  message,
}: {
  options: RadioCardOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** loading / none */
  message?: ReactNode;
}) {
  const t = useSapilCopy();
  return (
    <Fieldset legend={t("checkout.method")}>
      {options.length ? (
        <RadioCardGroup name="deliveryMethod" options={options} value={value ?? undefined} onValueChange={onChange} />
      ) : (
        <p className="clear-both text-[14px] text-sapil-ink-2" role="status">
          {message}
        </p>
      )}
    </Fieldset>
  );
}

/* ——— buttons ——— */

export const NextButton = forwardRef<
  HTMLButtonElement,
  { children: ReactNode; type?: "submit" | "button"; disabled?: boolean; onClick?: () => void; arrow?: boolean }
>(function NextButton({ children, type = "submit", disabled, onClick, arrow = true }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(buttonClass("dark"), "!h-[58px] !rounded-[18px] !text-[17px] [&_svg]:w-[20px] [&_svg]:h-[20px]")}
    >
      {children}
      {arrow ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="rtl:-scale-x-100">
          <path d="M5 12h14m-5-5 5 5-5 5" />
        </svg>
      ) : null}
    </button>
  );
});

/* ——— review (v9 `.review`) ——— */

export function ReviewBlock({ rows }: { rows: Array<{ label: string; value: ReactNode; onChange: () => void }> }) {
  const t = useSapilCopy();
  return (
    <dl className="bg-sapil-white rounded-[24px] py-[6px] px-[24px] max-900:py-[20px] max-900:px-[16px] max-900:rounded-[20px]">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[110px_1fr_auto] gap-[16px] items-baseline py-[16px] border-b border-sapil-line last:border-b-0 text-[15px] max-900:grid-cols-[1fr_auto] max-900:gap-y-[4px] max-900:gap-x-[12px]"
        >
          <dt className="text-sapil-muted text-[14px] max-900:col-span-full">{row.label}</dt>
          <dd className="min-w-0 break-words">{row.value}</dd>
          <button type="button" onClick={row.onChange} className={cx(buttonClass("link"), "!text-[14px]")}>
            {t("checkout.change")}
          </button>
        </div>
      ))}
    </dl>
  );
}

/* ——— order summary (v9 `.co-sum`) ——— */

export type SummaryLine = {
  key: string;
  name: string;
  href: string;
  imageSrc?: string;
  tile?: string;
  quantity: number;
  max?: number;
  meta?: ReactNode;
  price: ReactNode;
  was?: ReactNode;
};

export type SummaryTotalRow = { key: string; label: ReactNode; sub?: ReactNode; value: ReactNode; tone?: "save" };

export type PromoFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  disabled?: boolean;
  busy?: boolean;
  submitLabel: string;
  /** shown under the field: applied code, or an error */
  message?: { tone: "good" | "bad" | "info"; content: ReactNode } | null;
};

export function OrderSummary({
  open,
  lines,
  extra,
  promo,
  rows,
  grand,
  vatNote,
  notes,
  trust,
  onQuantity,
  LinkComponent = DefaultLink,
}: {
  open: boolean;
  lines: SummaryLine[];
  /** free gifts etc., after the lines */
  extra?: ReactNode;
  promo?: PromoFormProps;
  rows: SummaryTotalRow[];
  grand: { label: ReactNode; currency: string; amount: string };
  vatNote?: ReactNode;
  notes?: ReactNode;
  trust: string[];
  onQuantity?: (key: string, quantity: number) => void;
  LinkComponent?: SapilLinkComponent;
}) {
  const t = useSapilCopy();
  return (
    <aside
      id="checkout-summary"
      aria-label={t("checkout.summary")}
      className={cx(
        "sticky top-[100px] bg-sapil-white rounded-[28px] p-[28px] shadow-[0_1px_2px_rgba(60,45,30,.04),0_24px_48px_-32px_rgba(60,45,30,.3)]",
        "max-900:static max-900:order-[-1] max-900:p-[20px] max-900:rounded-[20px]",
        open ? "max-900:block" : "max-900:hidden",
      )}
    >
      <h2 className="font-sapil-sans font-[700] text-[20px] leading-[normal] tracking-[-.02em] mb-[12px] max-900:hidden">{t("checkout.summary")}</h2>
      <ul className="list-none max-h-[360px] overflow-y-auto mx-[-8px] px-[8px]">
        {lines.map((line) => (
          <li
            key={line.key}
            style={line.tile ? ({ "--sapil-tile": `var(--sapil-p-${line.tile})` } as CSSProperties) : undefined}
            className="grid grid-cols-[68px_1fr_auto] gap-[14px] items-center py-[12px] border-b border-sapil-line"
          >
            <span className="relative aspect-square rounded-[14px] bg-sapil-tile grid place-items-center">
              {line.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- cart images come from the API as-is
                <img src={line.imageSrc} alt="" className="h-[86%] object-contain" />
              ) : null}
              <b className="absolute top-[-7px] end-[-7px] min-w-[22px] h-[22px] rounded-[11px] bg-sapil-ink-2 text-sapil-white text-[12px] grid place-items-center px-[6px]">
                <span className="sr-only">{t("checkout.lineQty", { count: line.quantity })}</span>
                <span aria-hidden="true">{line.quantity}</span>
              </b>
            </span>
            <span className="min-w-0">
              <LinkComponent href={line.href} className="block font-[600] text-[15px] leading-[1.3]">
                {line.name}
              </LinkComponent>
              {line.meta ? <small className="block text-[13px] text-sapil-muted">{line.meta}</small> : null}
              {onQuantity ? (
                <QuantityStepper
                  variant="compact"
                  value={line.quantity}
                  max={line.max}
                  min={1}
                  itemLabel={line.name}
                  onChange={(next) => onQuantity(line.key, next)}
                  labels={{
                    group: t("bag.quantity", { name: line.name }),
                    decrease: t("checkout.oneLess", { name: line.name }),
                    increase: t("checkout.oneMore", { name: line.name }),
                  }}
                />
              ) : null}
            </span>
            <span className="text-[15px] tabular-nums font-[600] text-end">
              {line.price}
              {line.was ? (
                <s className="block text-[13px] font-[400] text-sapil-muted">
                  <span className="sr-only">{t("bag.was")} </span>
                  {line.was}
                </s>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {extra}
      {promo ? <PromoForm {...promo} /> : null}
      <dl className="mt-[14px] border-t border-sapil-line pt-[12px]">
        {rows.map((row) => (
          <div
            key={row.key}
            className={cx(
              "flex justify-between gap-[16px] py-[5px] text-[15px]",
              row.tone === "save" ? "text-sapil-ok" : "text-sapil-ink-2",
            )}
          >
            <dt>
              {row.label}
              {row.sub ? <small className="block text-[12px] text-sapil-muted">{row.sub}</small> : null}
            </dt>
            <dd className={cx("font-[500] tabular-nums whitespace-nowrap", row.tone === "save" ? "text-sapil-ok" : "text-sapil-ink")}>
              {row.value}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-[16px] border-t border-sapil-line mt-[8px] pt-[14px] pb-[5px] text-[18px] text-sapil-ink font-[600]">
          <dt>{grand.label}</dt>
          <dd className="text-[26px] font-[700] tracking-[-.02em] tabular-nums whitespace-nowrap">
            <small className="text-[13px] font-[500] text-sapil-muted me-[2px]">{grand.currency}</small> {grand.amount}
          </dd>
        </div>
      </dl>
      {vatNote ? <p className="text-[13px] text-sapil-muted text-end">{vatNote}</p> : null}
      {notes}
      {trust.length ? (
        <ul className="list-none flex flex-wrap gap-[8px] mt-[18px]">
          {trust.map((item) => (
            <li key={item} className="text-[12px] font-[600] bg-sapil-paper rounded-full py-[6px] px-[12px] text-sapil-ink-2">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function PromoForm({ value, onChange, onSubmit, disabled, busy, submitLabel, message }: PromoFormProps) {
  const t = useSapilCopy();
  return (
    <>
      <form className="flex gap-[8px] mt-[18px]" onSubmit={onSubmit} noValidate>
        <label className="sr-only" htmlFor="co-promo">
          {t("checkout.promoLabel")}
        </label>
        <input
          id="co-promo"
          name="coupon"
          autoComplete="off"
          spellCheck={false}
          placeholder={t("checkout.promoPlaceholder")}
          aria-describedby="co-promo-msg"
          aria-invalid={message?.tone === "bad" ? true : undefined}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-[46px] rounded-[14px] border border-sapil-line-2 bg-sapil-card px-[16px] font-sapil-sans text-[15px] text-sapil-ink w-full min-w-0 placeholder:text-[#757575] [transition:border-color_.18s,box-shadow_.18s] focus:outline-none focus:border-sapil-accent focus:shadow-[0_0_0_3px_var(--sapil-accent-soft)]"
        />
        <Button type="submit" variant="line" disabled={disabled || busy || !value.trim()} className="!h-[46px] !px-[18px] shrink-0">
          {submitLabel}
        </Button>
      </form>
      <p
        id="co-promo-msg"
        aria-live="polite"
        className={cx(
          "text-[13px] mt-[8px] mb-[6px] empty:hidden",
          message?.tone === "bad" ? "text-sapil-sale" : message?.tone === "good" ? "text-sapil-ok" : "text-sapil-ink-2",
        )}
      >
        {message?.content}
      </p>
    </>
  );
}

/* ——— empty / blocked bag (v9 `.co-empty`) ——— */

export function CheckoutEmptyCard({
  title,
  body,
  actions,
}: {
  title: ReactNode;
  body: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="bg-sapil-white rounded-[28px] py-[56px] px-[40px] text-center max-900:py-[40px] max-900:px-[20px]">
      <h1 className="text-[40px] mb-[10px]">{title}</h1>
      <p className="text-sapil-ink-2 mb-[24px]">{body}</p>
      <div className="flex gap-[10px] justify-center flex-wrap">{actions}</div>
    </div>
  );
}
