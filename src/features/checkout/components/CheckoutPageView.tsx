"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatMoney } from "@/features/home/data/homeContent";
import { toast } from "@/components/ui/Toaster";
import { useCartStore } from "@/stores/useCartStore";
import { UAE_EMIRATES, CHECKOUT_COUNTRIES } from "../data/checkoutContent";
import { CheckoutShell } from "./CheckoutShell";
import {
  checkoutSchema,
  type CheckoutFormValues,
} from "../schemas/checkout.schema";
import { useCheckout } from "../hooks/useCheckout";
import type { DeliveryMethodOption, PaymentMethodOption } from "../types/checkout";

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputClass =
  "h-11 w-full rounded-md border border-sa-input bg-white px-3.5 text-[14px] text-sa-primary outline-none placeholder:text-sa-muted focus:border-terra dark:bg-page dark:text-sa-primary";

const selectClass = `${inputClass} appearance-none pr-9 cursor-pointer`;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-red-600">{message}</p>;
}

function SelectChevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sa-muted"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
    >
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-sa-primary select-none">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`flex size-[18px] shrink-0 items-center justify-center rounded border transition-colors ${
          checked ? "border-terra bg-terra" : "border-sa-input bg-white dark:bg-page"
        }`}
      >
        {checked ? (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>
      {label}
    </label>
  );
}

function RadioOption({
  selected,
  onSelect,
  label,
  sublabel,
  trailing,
  icon,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  sublabel?: string;
  trailing?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-md border p-4 text-left transition-colors ${
        selected
          ? "border-terra bg-white dark:bg-page"
          : "border-sa-input bg-white hover:border-sa-muted dark:bg-page"
      }`}
    >
      <span
        className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-terra" : "border-sa-input"
        }`}
      >
        {selected ? <span className="size-2 rounded-full bg-terra" /> : null}
      </span>
      {icon ? <span className="text-sa-muted">{icon}</span> : null}
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-medium text-sa-primary">{label}</span>
        {sublabel ? (
          <span className="block text-[12px] text-sa-muted">{sublabel}</span>
        ) : null}
      </span>
      {trailing}
    </button>
  );
}

function DeliveryRow({
  method,
  selected,
  onSelect,
}: {
  method: DeliveryMethodOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const feeDisplay =
    !method.estimatedFee || method.estimatedFee === "0.00"
      ? "Free"
      : `AED ${Number(method.estimatedFee).toFixed(2)}`;

  return (
    <RadioOption
      selected={selected}
      onSelect={onSelect}
      label={method.displayName}
      sublabel="3–5 business days"
      trailing={
        <span className={`shrink-0 text-[14px] font-semibold ${feeDisplay === "Free" ? "text-terra" : "text-sa-primary"}`}>
          {feeDisplay}
        </span>
      }
      icon={
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <rect x="1" y="4" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M14 7h4l3 4v3h-7V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="5" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="17" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      }
    />
  );
}

function PaymentRow({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethodOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <RadioOption
      selected={selected}
      onSelect={onSelect}
      label={method.displayName}
      trailing={
        method.methodCode === "COD" ? (
          <span className="rounded border border-sa-border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sa-muted">
            COD
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sa-muted">
            <path d="M8 1L2 4v4c0 3.31 2.56 6.41 6 7.16C14.44 14.41 14 11.31 14 8V4L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        )
      }
    />
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-sa-border ${className ?? "h-11 w-full"}`} />
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

// ─── Trust badges ─────────────────────────────────────────────────────────────

function TrustBadge({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-sa-border bg-white px-4 py-3 dark:bg-page">
      <span className="shrink-0 text-terra">{icon}</span>
      <div>
        <p className="text-[13px] font-semibold text-sa-primary">{title}</p>
        <p className="text-[11px] text-sa-muted">{sub}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CheckoutPageView() {
  const lines = useCartStore((s) => s.lines);
  const cartTotals = useCartStore((s) => s.totals);
  const itemCount = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.quantity, 0));
  const currency = lines[0]?.currency ?? cartTotals?.currency ?? "AED";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const displayLines = mounted ? lines : [];
  const displayCount = mounted ? itemCount : 0;

  const {
    session,
    deliveryMethods,
    paymentMethods,
    selectedDeliveryId,
    selectedPaymentId,
    status,
    errorMsg,
    chooseDelivery,
    choosePayment,
    submitCheckout,
  } = useCheckout();

  const sessionTotals = session?.totalsEstimate;
  const displaySubtotal = sessionTotals
    ? Number(sessionTotals.subtotal)
    : mounted
      ? (cartTotals?.subtotal ?? lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
      : 0;
  const shippingFee = sessionTotals ? Number(sessionTotals.shipping) : 0;
  const displayTotal = sessionTotals
    ? Number(sessionTotals.total)
    : displaySubtotal + shippingFee;

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      emailOffers: true,
      country: "United Arab Emirates",
      firstName: "",
      lastName: "",
      address: "",
      apartment: "",
      city: "",
      emirate: "",
      phone: "",
      saveInfo: false,
      smsOffers: false,
      discountCode: "",
      billingSameAsShipping: true,
      billingCountry: "United Arab Emirates",
      billingFirstName: "",
      billingLastName: "",
      billingAddress: "",
      billingApartment: "",
      billingCity: "",
      billingEmirate: "",
      billingPhone: "",
    },
  });

  const billingSameAsShipping = watch("billingSameAsShipping");

  async function onSubmit(data: CheckoutFormValues) {
    if (lines.length === 0) {
      toast("Your cart is empty", "error");
      return;
    }
    if (!session) {
      toast("Checkout session not ready. Please wait.", "error");
      return;
    }
    await submitCheckout(data);
    if (errorMsg) toast(errorMsg, "error");
  }

  const isLoading = status === "loading";
  const isSubmittingCheckout = status === "submitting" || isSubmitting;
  const submitDisabled = isLoading || isSubmittingCheckout || displayLines.length === 0;

  return (
    <CheckoutShell step={1}>
      <div className="relative flex flex-1 flex-col">
        {/* Cream bleed — extends from summary column to the right screen edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden bg-[#faf6f1] lg:block dark:bg-section-soft"
          style={{ left: "min(55%, calc(50% + 4rem))" }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">

        {/* ── Left — form (starts under logo) ── */}
        <div className="flex flex-1 px-5 py-8 sm:px-8 lg:py-10 lg:pr-10">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-[500px]"
            noValidate
          >

            {/* Error banner */}
            {errorMsg ? (
              <div className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M7.5 4.5v3.5M7.5 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>
                  {errorMsg}
                  {status === "error" ? (
                    <Link href="/" className="ml-2 underline underline-offset-2">
                      Return to shop
                    </Link>
                  ) : null}
                </span>
              </div>
            ) : null}

            {/* Validation warnings */}
            {session?.validationIssues
              ?.filter((i) => i.severity === "WARNING")
              .map((issue) => (
                <div
                  key={issue.id ?? issue.code}
                  className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12px] text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                >
                  {issue.message}
                </div>
              ))}

            {/* ── Contact information ── */}
            <section className="mb-8">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-[18px] font-bold text-sa-primary">Contact information</h2>
                <span className="text-[12px] text-sa-muted">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-terra hover:underline">
                    Log in
                  </Link>
                </span>
              </div>
              <div>
                <FieldLabel>Email address</FieldLabel>
                <input
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  {...register("email")}
                />
                <FieldError message={errors.email?.message} />
              </div>
              <Controller
                name="emailOffers"
                control={control}
                render={({ field }) => (
                  <div className="mt-3">
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      label="Email me with news and offers"
                    />
                  </div>
                )}
              />
            </section>

            {/* ── Delivery address ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-[18px] font-bold text-sa-primary">Delivery address</h2>

              <div className="mb-4">
                <FieldLabel>Country / Region</FieldLabel>
                <div className="relative">
                  <select className={selectClass} {...register("country")}>
                    {CHECKOUT_COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>First name</FieldLabel>
                  <input
                    autoComplete="given-name"
                    className={inputClass}
                    {...register("firstName")}
                  />
                  <FieldError message={errors.firstName?.message} />
                </div>
                <div>
                  <FieldLabel>Last name</FieldLabel>
                  <input
                    autoComplete="family-name"
                    className={inputClass}
                    {...register("lastName")}
                  />
                  <FieldError message={errors.lastName?.message} />
                </div>
              </div>

              <div className="mb-4">
                <FieldLabel>Address</FieldLabel>
                <input
                  autoComplete="street-address"
                  className={inputClass}
                  {...register("address")}
                />
                <FieldError message={errors.address?.message} />
              </div>

              <div className="mb-4">
                <FieldLabel>Apartment, suite, etc. (optional)</FieldLabel>
                <input className={inputClass} {...register("apartment")} />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>City</FieldLabel>
                  <input
                    autoComplete="address-level2"
                    className={inputClass}
                    {...register("city")}
                  />
                  <FieldError message={errors.city?.message} />
                </div>
                <div>
                  <FieldLabel>Emirate</FieldLabel>
                  <div className="relative">
                    <select className={selectClass} {...register("emirate")}>
                      <option value="">Select emirate</option>
                      {UAE_EMIRATES.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                  <FieldError message={errors.emirate?.message} />
                </div>
              </div>

              <div className="mb-5">
                <FieldLabel>Phone number</FieldLabel>
                <div className="relative">
                  <input
                    type="tel"
                    autoComplete="tel"
                    className={`${inputClass} pr-10`}
                    {...register("phone")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-sa-muted">
                      <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M7.5 5.5v.5M7.5 7.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </div>
                <FieldError message={errors.phone?.message} />
              </div>

              <div className="flex flex-col gap-3">
                <Controller
                  name="saveInfo"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      label="Save this information for next time"
                    />
                  )}
                />
                <Controller
                  name="smsOffers"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      label="Text me with news and offers"
                    />
                  )}
                />
              </div>
            </section>

            {/* ── Billing address ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-[18px] font-bold text-sa-primary">Billing address</h2>
              <Controller
                name="billingSameAsShipping"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onChange={(same) => {
                      field.onChange(same);
                      if (!same) {
                        setValue("billingCountry", getValues("country"));
                        setValue("billingFirstName", getValues("firstName"));
                        setValue("billingLastName", getValues("lastName"));
                        setValue("billingAddress", getValues("address"));
                        setValue("billingApartment", getValues("apartment"));
                        setValue("billingCity", getValues("city"));
                        setValue("billingEmirate", getValues("emirate"));
                        setValue("billingPhone", getValues("phone"));
                      }
                    }}
                    label="Same as shipping address"
                  />
                )}
              />

              {!billingSameAsShipping ? (
                <div className="mt-5">
                  <div className="mb-4">
                    <FieldLabel>Country / Region</FieldLabel>
                    <div className="relative">
                      <select className={selectClass} {...register("billingCountry")}>
                        {CHECKOUT_COUNTRIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                    <FieldError message={errors.billingCountry?.message} />
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>First name</FieldLabel>
                      <input
                        autoComplete="billing given-name"
                        className={inputClass}
                        {...register("billingFirstName")}
                      />
                      <FieldError message={errors.billingFirstName?.message} />
                    </div>
                    <div>
                      <FieldLabel>Last name</FieldLabel>
                      <input
                        autoComplete="billing family-name"
                        className={inputClass}
                        {...register("billingLastName")}
                      />
                      <FieldError message={errors.billingLastName?.message} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <FieldLabel>Address</FieldLabel>
                    <input
                      autoComplete="billing street-address"
                      className={inputClass}
                      {...register("billingAddress")}
                    />
                    <FieldError message={errors.billingAddress?.message} />
                  </div>

                  <div className="mb-4">
                    <FieldLabel>Apartment, suite, etc. (optional)</FieldLabel>
                    <input className={inputClass} {...register("billingApartment")} />
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>City</FieldLabel>
                      <input
                        autoComplete="billing address-level2"
                        className={inputClass}
                        {...register("billingCity")}
                      />
                      <FieldError message={errors.billingCity?.message} />
                    </div>
                    <div>
                      <FieldLabel>Emirate</FieldLabel>
                      <div className="relative">
                        <select className={selectClass} {...register("billingEmirate")}>
                          <option value="">Select emirate</option>
                          {UAE_EMIRATES.map((e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ))}
                        </select>
                        <SelectChevron />
                      </div>
                      <FieldError message={errors.billingEmirate?.message} />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Phone number</FieldLabel>
                    <input
                      type="tel"
                      autoComplete="billing tel"
                      className={inputClass}
                      {...register("billingPhone")}
                    />
                    <FieldError message={errors.billingPhone?.message} />
                  </div>
                </div>
              ) : null}
            </section>

            {/* ── Shipping method ── */}
            <section className="mb-8">
              <h2 className="mb-4 text-[18px] font-bold text-sa-primary">Shipping method</h2>
              {isLoading ? (
                <SkeletonBlock className="h-[70px] w-full rounded-md" />
              ) : deliveryMethods.length === 0 ? (
                <div className="rounded-md border border-sa-border bg-section-soft px-4 py-4 text-[13px] text-sa-muted">
                  Add your address to see available shipping options.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {deliveryMethods.map((m) => (
                    <DeliveryRow
                      key={m.zoneDeliveryMethodId}
                      method={m}
                      selected={selectedDeliveryId === m.zoneDeliveryMethodId}
                      onSelect={() => chooseDelivery(m.zoneDeliveryMethodId)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ── Payment ── */}
            <section className="mb-8">
              <div className="mb-1 flex items-baseline justify-between">
                <h2 className="text-[18px] font-bold text-sa-primary">Payment</h2>
              </div>
              <p className="mb-4 text-[12px] text-sa-muted">
                All transactions are secure and encrypted.
              </p>
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  <SkeletonBlock className="h-[70px] w-full rounded-md" />
                  <SkeletonBlock className="h-[70px] w-full rounded-md" />
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="rounded-md border border-sa-border bg-section-soft px-4 py-4 text-[13px] text-sa-muted">
                  Payment options will appear after your session loads.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {paymentMethods.map((m) => (
                    <PaymentRow
                      key={m.zonePaymentMethodId}
                      method={m}
                      selected={selectedPaymentId === m.zonePaymentMethodId}
                      onSelect={() => choosePayment(m.zonePaymentMethodId)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={submitDisabled}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-md bg-terra text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#a25e48] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingCheckout ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing…
                </>
              ) : (
                <>
                  Continue to payment
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Right — order summary (sticky) ── */}
        <aside className="w-full border-t border-sa-border bg-[#faf6f1] lg:sticky lg:top-0 lg:h-screen lg:w-[45%] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:bg-transparent dark:bg-section-soft lg:dark:bg-transparent">
          <div className="w-full px-5 py-8 sm:px-8 lg:py-10">

            {/* Heading */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-sa-primary">
                Order summary{" "}
                <span className="font-normal text-sa-muted">({displayCount})</span>
              </h2>
              <Link
                href="/cart"
                className="text-[12px] font-medium text-terra hover:underline underline-offset-2"
              >
                Edit cart
              </Link>
            </div>

            {/* Line items */}
            {displayLines.length === 0 ? (
              <div className="mb-6 rounded-md border border-sa-border bg-white px-4 py-5 text-center dark:bg-page">
                <p className="text-[14px] font-medium text-sa-primary">Your cart is empty</p>
                <Link href="/products" className="mt-2 inline-block text-[13px] text-terra hover:underline">
                  Continue shopping
                </Link>
              </div>
            ) : (
              <ul className="mb-5 flex flex-col gap-4">
                {displayLines.map((line) => (
                  <li key={line.variantId} className="flex items-start gap-4">
                    <div className="relative shrink-0 rounded-md border border-sa-border bg-white p-1.5">
                      {line.imageUrl ? (
                        <Image
                          src={line.imageUrl}
                          alt=""
                          width={60}
                          height={60}
                          className="size-[60px] object-contain"
                        />
                      ) : (
                        <div className="flex size-[60px] items-center justify-center text-[10px] uppercase text-sa-muted">
                          SA
                        </div>
                      )}
                      <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-terra text-[10px] font-bold text-white">
                        {line.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="truncate text-[13px] font-semibold uppercase leading-snug text-sa-primary">
                        {line.title}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-sa-muted">
                        {[line.sizeLabel, ...(line.notes ?? []).slice(0, 2)]
                          .filter(Boolean)
                          .join(" · ") || "Default Title"}
                      </p>
                    </div>
                    <p className="shrink-0 pt-0.5 text-[14px] font-semibold text-sa-primary">
                      {formatMoney(line.unitPrice * line.quantity, currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* Divider */}
            <div className="mb-5 h-px w-full bg-sa-border" />

            {/* Discount code */}
            <div className="mb-5 flex gap-2">
              <input
                placeholder="Discount code"
                className="h-11 flex-1 rounded-md border border-sa-input bg-white px-3.5 text-[13px] text-sa-primary outline-none placeholder:text-sa-muted focus:border-terra dark:bg-page"
                {...register("discountCode")}
              />
              <button
                type="button"
                onClick={() => toast("Discount codes are applied automatically at checkout", "info")}
                className="h-11 shrink-0 rounded-md bg-terra px-5 text-[13px] font-semibold text-white hover:bg-[#a25e48] transition-colors"
              >
                Apply
              </button>
            </div>

            {/* Divider */}
            <div className="mb-5 h-px w-full bg-sa-border" />

            {/* Totals */}
            <div className="flex flex-col gap-3 text-[14px]">
              <div className="flex justify-between">
                <span className="text-sa-muted">
                  Subtotal ({displayCount} {displayCount === 1 ? "item" : "items"})
                </span>
                <span className="font-semibold text-sa-primary">
                  {formatMoney(displaySubtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sa-muted">Shipping</span>
                {shippingFee > 0 ? (
                  <span className="font-semibold text-sa-primary">
                    {formatMoney(shippingFee, currency)}
                  </span>
                ) : (
                  <span className="font-semibold text-terra">
                    {isLoading ? "Calculating…" : "Free"}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 h-px w-full bg-sa-border" />

            {/* Total */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[20px] font-bold text-sa-primary">Total</span>
                <p className="text-[11px] text-sa-muted">Including VAT</p>
              </div>
              <p className="flex items-baseline gap-1.5">
                <span className="text-[13px] font-medium text-sa-muted">{currency}</span>
                <span className="text-[28px] font-bold leading-none text-terra">
                  {displayTotal.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex flex-col gap-2.5">
              <TrustBadge
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="1" y="6" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M13 9h4l3 4v4H13V9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <circle cx="5" cy="17" r="2" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="16" cy="17" r="2" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                }
                title="Free delivery"
                sub="On all orders over AED 200"
              />
              <TrustBadge
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L3 5v5c0 4.42 3.04 8.56 7 9.55C13.96 18.56 17 14.42 17 10V5L10 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
                title="Secure payments"
                sub="100% secure checkout"
              />
              <TrustBadge
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L3 5v5c0 4.42 3.04 8.56 7 9.55C13.96 18.56 17 14.42 17 10V5L10 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    <path d="M7.5 10.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
                title="Authentic products"
                sub="100% original fragrances"
              />
            </div>
          </div>
        </aside>
        </div>
      </div>
    </CheckoutShell>
  );
}
