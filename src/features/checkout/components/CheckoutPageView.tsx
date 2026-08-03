"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatMoney } from "@/features/home/data/homeContent";
import { toast } from "@/components/ui/Toaster";
import { useCartStore } from "@/stores/useCartStore";
import {
  CHECKOUT_DISCOUNT_AMOUNT,
  CHECKOUT_DISCOUNT_CODE,
  UAE_EMIRATES,
  checkoutAssets,
} from "../data/checkoutContent";
import {
  checkoutSchema,
  type CheckoutFormValues,
} from "../schemas/checkout.schema";

type PaymentMethod = CheckoutFormValues["paymentMethod"];

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

function PayBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[19px] items-center rounded-[2px] border border-sa-border bg-page px-1 text-[9px] font-bold uppercase tracking-wide text-sa-primary">
      {children}
    </span>
  );
}

function RadioRow({
  selected,
  onSelect,
  label,
  trailing,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
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
          {selected ? (
            <span className="size-2.5 rounded-full bg-terra" />
          ) : null}
        </span>
        <span className="flex-1 text-[14px] font-medium text-sa-primary">
          {label}
        </span>
        {trailing}
      </button>
      {selected && children ? (
        <div className="border-t border-sa-border px-4 pb-4 pt-4">{children}</div>
      ) : null}
    </div>
  );
}

/**
 * Checkout — Figma 475:7363 / section 518:7105
 * Two-column: form (left) + order summary (right)
 */
export function CheckoutPageView() {
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) =>
    s.lines.reduce((sum, line) => sum + line.quantity, 0),
  );

  const [discountApplied, setDiscountApplied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const currency = lines[0]?.currency || "AED";

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayLines = mounted ? lines : [];
  const displaySubtotal = mounted ? subtotal : 0;
  const displayCount = mounted ? itemCount : 0;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
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
      paymentMethod: "card",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      cardName: "",
      useShippingAsBilling: true,
      discountCode: "",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const address = watch("address");
  const city = watch("city");
  const hasAddress = Boolean(address?.trim() && city?.trim());

  const discount = discountApplied ? CHECKOUT_DISCOUNT_AMOUNT : 0;
  const total = Math.max(0, displaySubtotal - discount);

  const shippingHint = useMemo(
    () =>
      hasAddress ? "Standard · Free" : "Add address to see shipping options",
    [hasAddress],
  );

  function applyDiscount() {
    const code = (getValues("discountCode") || "").trim().toUpperCase();
    if (code === CHECKOUT_DISCOUNT_CODE) {
      setDiscountApplied(true);
      toast(`Discount ${CHECKOUT_DISCOUNT_CODE} applied`, "success");
      return;
    }
    setDiscountApplied(false);
    toast("Enter a valid discount code", "error");
  }

  function onSubmit(_data: CheckoutFormValues) {
    if (lines.length === 0) {
      toast("Your cart is empty", "error");
      return;
    }
    // No checkout API wired yet — do not fake order success
    toast("Checkout API not connected yet", "error");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col lg:flex-row">
      {/* Left — form */}
      <div className="flex flex-1 justify-center bg-page px-4 py-10 sm:px-8 lg:px-10 lg:py-14">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-[420px] lg:max-w-[289px] xl:max-w-[420px]"
          noValidate
        >
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

          {/* Contact */}
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
                <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[12px] text-sa-muted">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`flex size-[18px] items-center justify-center border ${
                      field.value
                        ? "border-terra bg-terra"
                        : "border-sa-input bg-page"
                    }`}
                  >
                    {field.value ? (
                      <FieldIcon
                        src={checkoutAssets.check}
                        className="size-2.5 brightness-0 invert"
                      />
                    ) : null}
                  </button>
                  Email me with news and offers
                </label>
              )}
            />
          </section>

          {/* Delivery */}
          <section className="mb-10">
            <h2 className="mb-4 text-[20px] font-bold text-sa-primary">
              Delivery
            </h2>
            <label className="mb-1 block text-[14px] text-sa-muted">
              Country/Region
            </label>
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
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.firstName.message}
                  </p>
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
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.lastName.message}
                  </p>
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
              <p className="-mt-3 mb-3 text-[11px] text-red-600">
                {errors.address.message}
              </p>
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
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.city.message}
                  </p>
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
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.emirate.message}
                  </p>
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
                <p className="mt-1 text-[11px] text-red-600">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>

            <Controller
              name="saveInfo"
              control={control}
              render={({ field }) => (
                <label className="mb-3 flex cursor-pointer items-center gap-2.5 text-[12px] text-sa-muted">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`flex size-[18px] items-center justify-center border ${
                      field.value
                        ? "border-terra bg-terra"
                        : "border-sa-input bg-page"
                    }`}
                  >
                    {field.value ? (
                      <FieldIcon
                        src={checkoutAssets.check}
                        className="size-2.5 brightness-0 invert"
                      />
                    ) : null}
                  </button>
                  Save this information for next time
                </label>
              )}
            />
            <Controller
              name="smsOffers"
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2.5 text-[12px] text-sa-muted">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`flex size-[18px] items-center justify-center border ${
                      field.value
                        ? "border-terra bg-terra"
                        : "border-sa-input bg-page"
                    }`}
                  >
                    {field.value ? (
                      <FieldIcon
                        src={checkoutAssets.check}
                        className="size-2.5 brightness-0 invert"
                      />
                    ) : null}
                  </button>
                  Text me with news and offers
                </label>
              )}
            />
          </section>

          {/* Shipping */}
          <section className="mb-10">
            <h2 className="mb-4 text-[20px] font-bold text-sa-primary">
              Shipping method
            </h2>
            <div className="border border-sa-border bg-section-soft px-4 py-4 text-[12px] text-sa-muted">
              {shippingHint}
            </div>
          </section>

          {/* Payment */}
          <section className="mb-8">
            <h2 className="text-[20px] font-bold text-sa-primary">Payment</h2>
            <p className="mt-1 mb-4 text-[12px] text-sa-muted">
              All transactions are secure and encrypted.
            </p>

            <div className="overflow-hidden border border-sa-border">
              <RadioRow
                selected={paymentMethod === "card"}
                onSelect={() => setValue("paymentMethod", "card")}
                label="Credit card"
                trailing={
                  <span className="flex gap-1">
                    <PayBadge>VISA</PayBadge>
                    <PayBadge>MC</PayBadge>
                    <PayBadge>AMEX</PayBadge>
                  </span>
                }
              >
                <div className="relative mb-3">
                  <input
                    placeholder="Card number"
                    autoComplete="cc-number"
                    className={`${inputClass} pr-10`}
                    {...register("cardNumber")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <FieldIcon src={checkoutAssets.lock} />
                  </span>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <input
                    placeholder="MM / YY"
                    autoComplete="cc-exp"
                    className={inputClass}
                    {...register("cardExpiry")}
                  />
                  <div className="relative">
                    <input
                      placeholder="Security code"
                      autoComplete="cc-csc"
                      className={`${inputClass} pr-10`}
                      {...register("cardCvc")}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <FieldIcon src={checkoutAssets.help} />
                    </span>
                  </div>
                </div>
                <input
                  placeholder="Name on card"
                  autoComplete="cc-name"
                  className={`${inputClass} mb-3`}
                  {...register("cardName")}
                />
                <Controller
                  name="useShippingAsBilling"
                  control={control}
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2.5 text-[12px] text-sa-muted">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={field.value}
                        onClick={() => field.onChange(!field.value)}
                        className={`flex size-[18px] items-center justify-center border ${
                          field.value
                            ? "border-terra bg-terra"
                            : "border-sa-input bg-page"
                        }`}
                      >
                        {field.value ? (
                          <FieldIcon
                            src={checkoutAssets.check}
                            className="size-2.5 brightness-0 invert"
                          />
                        ) : null}
                      </button>
                      Use shipping address as billing address
                    </label>
                  )}
                />
              </RadioRow>

              <RadioRow
                selected={paymentMethod === "wallet"}
                onSelect={() => setValue("paymentMethod", "wallet" as PaymentMethod)}
                label="Apple Pay / Google Pay"
                trailing={
                  <span className="flex gap-1">
                    <PayBadge>APPLE PAY</PayBadge>
                    <PayBadge>G PAY</PayBadge>
                  </span>
                }
              />
              <RadioRow
                selected={paymentMethod === "tabby"}
                onSelect={() => setValue("paymentMethod", "tabby")}
                label="Pay Later with Tabby"
                trailing={
                  <span className="rounded-[2px] bg-[#3bffc0] px-1.5 py-0.5 text-[9px] font-bold text-ink">
                    tabby
                  </span>
                }
              />
              <RadioRow
                selected={paymentMethod === "tamara"}
                onSelect={() => setValue("paymentMethod", "tamara")}
                label="Tamara - Split in 3 payments"
                trailing={
                  <span className="rounded-[2px] bg-[#f7c9b6] px-1.5 py-0.5 text-[9px] font-bold text-ink">
                    tamara
                  </span>
                }
              />
              <RadioRow
                selected={paymentMethod === "cod"}
                onSelect={() => setValue("paymentMethod", "cod")}
                label="Cash on Delivery (COD)"
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitting || displayLines.length === 0}
            className="flex h-10 w-full items-center justify-center bg-terra text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#a25e48] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pay now
          </button>
        </form>
      </div>

      {/* Right — summary */}
      <aside className="w-full border-t border-sa-border bg-ash lg:w-[50%] lg:max-w-[721px] lg:border-l lg:border-t-0 dark:bg-section-soft">
        <div className="mx-auto w-full max-w-[411px] px-6 py-10 lg:px-[60px] lg:py-14">
          {displayLines.length === 0 ? (
            <div className="mb-8 text-center">
              <p className="text-[15px] font-semibold text-sa-primary">
                Your cart is empty
              </p>
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

          <div className="my-6 flex gap-3">
            <input
              placeholder="Discount code"
              className={`${inputClass} flex-1`}
              {...register("discountCode")}
            />
            <button
              type="button"
              onClick={applyDiscount}
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
            {discountApplied ? (
              <div className="flex justify-between">
                <span className="text-sa-muted">
                  Discount ({CHECKOUT_DISCOUNT_CODE})
                </span>
                <span className="font-semibold text-terra">
                  −{formatMoney(discount, currency)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-sa-muted">Shipping</span>
              <span className="text-[12px] text-sa-muted">
                {hasAddress ? "Free" : "Calculated at next step"}
              </span>
            </div>
            <div className="my-2 h-px w-full bg-sa-border" />
            <div className="flex items-end justify-between pt-1">
              <span className="text-[20px] font-bold text-sa-primary">Total</span>
              <p className="flex items-baseline gap-1.5 text-right">
                <span className="text-[12px] text-sa-muted">{currency}</span>
                <span className="text-[28px] font-bold leading-none text-sa-primary">
                  {total.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
