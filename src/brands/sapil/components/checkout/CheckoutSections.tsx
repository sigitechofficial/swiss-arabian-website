"use client";

import { useId, type ReactNode } from "react";
import { regionLabel as regionName } from "@/features/account/utils/addressDisplay";
import type { DeliveryMethodOption } from "@/features/checkout/types/checkout";
import type { PaymentStepKind } from "@/features/checkout/utils/methodLabels";
import { usesHostedRedirect } from "@/features/checkout/utils/methodLabels";
import type { PayGroup, PayRow } from "@/features/checkout/utils/paymentOptions";
import { isTabbyPaymentMethod } from "@/features/checkout/utils/tabby";
import { isTamaraPaymentMethod } from "@/features/checkout/utils/tamara";
import { PlacesAddressInput } from "@/lib/google/PlacesAddressInput";
import type { ParsedStreetAddress } from "@/lib/google/parseGooglePlace";
import { useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import {
  Breadcrumbs,
  CardLogo,
  Checkbox,
  Field,
  FieldFrame,
  FieldGrid,
  RadioCardGroup,
  SelectField,
  Wrap,
  fieldControlClass,
  type RadioCardOption,
} from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { SapilPhoneField } from "../commerce/SapilPhoneField";
import { SapilLink, type SapilMoney } from "../commerce/shared";
import type { AddressErrors } from "./CheckoutParts";

/*
 * Sapil's checkout in Swiss Arabian's layout: one page with Delivery,
 * Shipping method, Billing information and Payment, the order summary beside
 * it. Sapil's fonts, colours and controls; all logic stays in the shared hooks.
 */

/* ——— page head: crumbs, title, "Bag · Details & payment" ——— */

export function CheckoutTop() {
  const t = useSapilCopy();
  return (
    <Wrap as="section" className="pb-[8px]" aria-labelledby="checkout-heading">
      <Breadcrumbs
        label={t("checkout.breadcrumb")}
        items={[
          { label: t("checkout.crumbHome"), href: "/" },
          { label: t("checkout.crumbBag"), href: "/cart" },
          { label: t("checkout.title") },
        ]}
        LinkComponent={SapilLink}
      />
      <header className="mt-[16px] mb-[24px] max-900:mb-[16px]">
        <h1
          id="checkout-heading"
          className="font-sapil-display font-[400] text-[clamp(36px,4vw,52px)] leading-[1] tracking-[-.01em] max-900:text-[34px]"
        >
          {t("checkout.title")}
        </h1>
        <ol className="list-none flex flex-wrap items-center gap-[10px] mt-[14px] text-[13px] font-[600] tracking-[.04em] uppercase text-sapil-ink-2">
          <li>
            <SapilLink href="/cart" className="hover:text-sapil-accent">
              {t("checkout.crumbBag")}
            </SapilLink>
          </li>
          <li aria-hidden="true">·</li>
          <li aria-current="step" className="text-sapil-accent">
            {t("checkout.stepDetails")}
          </li>
        </ol>
      </header>
    </Wrap>
  );
}

/* ——— a white form card with a heading (Swiss `.cbox`) ——— */

export function CheckoutBox({
  title,
  note,
  children,
  id,
}: {
  title: ReactNode;
  note?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="bg-sapil-white rounded-[24px] pt-[24px] px-[24px] pb-[26px] max-900:py-[20px] max-900:px-[16px] max-900:rounded-[20px]"
    >
      <header className="mb-[18px] pb-[14px] border-b border-sapil-line">
        <h2 id={headingId} className="font-sapil-sans font-[700] text-[20px] leading-[1.2] tracking-[-.02em]">
          {title}
        </h2>
        {note ? <p className="mt-[4px] text-[14px] text-sapil-ink-2">{note}</p> : null}
      </header>
      {children}
    </section>
  );
}

/* ——— address line 1 with Google Places suggestions, in the Sapil field look ——— */

function AddressLineField({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  onPlace,
  countryCode,
  error,
  autoComplete,
}: {
  id: string;
  name: string;
  label: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onPlace: (parsed: ParsedStreetAddress) => void;
  countryCode: string;
  error?: string;
  autoComplete: string;
}) {
  const errorId = `${id}-err`;
  return (
    <FieldFrame id={id} errorId={errorId} label={label} error={error} wide>
      <PlacesAddressInput
        id={id}
        name={name}
        required
        minLength={3}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        countryCode={countryCode}
        onChange={onChange}
        onResolved={onPlace}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={fieldControlClass(Boolean(error))}
      />
    </FieldFrame>
  );
}

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  emirate: string;
  postalCode?: string;
};
type AddressField = keyof CheckoutAddress;

type RegionProps = {
  regionLabel: string;
  regionPlaceholder: string;
  regions: readonly string[];
  countryCode: string;
};

function RegionSelect({
  id,
  name,
  value,
  onChange,
  error,
  autoComplete,
  regionLabel,
  regionPlaceholder,
  regions,
  countryCode,
}: RegionProps & {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
}) {
  const shopT = useShopTranslator();
  return (
    <SelectField
      id={id}
      name={name}
      label={regionLabel}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      required
    >
      <option value="">{regionPlaceholder}</option>
      {regions.map((region) => (
        <option key={region} value={region}>
          {regionName(countryCode, region, shopT)}
        </option>
      ))}
    </SelectField>
  );
}

/* ——— Delivery: email, name, phone, address (Swiss order) ——— */

export function DeliverySection({
  email,
  onEmail,
  address,
  onField,
  onPlace,
  errors,
  before,
  ...region
}: RegionProps & {
  email: string;
  onEmail: (value: string) => void;
  address: CheckoutAddress;
  onField: (field: AddressField, value: string) => void;
  onPlace: (parsed: ParsedStreetAddress) => void;
  errors: AddressErrors;
  /** test-site "fill test data" bar */
  before?: ReactNode;
}) {
  const t = useSapilCopy();
  return (
    <CheckoutBox title={t("checkout.sectionDelivery")}>
      {before}
      <FieldGrid>
        <Field
          id="co-email"
          name="email"
          type="email"
          wide
          autoComplete="email"
          label={t("checkout.email")}
          placeholder={t("checkout.emailPlaceholder")}
          value={email}
          onChange={(event) => onEmail(event.target.value)}
          error={errors.email}
          required
        />
        <Field
          id="ship-name"
          name="delName"
          wide
          autoComplete="name"
          label={t("checkout.fullName")}
          placeholder={t("checkout.fullNamePlaceholder")}
          value={address.fullName}
          onChange={(event) => onField("fullName", event.target.value)}
          error={errors.fullName}
          required
        />
        <SapilPhoneField
          id="co-phone"
          name="delPhone"
          wide
          label={t("checkout.phone")}
          value={address.phone}
          onChange={(value) => onField("phone", value)}
          error={errors.phone}
        />
        <AddressLineField
          id="ship-street"
          name="delAddr1"
          label={t("checkout.street")}
          placeholder={t("checkout.streetSearchPlaceholder")}
          value={address.address1}
          onChange={(value) => onField("address1", value)}
          onPlace={onPlace}
          countryCode={region.countryCode}
          error={errors.address1}
          autoComplete="address-line1"
        />
        <Field
          id="ship-apt"
          name="delAddr2"
          wide
          autoComplete="address-line2"
          label={t("checkout.apartment")}
          optional={t("checkout.optional")}
          placeholder={t("checkout.apartmentPlaceholder")}
          value={address.address2 ?? ""}
          onChange={(event) => onField("address2", event.target.value)}
        />
        <Field
          id="ship-area"
          name="delCity"
          autoComplete="address-level2"
          label={t("checkout.city")}
          placeholder={t("checkout.cityPlaceholder")}
          value={address.city}
          onChange={(event) => onField("city", event.target.value)}
          error={errors.city}
          required
        />
        <RegionSelect
          id="ship-region"
          name="delEmirate"
          autoComplete="address-level1"
          value={address.emirate}
          onChange={(value) => onField("emirate", value)}
          error={errors.emirate}
          {...region}
        />
        <Field
          id="ship-postal"
          name="delPostal"
          wide
          inputMode="numeric"
          autoComplete="postal-code"
          label={t("checkout.postalCode")}
          optional={t("checkout.optional")}
          value={address.postalCode ?? ""}
          onChange={(event) => onField("postalCode", event.target.value)}
        />
      </FieldGrid>
    </CheckoutBox>
  );
}

/* ——— Shipping method ——— */

export function etaText(method: DeliveryMethodOption, t: SapilTranslator): string | undefined {
  const min = method.metadata?.estimatedMinDays;
  const max = method.metadata?.estimatedMaxDays;
  if (typeof min === "number" && typeof max === "number" && min !== max) return t("checkout.etaRange", { min, max });
  const days = typeof max === "number" ? max : min;
  return typeof days === "number" ? t("checkout.etaDays", { count: days }) : undefined;
}

/** A missing fee means "not priced yet" (backend guide: free / TBD), so no price is shown; only an explicit 0 is "Free". */
export function feeText(method: DeliveryMethodOption, currency: string, money: SapilMoney, t: SapilTranslator): string | undefined {
  if (method.estimatedFee == null || method.estimatedFee.trim() === "") return undefined;
  const fee = Number(method.estimatedFee);
  if (!Number.isFinite(fee)) return undefined;
  return fee > 0 ? money(fee, currency) : t("checkout.methodFree");
}

export function ShippingMethodSection({
  options,
  value,
  onChange,
  message,
}: {
  options: RadioCardOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** loading / none */
  message: ReactNode;
}) {
  const t = useSapilCopy();
  return (
    <CheckoutBox title={t("checkout.sectionShipping")}>
      {options.length ? (
        <RadioCardGroup
          name="deliveryMethod"
          aria-label={t("checkout.sectionShipping")}
          options={options}
          value={value ?? undefined}
          onValueChange={onChange}
        />
      ) : (
        <p className="text-[14px] text-sapil-ink-2" role="status">
          {message}
        </p>
      )}
    </CheckoutBox>
  );
}

/* ——— Billing information ——— */

export function BillingSection({
  same,
  onSame,
  address,
  onField,
  onPlace,
  errors,
  ...region
}: RegionProps & {
  same: boolean;
  onSame: (same: boolean) => void;
  address: CheckoutAddress;
  onField: (field: AddressField, value: string) => void;
  onPlace: (parsed: ParsedStreetAddress) => void;
  errors: AddressErrors;
}) {
  const t = useSapilCopy();
  return (
    <CheckoutBox title={t("checkout.sectionBilling")}>
      <Checkbox id="billing-same" name="billingSame" checked={same} onChange={(event) => onSame(event.target.checked)} className="!mt-0">
        {t("checkout.billingSameShort")}
      </Checkbox>
      {!same ? (
        <FieldGrid id="billing-fields" className="mt-[18px]">
          <Field
            id="bill-name"
            name="billName"
            wide
            autoComplete="billing name"
            label={t("checkout.billingName")}
            placeholder={t("checkout.fullNamePlaceholder")}
            value={address.fullName}
            onChange={(event) => onField("fullName", event.target.value)}
            error={errors.fullName}
            required
          />
          <AddressLineField
            id="bill-street"
            name="billAddr1"
            label={t("checkout.street")}
            placeholder={t("checkout.streetSearchPlaceholder")}
            value={address.address1}
            onChange={(value) => onField("address1", value)}
            onPlace={onPlace}
            countryCode={region.countryCode}
            error={errors.address1}
            autoComplete="billing address-line1"
          />
          <Field
            id="bill-apt"
            name="billAddr2"
            wide
            autoComplete="billing address-line2"
            label={t("checkout.apartment")}
            optional={t("checkout.optional")}
            placeholder={t("checkout.apartmentPlaceholder")}
            value={address.address2 ?? ""}
            onChange={(event) => onField("address2", event.target.value)}
          />
          <Field
            id="bill-area"
            name="billCity"
            autoComplete="billing address-level2"
            label={t("checkout.city")}
            placeholder={t("checkout.cityPlaceholder")}
            value={address.city}
            onChange={(event) => onField("city", event.target.value)}
            error={errors.city}
            required
          />
          <RegionSelect
            id="bill-region"
            name="billEmirate"
            autoComplete="billing address-level1"
            value={address.emirate}
            onChange={(value) => onField("emirate", value)}
            error={errors.emirate}
            {...region}
          />
        </FieldGrid>
      ) : null}
    </CheckoutBox>
  );
}

/* ——— Payment ——— */

const CARD_PROVIDER_NAMES: Record<NonNullable<PayRow["provider"]>, string> = { stripe: "Stripe", paymob: "Paymob" };

/** `nameProvider`: more than one card option is on offer, so each one says whose it is. */
export function payTitle(row: PayRow, t: SapilTranslator, nameProvider = false): string {
  if (row.kind === "card") {
    return nameProvider && row.provider
      ? t("checkout.payCardVia", { provider: CARD_PROVIDER_NAMES[row.provider] })
      : t("checkout.payCard");
  }
  if (row.kind === "apple_pay") return t("checkout.payApple");
  if (row.kind === "google_pay") return t("checkout.payGoogle");
  // Tabby: the approved name, already in the shopper's language (paymentGroups).
  if (row.method && isTabbyPaymentMethod(row.method)) return row.title;
  return row.method?.displayName ?? row.title;
}

export function isCashMethod(method: PayRow["method"]): boolean {
  return Boolean(method && /\bcod\b|cash/i.test(`${method.providerCode} ${method.methodCode} ${method.displayName}`));
}

export function payNote(row: PayRow, t: SapilTranslator): string | undefined {
  if (row.kind === "card") return row.marks?.includes("amex") ? t("checkout.payCardBrands") : t("checkout.payCardBrandsShort");
  if (row.kind === "apple_pay") return t("checkout.payAppleNote");
  if (row.kind === "google_pay") return t("checkout.payGoogleNote");
  const method = row.method;
  if (!method) return row.sub;
  if (isTabbyPaymentMethod(method)) {
    if (row.tabbyState === "checking") return t("checkout.payTabbyChecking");
    if (row.tabbyState === "rejected") return row.tabbyMessage;
    // Tabby QA: no plan caption; the Tabby snippet below shows the plans.
    return undefined;
  }
  if (isTamaraPaymentMethod(method)) {
    if (row.tamaraState === "checking") return t("checkout.payTabbyChecking");
    if (row.tamaraState === "rejected") return row.tamaraMessage;
    return t("checkout.payTamaraNote");
  }
  if (isCashMethod(method)) return t("checkout.payCashNote");
  if (usesHostedRedirect(method)) return t("checkout.payRedirectNote");
  return undefined;
}

function groupTitle(group: PayGroup, t: SapilTranslator): string | null {
  if (group.id === "stripe") return "Stripe";
  if (group.id === "paymob") return "Paymob";
  if (group.id === "other") return t("checkout.payGroupOther");
  return null;
}

const PAY_KIND_KEY = {
  card: "checkout.payKindCard",
  tabby: "checkout.payKindTabby",
  tamara: "checkout.payKindTamara",
  cash: "checkout.payKindCash",
} as const;

/** "Card, Tabby or cash" from what the market offers; null until it is known. */
export function paymentKindsText(kinds: readonly PaymentStepKind[], lang: "en" | "ar", t: SapilTranslator): string | null {
  if (!kinds.length) return null;
  const list = new Intl.ListFormat(lang, { type: "disjunction" }).format(kinds.map((kind) => t(PAY_KIND_KEY[kind])));
  return list.charAt(0).toLocaleUpperCase(lang) + list.slice(1);
}

export function PaymentSection({
  groups,
  activeKey,
  onPick,
  panelFor,
  disabled,
  covered,
  emptyMessage,
  kindsText,
  payNow,
}: {
  /** offered groups only (no "coming soon" rows) */
  groups: PayGroup[];
  activeKey: string | null;
  onPick: (row: PayRow) => void;
  /** card form / Tabby snippet / Tamara widget under the active row */
  panelFor: (row: PayRow) => ReactNode;
  disabled: boolean;
  covered: boolean;
  /** loading / none, when no method is on offer */
  emptyMessage: ReactNode;
  /** "Card, Tabby or cash" from the market's live methods */
  kindsText: string | null;
  /** Paymob's in-page form: the button that opens it */
  payNow?: ReactNode;
}) {
  const t = useSapilCopy();
  const rows = groups.flatMap((group) => group.rows);
  const severalCards = rows.filter((row) => row.kind === "card").length > 1;
  const showGroupTitles = groups.length > 1;
  return (
    <CheckoutBox
      id="checkout-payment"
      title={t("checkout.payment")}
      note={kindsText ? `${kindsText} · ${t("checkout.paymentSecure")}` : t("checkout.paymentSecure")}
    >
      {covered ? (
        <p className="text-[15px] text-sapil-ok">{t("checkout.paymentCovered")}</p>
      ) : rows.length ? (
        <div className="flex flex-col gap-[20px]">
          {groups.map((group) => {
            const title = showGroupTitles ? groupTitle(group, t) : null;
            const options: RadioCardOption[] = group.rows.map((row) => {
              const isTabby = Boolean(row.method && isTabbyPaymentMethod(row.method));
              return {
                value: row.key,
                title: payTitle(row, t, severalCards),
                description: payNote(row, t),
                logos:
                  row.kind === "card" ? (
                    <>
                      <CardLogo kind="visa" />
                      <CardLogo kind="mastercard" />
                    </>
                  ) : isTabby ? (
                    <CardLogo kind="tabby" />
                  ) : undefined,
                panel: row.key === activeKey ? panelFor(row) : undefined,
                disabled: disabled || row.disabled,
              };
            });
            return (
              <div key={group.id}>
                {title ? (
                  <h3 className="font-sapil-sans text-[15px] font-[600] leading-[1.3] tracking-normal mb-[10px]">{title}</h3>
                ) : null}
                <RadioCardGroup
                  name="payMethod"
                  aria-label={title ?? t("checkout.payment")}
                  options={options}
                  value={activeKey ?? ""}
                  onValueChange={(key) => {
                    const row = group.rows.find((r) => r.key === key);
                    if (row) onPick(row);
                  }}
                />
              </div>
            );
          })}
          {payNow}
        </div>
      ) : (
        <p className="text-[14px] text-sapil-ink-2" role="status">
          {emptyMessage}
        </p>
      )}
    </CheckoutBox>
  );
}

/* ——— place order ——— */

export function CheckoutCta({
  children,
  type = "submit",
  disabled,
  onClick,
  hidden,
  id,
}: {
  children: ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
  onClick?: () => void;
  hidden?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      hidden={hidden}
      className={cx(buttonClass("dark"), "w-full !h-[58px] !rounded-[18px] !text-[17px]")}
    >
      {children}
    </button>
  );
}
