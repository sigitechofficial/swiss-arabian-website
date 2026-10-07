"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckoutStateShell } from "@/features/checkout/components/CheckoutStateShell";
import { checkoutEyebrow, pageTitle } from "@/styles/shopChrome";
import {
  cbox,
  cboxBody,
  checkoutCta,
  checkoutError,
  checkoutLegal,
  checkoutNote,
  fldFull,
  fldHint,
} from "@/styles/checkoutChrome";
import { storeGuestOrderAccessToken } from "@/features/checkout/utils/checkoutSession";
import { useAuthStore } from "@/stores/useAuthStore";

/** `/track` — find an order by number, with the token from the confirmation email. */
export function TrackLookupView() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [orderNumber, setOrderNumber] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = orderNumber.trim().toUpperCase();
    if (!number) return setError("Enter your order number.");
    if (!isAuthenticated && !token.trim()) {
      return setError("Enter the tracking token from your confirmation email.");
    }
    setError(null);
    // Hand the token over through storage, not the URL.
    if (token.trim()) storeGuestOrderAccessToken(number, token.trim());
    router.push(`/track/${encodeURIComponent(number)}`);
  }

  return (
    <CheckoutStateShell current="Track order">
      <div className="mx-auto w-full max-w-md pb-16">
        <header className="text-center">
          <p className={checkoutEyebrow}>Order tracking</p>
          <h1 className={pageTitle}>Track your order</h1>
          <p className={checkoutNote}>
            Your order number and tracking token are in your order confirmation email.
          </p>
        </header>

        <form className={cbox} onSubmit={submit} noValidate>
          <div className={cboxBody}>
            {error ? (
              <p className={checkoutError} role="alert">
                {error}
              </p>
            ) : null}
            <label className={fldFull}>
              <span>Order number</span>
              <input
                type="text"
                name="orderNumber"
                autoComplete="off"
                spellCheck={false}
                placeholder="UAE-XXXXXXXX-XXXXXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </label>
            <label className={fldFull}>
              <span>
                Tracking token{isAuthenticated ? <span className={fldHint}> (not needed for your own orders)</span> : null}
              </span>
              <input
                type="text"
                name="token"
                autoComplete="off"
                spellCheck={false}
                placeholder="Paste your token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </label>
            <button type="submit" className={checkoutCta}>
              <span>Track order</span>
              <b aria-hidden="true">↗</b>
            </button>
          </div>
        </form>

        <p className={`${checkoutLegal} mt-4`}>
          {isAuthenticated ? (
            <>
              All your orders are in <LocaleLink href="/account/orders">Purchase History</LocaleLink>.
            </>
          ) : (
            <>
              Have an account? <LocaleLink href="/login?returnTo=%2Faccount%2Forders">Sign in</LocaleLink> to see all your
              orders.
            </>
          )}
        </p>
      </div>
    </CheckoutStateShell>
  );
}
