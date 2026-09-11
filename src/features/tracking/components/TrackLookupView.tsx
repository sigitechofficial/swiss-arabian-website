"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckoutStateShell } from "@/features/checkout/components/CheckoutStateShell";
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
        <header className="checkout-head text-center">
          <p className="collection-head__eyebrow">Order tracking</p>
          <h1 className="collection-head__title">Track your order</h1>
          <p className="checkout-note">
            Your order number and tracking token are in your order confirmation email.
          </p>
        </header>

        <form className="cbox" onSubmit={submit} noValidate>
          <div className="cbox__body">
            {error ? (
              <p className="checkout-error" role="alert">
                {error}
              </p>
            ) : null}
            <label className="fld fld--full">
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
            <label className="fld fld--full">
              <span>
                Tracking token{isAuthenticated ? <span className="fld__hint"> (not needed for your own orders)</span> : null}
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
            <button type="submit" className="checkout-cta">
              <span>Track order</span>
              <b className="arrow" aria-hidden="true">↗</b>
            </button>
          </div>
        </form>

        <p className="checkout-legal mt-4">
          {isAuthenticated ? (
            <>
              All your orders are in <Link href="/account/orders">Purchase History</Link>.
            </>
          ) : (
            <>
              Have an account? <Link href="/login?returnTo=%2Faccount%2Forders">Sign in</Link> to see all your
              orders.
            </>
          )}
        </p>
      </div>
    </CheckoutStateShell>
  );
}
