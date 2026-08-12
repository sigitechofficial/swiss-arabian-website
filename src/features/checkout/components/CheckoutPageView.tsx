"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatMoney } from "@/features/home/data/homeContent";
import { toast } from "@/components/ui/Toaster";
import { useCartStore } from "@/stores/useCartStore";
import {
  UAE_EMIRATES,
  checkoutAssets,
} from "../data/checkoutContent";
import {
  checkoutSchema,
  type CheckoutFormValues,
} from "../schemas/checkout.schema";
import { useCheckout } from "../hooks/useCheckout";
import type { DeliveryMethodOption, PaymentMethodOption } from "../types/checkout";

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const inputClass =
  "h-[45px] w-full border border-sa-input bg-page px-4 text-[14px] text-sa-primary outline-none placeholder:text-sa-muted focus:border-terra";

const selectClass = `${inputClass} appearance-none pr-10`;

function FieldIcon({
  src,
  alt = "",
  className = "size-4",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={16}
      height={16}
      className={className}
      unoptimized
    />
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
    <label className="flex cursor-pointer items-center gap-2.5 text-[12px] text-sa-muted">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`flex size-[18px] shrink-0 items-center justify-center border ${
          checked ? "border-terra bg-terra" : "border-sa-input bg-page"
        }`}
      >
        {checked ? (
          <FieldIcon
            src={checkoutAssets.check}
            className="size-2.5 brightness-0 invert"
          />
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
  trailing,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      className={`border-b border-sa-border last:border-b-0 ${
        selected ? "bg-section-soft" : "bg-page"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <span
          className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-terra" : "border-sa-input"
          }`}
          aria-hidden
        >
          {selected ? <span className="size-2.5 rounded-full bg-terra" /> : null}
        </span>
        <span className="flex-1 text-[14px] font-medium text-sa-primary">{label}</span>
        {trailing}
      </button>
    </div>
  );
}

// ─── Delivery option row ──────────────────────────────────────────────────────

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
      trailing={
        <span className="text-[13px] font-semibold text-sa-primary">{feeDisplay}</span>
      }
    />
  );
}

// ─── Payment option row ───────────────────────────────────────────────────────

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
          <span className="rounded-[2px] border border-sa-border bg-page px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sa-muted">
            COD
          </span>
        ) : (
          <span className="flex size-4 items-center justify-center">
            <FieldIcon src={checkoutAssets.lock} />
          </span>
        )
      }
    />
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-sa-border ${className ?? "h-[45px] w-full"}`}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Checkout — Figma 475:7363 / section 518:7105
 * Two-column: form (left) + order summary (right).
 * API wired: checkout session, delivery methods, payment methods, order placement.
 */
export function CheckoutPageView() {
  const lines = useCartStore((s) => s.lines);
  const cartTotals = useCartStore((s) => s.totals);
  const itemCount = useCartStore((s) =>
    s.lines.reduce((sum, l) => sum + l.quantity, 0),
  );
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

  // Display totals — prefer session totals (include shipping) over local cart totals
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
    },
  });

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
    <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col lg:flex-row">
      {/* ── Left — form ── */}
      <div className="flex flex-1 justify-center bg-page px-4 py-10 sm:px-8 lg:px-10 lg:py-14">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-[420px] lg:max-w-[289px] xl:max-w-[420px]"
          noValidate
        >
          {/* Brand link */}
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-3"
            aria-label="Swiss Arabian home"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-terra text-[12px] font-bold text-white">
              SA
            </span>
            <span className="text-[16px] font-semibold uppercase tracking-[0.12em] text-sa-primary">
              Swiss Arabian
            </span>
          </Link>

          {/* Error banner — session init error OR validation/submit error */}
          {errorMsg ? (
            <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {errorMsg}
              {status === "error" ? (
                <Link href="/" className="ml-2 underline">
                  Return to shop
                </Link>
              ) : null}
            </div>
          ) : null}

          {/* Validation warnings from session */}
          {session?.validationIssues?.filter((i) => i.severity === "WARNING").map((issue) => (
            <div
              key={issue.id ?? issue.code}
              className="mb-4 border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12px] text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
            >
              {issue.message}
            </div>
          ))}

          {/* ── Contact ── */}
          <section className="mb-10">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-[20px] font-bold text-sa-primary">Contact</h2>
              <Link
                href="/login"
                className="text-[12px] text-sa-muted underline underline-offset-2 hover:text-sa-primary"
              >
                Log in
              </Link>
            </div>
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              className={inputClass}
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-[12px] text-red-600">{errors.email.message}</p>
            ) : null}
            <Controller
              name="emailOffers"
              control={control}
              render={({ field }) => (
                <div className="mt-4">
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
          <section className="mb-10">
            <h2 className="mb-4 text-[20px] font-bold text-sa-primary">Delivery</h2>

            <label className="mb-1 block text-[14px] text-sa-muted">Country/Region</label>
            <div className="relative mb-4">
              <select className={selectClass} {...register("country")}>
                <option>United Arab Emirates</option>
                <option>Saudi Arabia</option>
                <option>Qatar</option>
                <option>Kuwait</option>
                <option>Bahrain</option>
                <option>Oman</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <FieldIcon src={checkoutAssets.chevron} />
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <input
                  placeholder="First name"
                  autoComplete="given-name"
                  className={inputClass}
                  {...register("firstName")}
                />
                {errors.firstName ? (
                  <p className="mt-1 text-[11px] text-red-600">{errors.firstName.message}</p>
                ) : null}
              </div>
              <div>
                <input
                  placeholder="Last name"
                  autoComplete="family-name"
                  className={inputClass}
                  {...register("lastName")}
                />
                {errors.lastName ? (
                  <p className="mt-1 text-[11px] text-red-600">{errors.lastName.message}</p>
                ) : null}
              </div>
            </div>

            <input
              placeholder="Address"
              autoComplete="street-address"
              className={`${inputClass} mb-4`}
              {...register("address")}
            />
            {errors.address ? (
              <p className="-mt-3 mb-3 text-[11px] text-red-600">{errors.address.message}</p>
            ) : null}

            <input
              placeholder="Apartment, suite, etc. (optional)"
              className={`${inputClass} mb-4`}
              {...register("apartment")}
            />

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <input
                  placeholder="City"
                  autoComplete="address-level2"
                  className={inputClass}
                  {...register("city")}
                />
                {errors.city ? (
                  <p className="mt-1 text-[11px] text-red-600">{errors.city.message}</p>
                ) : null}
              </div>
              <div className="relative">
                <select className={selectClass} {...register("emirate")}>
                  <option value="">Emirate</option>
                  {UAE_EMIRATES.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <FieldIcon src={checkoutAssets.chevron} />
                </span>
                {errors.emirate ? (
                  <p className="mt-1 text-[11px] text-red-600">{errors.emirate.message}</p>
                ) : null}
              </div>
            </div>

            <div className="relative mb-4">
              <input
                type="tel"
                placeholder="Phone"
                autoComplete="tel"
                className={`${inputClass} pr-10`}
                {...register("phone")}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <FieldIcon src={checkoutAssets.info} />
              </span>
              {errors.phone ? (
                <p className="mt-1 text-[11px] text-red-600">{errors.phone.message}</p>
              ) : null}
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

          {/* ── Shipping method ── */}
          <section className="mb-10">
            <h2 className="mb-4 text-[20px] font-bold text-sa-primary">Shipping method</h2>

            {isLoading ? (
              <SkeletonBlock className="h-[54px] w-full" />
            ) : deliveryMethods.length === 0 ? (
              <div className="border border-sa-border bg-section-soft px-4 py-4 text-[12px] text-sa-muted">
                Add address to see shipping options
              </div>
            ) : (
              <div className="overflow-hidden border border-sa-border">
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
            <h2 className="text-[20px] font-bold text-sa-primary">Payment</h2>
            <p className="mb-4 mt-1 text-[12px] text-sa-muted">
              All transactions are secure and encrypted.
            </p>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                <SkeletonBlock className="h-[54px] w-full" />
                <SkeletonBlock className="h-[54px] w-full" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="border border-sa-border bg-section-soft px-4 py-4 text-[12px] text-sa-muted">
                Payment options will appear after session loads
              </div>
            ) : (
              <div className="overflow-hidden border border-sa-border">
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
            className="flex h-10 w-full items-center justify-center gap-2 bg-terra text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#a25e48] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmittingCheckout ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing…
              </>
            ) : (
              "Pay now"
            )}
          </button>
        </form>
      </div>

      {/* ── Right — order summary ── */}
      <aside className="w-full border-t border-sa-border bg-ash lg:w-[50%] lg:max-w-[721px] lg:border-l lg:border-t-0 dark:bg-section-soft">
        <div className="mx-auto w-full max-w-[411px] px-6 py-10 lg:px-[60px] lg:py-14">
          {displayLines.length === 0 ? (
            <div className="mb-8 text-center">
              <p className="text-[15px] font-semibold text-sa-primary">Your cart is empty</p>
              <Link
                href="/products"
                className="mt-3 inline-block text-[13px] text-terra underline"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="mb-8 flex flex-col gap-5">
              {displayLines.map((line) => (
                <li key={line.variantId} className="flex items-center gap-4">
                  <div className="relative size-16 shrink-0 border border-sa-border bg-page">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt=""
                        width={64}
                        height={64}
                        className="size-16 object-contain p-1"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center text-[9px] uppercase text-sa-muted">
                        SA
                      </div>
                    )}
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-terra text-[11px] font-semibold text-white">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold uppercase text-sa-primary">
                      {line.title}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-sa-muted">
                      {[line.sizeLabel, ...(line.notes ?? []).slice(0, 2)]
                        .filter(Boolean)
                        .join(" · ") || "Fragrance"}
                    </p>
                  </div>
                  <p className="shrink-0 text-[14px] font-semibold text-sa-primary">
                    {formatMoney(line.unitPrice * line.quantity, currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="h-px w-full bg-sa-border" />

          {/* Discount code */}
          <div className="my-6 flex gap-3">
            <input
              placeholder="Discount code"
              className={`${inputClass} flex-1`}
              {...register("discountCode")}
            />
            <button
              type="button"
              onClick={() => toast("Discount codes are applied automatically at checkout", "info")}
              className="h-[45px] shrink-0 bg-terra px-6 text-[14px] font-semibold text-white hover:bg-[#a25e48]"
            >
              Apply
            </button>
          </div>

          <div className="h-px w-full bg-sa-border" />

          <div className="mt-6 flex flex-col gap-3 text-[14px]">
            <div className="flex justify-between">
              <span className="text-sa-muted">
                Subtotal · {displayCount} item{displayCount === 1 ? "" : "s"}
              </span>
              <span className="font-semibold text-sa-primary">
                {formatMoney(displaySubtotal, currency)}
              </span>
            </div>

            {shippingFee > 0 ? (
              <div className="flex justify-between">
                <span className="text-sa-muted">Shipping</span>
                <span className="font-semibold text-sa-primary">
                  {formatMoney(shippingFee, currency)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-sa-muted">Shipping</span>
                <span className="text-[12px] text-sa-muted">
                  {isLoading ? "Calculating…" : "Free"}
                </span>
              </div>
            )}

            <div className="my-2 h-px w-full bg-sa-border" />

            <div className="flex items-end justify-between pt-1">
              <span className="text-[20px] font-bold text-sa-primary">Total</span>
              <p className="flex items-baseline gap-1.5 text-right">
                <span className="text-[12px] text-sa-muted">{currency}</span>
                <span className="text-[28px] font-bold leading-none text-sa-primary">
                  {displayTotal.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
